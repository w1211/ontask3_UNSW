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
  Modal,
  Tabs,
  Checkbox,
  Switch,
  Alert,
  Radio,
  Button,
  message
} from "antd";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import moment from "moment";
import _ from "lodash";

import * as DataLabActionCreators from "../DataLabActions";

const FormItem = Form.Item;
const { Option } = Select;
const confirm = Modal.confirm;
const TabPane = Tabs.TabPane;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class FormModule extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = {
      tab: "fields",
      importExport: { visible: false }
    };
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

    const updateBuild = (fieldName, value, isNotField) => {
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: fieldName,
        value,
        isNotField
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
    const { selectedId, stepIndex } = this.props;
    const { currentStep } = this.state;

    // Check if the chosen primary key is unique
    const performCheck = () =>
      this.boundActionCreators.checkForUniqueness({
        dataLabId: selectedId,
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

    if (currentStep.primary) {
      confirm({
        title: "Confirm primary key change",
        content:
          "All data in this form will be irreversably deleted if the primary key is changed.",
        okText: "Continue",
        okType: "danger",
        cancelText: "Cancel",
        onOk: () => performCheck()
      });
    } else {
      performCheck();
    }
  };

  handleDelete = () => {
    confirm({
      title: "Confirm form deletion",
      content:
        "If you remove this form module, all data belonging to the form will be permanently lost.",
      okText: "Continue",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => this.boundActionCreators.deleteModule()
    });
  };

  Fields = () => {
    const { stepIndex, validate } = this.props;
    const { currentStep, primaryKeys } = this.state;

    return (
      <div className="form_tab">
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
      </div>
    );
  };

  WebForm = () => {
    const { stepIndex, validate } = this.props;
    const { currentStep, primaryKeys, didChangeActive } = this.state;

    return (
      <div className="form_tab web_form">
        <FormItem>
          <Switch
            checked={_.get(currentStep, "webForm.active")}
            onChange={e => {
              this.boundActionCreators.updateBuild({
                stepIndex,
                field: "webForm.active",
                value: e
              });
              this.setState({ didChangeActive: true });
            }}
          />
          <span className="field_label">
            {_.get(currentStep, "webForm.active")
              ? "Web form enabled"
              : "Web form disabled"}
          </span>
        </FormItem>

        <FormItem
          validateStatus={validate({ field: "webForm.permission", stepIndex })}
        >
          <Tooltip
            title="Users will only see and be able to enter data in records that are associated with their email address"
            placement="right"
          >
            <Select
              placeholder="Grant permission via"
              value={_.get(currentStep, "webForm.permission")}
              onChange={e =>
                this.boundActionCreators.updateBuild({
                  stepIndex,
                  field: "webForm.permission",
                  value: e
                })
              }
            >
              {primaryKeys.map(primaryKey => (
                <Option value={primaryKey} key={primaryKey}>
                  {primaryKey}
                </Option>
              ))}
            </Select>
          </Tooltip>
        </FormItem>

        <FormItem>
          <Tooltip
            title="You may specify fields from other modules that should be shown in the web form (read only)"
            placement="right"
          >
            <Select
              mode="multiple"
              placeholder="Additional fields to show"
              value={_.get(currentStep, "webForm.visibleFields")}
              maxTagCount={5}
              maxTagPlaceholder={`...${_.get(
                currentStep,
                "webForm.visibleFields",
                []
              ).length - 5} more fields selected`}
              onChange={e =>
                this.boundActionCreators.updateBuild({
                  stepIndex,
                  field: "webForm.visibleFields",
                  value: e
                })
              }
            >
              {primaryKeys.map(primaryKey => (
                <Option
                  disabled={primaryKey === currentStep.primary}
                  value={primaryKey}
                  key={primaryKey}
                >
                  {primaryKey === currentStep.primary ? (
                    <Tooltip title="The primary key of the form module is included in the web form by default">
                      {primaryKey}
                    </Tooltip>
                  ) : (
                    primaryKey
                  )}
                </Option>
              ))}
            </Select>
          </Tooltip>
        </FormItem>

        <FormItem
          validateStatus={validate({ field: "webForm.layout", stepIndex })}
        >
          <Tooltip
            title={`Choose whether the form will be represented as a single-record vertical 
            form (mobile friendly) or a table (desktop friendly)`}
            placement="right"
          >
            <Select
              placeholder="Layout"
              value={_.get(currentStep, "webForm.layout")}
              onChange={e =>
                this.boundActionCreators.updateBuild({
                  stepIndex,
                  field: "webForm.layout",
                  value: e
                })
              }
            >
              <Option value="vertical">Single-record form</Option>
              <Option value="table">Data table</Option>
            </Select>
          </Tooltip>
        </FormItem>

        <FormItem>
          <Tooltip
            title="Users that have access to the web form will be able to see and edit all records"
            placement="right"
          >
            <Checkbox
              checked={_.get(currentStep, "webForm.showAll")}
              onChange={e =>
                this.boundActionCreators.updateBuild({
                  stepIndex,
                  field: "webForm.showAll",
                  value: e.target.checked
                })
              }
            />
            <span>Show all records</span>
          </Tooltip>
        </FormItem>

        {_.get(currentStep, "webForm.active") && didChangeActive && (
          <Alert
            showIcon
            type="info"
            message="This web form will not be accessible until the DataLab is saved"
          />
        )}
      </div>
    );
  };

  ImportExportFields = () => {
    const { stepIndex } = this.props;
    const { currentStep, importExport } = this.state;

    const copyToClipboard = () => {
      var textField = document.createElement("textarea");
      textField.innerHTML = JSON.stringify(currentStep.fields, null, 2);
      document.body.appendChild(textField);
      textField.select();
      document.execCommand("copy");
      textField.remove();
      message.success("Copied fields to clipboard");
    };

    return (
      <Modal
        visible={importExport.visible}
        title="Export/import fields"
        onCancel={() => this.setState({ importExport: { visible: false } })}
        onOk={() => {
          if (importExport.type === "import") {
            this.boundActionCreators.updateBuild({
              stepIndex,
              field: "import",
              value: importExport.importValue,
              isNotField: true
            });
          }

          this.setState({ importExport: { visible: false } });
        }}
      >
        <RadioGroup
          onChange={e =>
            this.setState({
              importExport: { ...importExport, type: e.target.value }
            })
          }
          value={importExport.type}
        >
          <RadioButton value="export">Export</RadioButton>
          <RadioButton value="import">Import</RadioButton>
        </RadioGroup>

        {importExport.type === "import" && (
          <textarea
            value={importExport.importValue}
            onChange={e =>
              this.setState({
                importExport: { ...importExport, importValue: e.target.value }
              })
            }
            className="form_import"
            placeholder="Paste the JSON object that describes the form fields to be imported here..."
          />
        )}

        {importExport.type === "export" && (
          <code className="form_export">
            <Button
              shape="circle"
              icon="copy"
              size="small"
              onClick={copyToClipboard}
            />
            <pre>{JSON.stringify(currentStep.fields, null, 2)}</pre>
          </code>
        )}
      </Modal>
    );
  };

  render() {
    const { build, stepIndex, validate, selectedId } = this.props;
    const { currentStep, tab, didChangeActive } = this.state;

    if (!currentStep) return null;

    // Initialize the array that will hold the datasource's actions
    let actions = [];

    if (tab === "fields")
      actions.push(
        <Tooltip title="Add field">
          <Icon type="plus" onClick={() => this.modifyFormField()} />
        </Tooltip>,
        <Tooltip title="Export/import fields">
          <Icon
            type="select"
            onClick={() =>
              this.setState({ importExport: { visible: true, type: "export" } })
            }
          />
        </Tooltip>
      );

    if (
      tab === "webForm" &&
      _.get(currentStep, "webForm.active") &&
      !didChangeActive
    )
      actions.push(
        <Tooltip title="Access URL">
          <a
            href={`/datalab/${selectedId}/form/${stepIndex}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon type="global" />
          </a>
        </Tooltip>
      );

    // If this is the last step, show the delete button
    if (build.steps.length === stepIndex + 1)
      actions.push(
        <Tooltip title="Remove form">
          <Icon type="delete" onClick={this.handleDelete} />
        </Tooltip>
      );

    return (
      <Card
        className="form"
        actions={actions}
        bodyStyle={{ padding: 0 }}
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
        <Tabs
          activeKey={tab}
          type="card"
          onChange={e => this.setState({ tab: e })}
        >
          <TabPane tab="Fields" key="fields">
            {this.Fields()}
          </TabPane>

          <TabPane tab="Web Form" key="webForm">
            {this.WebForm()}
          </TabPane>
        </Tabs>

        {this.ImportExportFields()}
      </Card>
    );
  }
}

const mapStateToProps = state => {
  const { build, selectedId } = state.dataLab;

  return {
    build,
    selectedId
  };
};

export default connect(mapStateToProps)(FormModule);
