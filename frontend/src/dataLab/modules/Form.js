import React from "react";
import {
  Card,
  Icon,
  Select,
  Input,
  Tooltip,
  Form,
  DatePicker,
  Divider,
  Popover,
  notification,
  Modal
} from "antd";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import moment from "moment";

import * as DataLabActionCreators from "../DataLabActions";

const FormItem = Form.Item;
const { Option } = Select;
const confirm = Modal.confirm;

class FormModule extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = {};
  }

  componentDidMount() {
    const { build, stepIndex } = this.props;

    this.setState({
      currentStep: build.steps[stepIndex].form,
      errors: build.errors.steps[stepIndex],
      primaryKeys: []
    });
  }

  componentDidUpdate(prevProps) {
    const { stepIndex, usedLabels } = this.props;

    const newState = {};

    if (prevProps.usedLabels !== usedLabels) {
      newState.primaryKeys = usedLabels
        .filter(item => item.stepIndex < stepIndex)
        .map(item => item.label);
      newState.usedLabels = usedLabels.map(item => item.label);
    }

    if (Object.keys(newState).length) this.setState(newState);
  }

  modifyFormField = (field, fieldIndex) => {
    const { stepIndex, openFormFieldModal } = this.props;
    const { usedLabels } = this.state;

    const updateBuild = (fieldName, value, isNotfield) => {
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: fieldName,
        value,
        isNotfield
      });
    };

    openFormFieldModal({
      stepIndex,
      usedLabels,
      field,
      fieldIndex,
      updateBuild
    });
  };

  handlePrimaryChange = e => {
    const { stepIndex } = this.props;

    confirm({
      title: "Confirm primary key change",
      content:
        "All data in this form will be irreversably deleted if the primary key is changed.",
      okText: "Continue",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => performCheck()
    });

    // Check if the chosen primary key is unique
    const performCheck = () =>
      this.boundActionCreators.checkForUniqueness({
        stepIndex,
        primaryKey: e,
        onFinish: result => {
          const { isUnique } = result;
          if (isUnique) {
            this.boundActionCreators.updateBuild({
              stepIndex,
              field: "data",
              value: []
            });
            this.boundActionCreators.updateBuild({
              stepIndex,
              field: "primary",
              value: e
            });
          } else {
            notification["error"]({
              message: "Invalid primary key",
              description: `"${e}" cannot be used as a primary key because the values are not unique.`
            });
          }
        }
      });
  };

  render() {
    const { build, stepIndex, validate } = this.props;
    const { currentStep, primaryKeys } = this.state;

    if (!currentStep) return null;

    // Initialize the array that will hold the datasource's actions
    let actions = [
      <Tooltip title="Add field">
        <Icon type="plus" onClick={() => this.modifyFormField()} />
      </Tooltip>
    ];
    // If this is the last step, show the delete button
    if (build.steps.length === stepIndex + 1)
      actions.push(
        <Tooltip title="Remove form">
          <Icon
            type="delete"
            onClick={() => this.boundActionCreators.deleteModule()}
          />
        </Tooltip>
      );

    return (
      <Card
        className="form"
        actions={actions}
        title={
          <div className="title">
            <div className="step_number">{stepIndex + 1}</div>
            <Icon type="form" className="title_icon" />
            <FormItem validateStatus={validate({ field: "name", stepIndex })}>
              <Input
                placeholder="Form name"
                value={currentStep.name}
                onChange={e =>
                  this.boundActionCreators.updateBuild({
                    stepIndex,
                    field: "name",
                    value: e.target.value
                  })
                }
              />
            </FormItem>
          </div>
        }
      >
        <FormItem>
          <DatePicker
            showTime
            className="field"
            format="DD/MM/YYYY HH:mm"
            placeholder="Active from"
            value={
              currentStep.activeFrom ? moment(currentStep.activeFrom) : null
            }
            onChange={e =>
              this.boundActionCreators.updateBuild({
                stepIndex,
                field: "activeFrom",
                value: e
              })
            }
          />
        </FormItem>

        <FormItem validateStatus={validate({ field: "activeTo", stepIndex })}>
          <DatePicker
            showTime
            className="field"
            format="DD/MM/YYYY HH:mm"
            placeholder="Active to"
            value={currentStep.activeTo ? moment(currentStep.activeTo) : null}
            onChange={e =>
              this.boundActionCreators.updateBuild({
                stepIndex,
                field: "activeTo",
                value: e
              })
            }
          />
        </FormItem>
        {validate({ field: "activeTo", stepIndex }) && (
          <p className="error">Active to cannot be before active from.</p>
        )}

        <FormItem validateStatus={validate({ field: "primary", stepIndex })}>
          <Tooltip
            title="You must specify which field from the DataLab should be used to identify the data collected from this form"
            placement="right"
          >
            <Select
              placeholder="Primary key"
              value={currentStep.primary}
              onChange={this.handlePrimaryChange}
            >
              {primaryKeys.map(primaryKey => (
                <Option value={primaryKey} key={primaryKey}>
                  {primaryKey}
                </Option>
              ))}
            </Select>
          </Tooltip>
        </FormItem>

        <Divider className="added_fields">Added fields</Divider>

        {"fields" in currentStep && currentStep.fields.length === 0 ? (
          validate({ field: "fields", stepIndex }) ? (
            <p className="error">The form must have at least one field.</p>
          ) : (
            <p>Add a field by clicking the button below.</p>
          )
        ) : (
          <Tooltip
            title="Edit a given field by clicking on its name"
            placement="right"
          >
            <Select
              disabled
              mode="tags"
              dropdownStyle={{ display: "none" }}
              labelInValue={true}
              className="fields"
              value={currentStep.fields.map((field, fieldIndex) => {
                const label = field.name;

                const truncatedLabel =
                  label.length > 20 ? `${label.slice(0, 20)}...` : label;

                return {
                  key: label,
                  label: (
                    <span
                      onClick={() => this.modifyFormField(field, fieldIndex)}
                    >
                      {truncatedLabel !== label ? (
                        <Popover
                          content={label}
                          overlayStyle={{ zIndex: 2000 }}
                          mouseLeaveDelay={0}
                        >
                          {truncatedLabel}
                        </Popover>
                      ) : (
                        label
                      )}
                    </span>
                  )
                };
              })}
            />
          </Tooltip>
        )}
      </Card>
    );
  }
}

const mapStateToProps = state => {
  const { build } = state.dataLab;

  return {
    build
  };
};

export default connect(mapStateToProps)(FormModule);
