import React from "react";
import {
  Card,
  Icon,
  Select,
  Input,
  Tooltip,
  message,
  Form,
  Popover,
  notification
} from "antd";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import _ from "lodash";

import * as DataLabActionCreators from "../DataLabActions";

const { Option, OptGroup } = Select;
const FormItem = Form.Item;

class DatasourceModule extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = {
      editing: { isEditing: false }
    };
  }

  componentDidMount() {
    const { build, stepIndex } = this.props;

    this.setState({
      currentStep: build.steps[stepIndex].datasource,
      errors: build.errors.steps[stepIndex],
      datasource: this.getThisDatasource(build.steps[stepIndex].datasource.id)
    });
  }

  componentDidUpdate(prevProps) {
    const { stepIndex, usedLabels } = this.props;

    const newState = {};

    if (prevProps.usedLabels !== usedLabels) {
      newState.matchingFields = usedLabels
        .filter(item => item.stepIndex < stepIndex)
        .map(item => item.label);
      newState.usedLabels = usedLabels.map(item => item.label);
    }

    if (Object.keys(newState).length) this.setState(newState);
  }

  getThisDatasource = datasourceId => {
    const { datasources } = this.props;
    const { currentStep } = this.state;

    // Find the datasource object representing this datasource (if chosen)
    let comparator = datasourceId
      ? datasourceId
      : currentStep && currentStep.id;
    return datasources.find(datasource => datasource.id === comparator);
  };

  handleOutsideClick = e => {
    // If the click was not outside, then do nothing
    if (this.dropdown.contains(e.target)) return;

    document.removeEventListener("click", this.handleOutsideClick, false);
    this.setState({ editing: { isEditing: false } });
    this.select.focus();
    this.select.blur();
  };

  addAllFields = () => {
    const { stepIndex } = this.props;
    const { currentStep, datasource, usedLabels } = this.state;

    const fieldsToAdd = datasource.fields.filter(
      field => !currentStep.fields.includes(field)
    );

    fieldsToAdd.forEach(field => {
      if (usedLabels.includes(field)) {
        message.error(
          `'${field}' cannot be added automatically as this field name is already being used in the DataLab.`
        );
      } else {
        this.boundActionCreators.updateBuild({
          stepIndex,
          field: "labels",
          value: { ...currentStep.labels, [field]: field }
        });
        this.boundActionCreators.updateBuild({
          stepIndex,
          field: "fields",
          value: [...currentStep.fields, field]
        });
      }
    });
  };

  removeAllFields = () => {
    const { stepIndex, hasDependency } = this.props;
    const { currentStep } = this.state;

    currentStep.fields.forEach(field => {
      if (hasDependency(stepIndex, field)) {
        message.error(
          `'${field}' cannot be removed because another component depends on it.`
        );
      } else {
        this.boundActionCreators.updateBuild({
          stepIndex,
          field: "remove",
          value: field,
          isNotField: true
        });
      }
    });
  };

  handleFieldsChange = e => {
    const { stepIndex, hasDependency } = this.props;
    const { currentStep, usedLabels, editing } = this.state;

    const fields = currentStep.fields;

    // Don't allow fields to be added whilst in editing mode
    if (editing.isEditing) return;

    // Add all fields utility was clicked
    if (e.slice(-1)[0] === "_all") {
      this.addAllFields();
      // Remove all fields utility was clicked
    } else if (e.slice(-1)[0] === "_none") {
      this.removeAllFields();
      // A single field was added
    } else if (e.length > fields.length) {
      // Identify the field added
      const field = e.filter(field => !fields.includes(field))[0];

      // If this field name is a duplicate of an existing label in the build
      if (usedLabels.includes(field)) {
        // Generate a label for this field
        // Show the edit input field for the label
        this.onEdit({
          field,
          label: this.generateLabel(field),
          isRequired: true
        });
      } else {
        // Not a duplicate, therefore use the field name as-is
        this.boundActionCreators.updateBuild({
          stepIndex,
          field: "labels",
          value: { ...currentStep.labels, [field]: field }
        });
        this.boundActionCreators.updateBuild({
          stepIndex,
          field: "fields",
          value: e
        });
      }
      // A single field was removed
    } else if (e.length < fields.length) {
      // Identify the field removed
      const field = fields.filter(field => !e.includes(field))[0];

      if (hasDependency(stepIndex, field)) {
        message.error(
          `'${field}' cannot be removed because another component depends on it.`
        );
      } else {
        this.boundActionCreators.updateBuild({
          stepIndex,
          field: "remove",
          value: field,
          isNotField: true
        });
      }
    }
  };

  generateLabel = field => {
    const { usedLabels } = this.state;

    let suffix = 1;
    while (usedLabels.includes(`${field}_${suffix}`)) {
      suffix += 1;
    }
    return `${field}_${suffix}`;
  };

  onEdit = ({ e, field, label, isRequired }) => {
    const { stepIndex, hasDependency } = this.props;
    const { currentStep } = this.state;

    if (e) e.stopPropagation();

    if (!label) label = currentStep.labels[field];

    if (hasDependency(stepIndex, field)) {
      message.error(
        `'${field}' cannot be renamed because another component depends on it.`
      );
      return;
    }

    this.setState({
      editing: { isEditing: true, field, label, isRequired }
    });
    this.boundActionCreators.updateBuild({
      stepIndex,
      field: "edit",
      value: field,
      isNotField: true
    });
    document.addEventListener("click", this.handleOutsideClick, false);
  };

  confirmEdit = () => {
    const { stepIndex } = this.props;
    const { currentStep, editing, usedLabels } = this.state;

    if (!editing.label) {
      message.error("Label cannot be empty.");
      return;
    }

    if (usedLabels.includes(editing.label)) {
      message.error("This label is already being used.");
    } else {
      this.cancelEdit();
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: "labels",
        value: { ...currentStep.labels, [editing.field]: editing.label }
      });
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: "fields",
        value: [...currentStep.fields, editing.field]
      });
      document.removeEventListener("click", this.handleOutsideClick, false);
    }
  };

  cancelEdit = () => {
    document.removeEventListener("click", this.handleOutsideClick, false);

    this.setState(
      // Set editing mode to false
      () => {
        return { editMode: false, editing: {} };
      },
      // After setState completes, perform a callback which focuses the select
      () => {
        this.select.focus();
      }
    );
  };

  handleMatchingFieldChange = e => {
    const { selectedId, stepIndex, openDiscrepenciesModal } = this.props;
    const { datasource } = this.state;

    this.boundActionCreators.updateBuild({
      stepIndex,
      field: "matching",
      value: e
    });

    const onResolve = values =>
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: "discrepencies",
        value: values
      });

    const onCancel = () =>
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: "matching",
        value: null
      });

    // Check if there are discrepencies
    this.boundActionCreators.checkForDiscrepencies({
      dataLabId: selectedId,
      stepIndex,
      onFinish: discrepencies => {
        if ("matching" in discrepencies || "primary" in discrepencies)
          openDiscrepenciesModal({
            discrepencies,
            datasource: datasource.name,
            onResolve,
            onCancel
          });
      }
    });
  };

  editDiscrepencySettings = () => {
    const { selectedId, stepIndex, openDiscrepenciesModal } = this.props;
    const { datasource } = this.state;

    const onResolve = values =>
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: "discrepencies",
        value: values
      });

    const clearDiscrepencies = () => {
      notification["info"]({
        message: "No discrepencies found",
        description:
          "Discrepencies were no longer detected between this module and the DataLab"
      });
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: "discrepencies",
        value: null
      });
    };

    // Check if there are discrepencies
    this.boundActionCreators.checkForDiscrepencies({
      dataLabId: selectedId,
      stepIndex,
      onFinish: discrepencies => {
        if (Object.keys(discrepencies).length) {
          openDiscrepenciesModal({
            discrepencies,
            datasource: datasource.name,
            onResolve
          });
        } else {
          clearDiscrepencies();
        }
      }
    });
  };

  onFocusEdit = e => {
    // On focus, move the cursor to the end of the input
    const temp_value = e.target.value;
    e.target.value = "";
    e.target.value = temp_value;
  };

  render() {
    const {
      datasources,
      build,
      stepIndex,
      usedDatasources,
      validate
    } = this.props;
    const { editing, currentStep, datasource, matchingFields } = this.state;

    if (!currentStep) return null;

    // Initialize the array that will hold the datasource's actions
    let actions = [];
    // If this datasource has discrepencies, show the discrepencies button
    if (currentStep.discrepencies)
      actions.push(
        <Tooltip title="Manage discrepencies">
          <Icon type="disconnect" onClick={this.editDiscrepencySettings} />
        </Tooltip>
      );
    // If this is the last step, show the delete button
    if (build.steps.length === stepIndex + 1)
      actions.push(
        <Tooltip title="Remove datasource">
          <Icon
            type="delete"
            onClick={() => this.boundActionCreators.deleteModule()}
          />
        </Tooltip>
      );

    return (
      <Card
        className="datasource"
        actions={actions}
        title={
          <div className="title">
            <div className="step_number">{stepIndex + 1}</div>
            <Icon type="database" className="title_icon" />
            <FormItem validateStatus={validate({ field: "id", stepIndex })}>
              <Select
                placeholder="Choose datasource"
                value={currentStep.id}
                onChange={e => {
                  this.boundActionCreators.updateBuild({
                    stepIndex,
                    field: "id",
                    value: e
                  });
                  this.setState({ datasource: this.getThisDatasource(e) });
                }}
              >
                {datasources.map((datasource, i) => (
                  <Option
                    value={datasource.id}
                    key={i}
                    disabled={usedDatasources.includes(datasource.id)}
                  >
                    {datasource.name}
                  </Option>
                ))}
              </Select>
            </FormItem>
          </div>
        }
      >
        <FormItem validateStatus={validate({ field: "primary", stepIndex })}>
          <Tooltip
            title={
              !datasource
                ? "A datasource must be chosen first"
                : "The field from this datasource which uniquely identifies each of the records"
            }
            placement="right"
          >
            <Select
              placeholder="Primary key"
              value={currentStep.primary}
              onChange={e =>
                this.boundActionCreators.updateBuild({
                  stepIndex,
                  field: "primary",
                  value: e
                })
              }
              disabled={!datasource}
            >
              {datasource &&
                datasource.fields.map((field, i) => (
                  <Option value={field} key={i}>
                    {field}
                  </Option>
                ))}
            </Select>
          </Tooltip>
        </FormItem>

        {stepIndex > 0 && (
          <FormItem validateStatus={validate({ field: "matching", stepIndex })}>
            <Tooltip
              title={
                !datasource
                  ? "A datasource must be chosen first"
                  : !currentStep.primary
                    ? "A primary key must be chosen first"
                    : `In order to join the data from this datasource with the DataLab, 
                      you must specify which field from the DataLab will be matched against 
                      the primary key (specified above)`
              }
              placement="right"
            >
              <Select
                placeholder="Matching field"
                value={currentStep.matching}
                onChange={this.handleMatchingFieldChange}
                disabled={!datasource || !currentStep.primary}
              >
                {matchingFields &&
                  matchingFields.map(label => (
                    <Option value={label} key={label}>
                      {label}
                    </Option>
                  ))}
              </Select>
            </Tooltip>
          </FormItem>
        )}

        <div
          id={`dropdown_${stepIndex}`}
          ref={dropdown => (this.dropdown = dropdown)}
        />

        <FormItem validateStatus={validate({ field: "fields", stepIndex })}>
          <Tooltip
            title={
              !datasource
                ? "A datasource must be chosen first"
                : "The fields from this datasource that should be added to the DataLab"
            }
            placement="right"
          >
            <Select
              mode="multiple"
              className="select"
              dropdownClassName="select_dropdown"
              placeholder="Fields"
              value={currentStep.fields}
              onChange={this.handleFieldsChange}
              disabled={editing.isEditing || !datasource}
              maxTagCount={10}
              maxTagPlaceholder={`...${currentStep.fields.length -
                10} more fields selected`}
              getPopupContainer={() =>
                document.getElementById(`dropdown_${stepIndex}`)
              }
              ref={select => {
                this.select = select;
              }}
            >
              <OptGroup label="Utilities">
                <Option key="_all">Select all</Option>
                <Option key="_none">Reset</Option>
              </OptGroup>

              <OptGroup label="Datasource fields">
                {datasource &&
                  datasource.fields.map((field, i) => {
                    const isEditing = editing.field === field;

                    const label = _.get(currentStep, `labels[${field}]`, field);

                    const truncatedLabel =
                      label.length > 20 ? `${label.slice(0, 20)}...` : label;

                    return (
                      <Option
                        disabled={editing.isEditing}
                        value={field}
                        key={i}
                        className={isEditing && "editing_field"}
                      >
                        {isEditing ? (
                          <div className="editing_input">
                            <Tooltip
                              title={
                                editing.isRequired &&
                                `A label is required, as a field with name '${field}' already exists in the DataLab`
                              }
                              placement="bottom"
                            >
                              <Input
                                ref={input => input && input.focus()}
                                size="small"
                                value={editing.label}
                                onFocus={this.onFocusEdit}
                                onChange={e => {
                                  this.setState({
                                    editing: {
                                      ...editing,
                                      label: e.target.value
                                    }
                                  });
                                }}
                                onKeyDown={e => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") this.confirmEdit();
                                  if (e.key === "Escape") this.cancelEdit();
                                }}
                              />
                            </Tooltip>
                            <div>
                              <Icon type="close" onClick={this.cancelEdit} />
                              <Icon type="save" onClick={this.confirmEdit} />
                            </div>
                          </div>
                        ) : (
                          <div className="normal_field">
                            {truncatedLabel !== label ? (
                              <Popover
                                content={label}
                                overlayStyle={{ zIndex: 2000 }}
                              >
                                {truncatedLabel}
                              </Popover>
                            ) : (
                              label
                            )}
                            {!editing.isEditing && (
                              <Icon
                                type="edit"
                                onClick={e => this.onEdit({ e, field, label })}
                              />
                            )}
                          </div>
                        )}
                      </Option>
                    );
                  })}
              </OptGroup>
            </Select>
          </Tooltip>
        </FormItem>
      </Card>
    );
  }
}

const mapStateToProps = state => {
  const { build, datasources, selectedId } = state.dataLab;
  
  return {
    build,
    datasources,
    selectedId
  };
};

export default connect(mapStateToProps)(DatasourceModule);
