import React from "react";
import {
  Card,
  Icon,
  Select,
  Input,
  Tooltip,
  Form,
  DatePicker,
  Modal,
  Checkbox,
  Switch,
  Button,
  notification,
  Alert,
  Badge
} from "antd";
import _ from "lodash";
import moment from "moment";

import ModelContext from "../ModelContext";

import FormDesign from "./FormDesign";

import apiRequest from "../../../shared/apiRequest";

const FormItem = Form.Item;
const { Option } = Select;
const confirm = Modal.confirm;

class FormModule extends React.Component {
  static contextType = ModelContext;

  state = {
    formDesign: false
    // importExport: { visible: false }
  };

  onChangePrimary = primary => {
    const { stepIndex } = this.props;
    const { form } = this.context;
    const { getFieldValue, setFieldsValue } = form;

    const currentPrimary = getFieldValue(`steps[${stepIndex}].form.primary`);

    // Check if the chosen primary key is unique
    const performCheck = () => {
      const partial = getFieldValue("steps").slice(0, stepIndex);

      apiRequest(`/datalab/check_uniqueness/`, {
        method: "POST",
        payload: { partial, primary },
        onSuccess: result => {
          const { isUnique } = result;
          if (!isUnique) {
            notification["error"]({
              message: "Invalid primary key",
              description: `"${primary}" cannot be used as a primary key
              because the values are not unique.`
            });
            setFieldsValue({
              [`steps[${stepIndex}].form.primary`]: null
            });
          }
        }
      });
    };

    if (currentPrimary) {
      confirm({
        title: "Confirm primary key change",
        content: `All data in this form will be irreversably deleted if the 
          primary key is changed.`,
        okText: "Continue",
        okType: "danger",
        cancelText: "Cancel",
        onOk: () => {
          performCheck();
          setFieldsValue({
            [`steps[${stepIndex}].form.primary`]: primary
          });
        }
      });
    } else {
      performCheck();
      return primary;
    }

    return currentPrimary;
  };

  handleDelete = () => {
    const { deleteModule } = this.context;

    confirm({
      title: "Confirm form deletion",
      content: `If you remove this form module, all data belonging 
        to the form will be permanently lost.`,
      okText: "Continue",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => deleteModule()
    });
  };

  WebForm = () => {
    const { stepIndex, step } = this.props;
    const { form, labelsUsed } = this.context;
    const { getFieldDecorator, getFieldValue } = form;

    const primaryKeys = labelsUsed(stepIndex);

    const primary =
      getFieldValue(`steps[${stepIndex}].form.primary`) ||
      _.get(step, "form.primary");

    return (
      <div style={{ background: "#F5F5F5", padding: "5px 10px" }}>
        <FormItem className="no-explain">
          <Tooltip
            title="Users will only see and be able to enter data in 
            records that are associated with their email address"
            placement="right"
          >
            {getFieldDecorator(`steps[${stepIndex}].form.webForm.permission`, {
              rules: [{ required: true }],
              initialValue: _.get(step, "form.webForm.permission") || undefined
            })(
              <Select placeholder="Grant permission via">
                {primaryKeys.map(primaryKey => (
                  <Option value={primaryKey} key={primaryKey}>
                    {primaryKey}
                  </Option>
                ))}
              </Select>
            )}
          </Tooltip>
        </FormItem>

        <FormItem>
          <Tooltip
            title="You may specify fields from other modules that 
            should be shown in the web form (read only)"
            placement="right"
          >
            {getFieldDecorator(
              `steps[${stepIndex}].form.webForm.visibleFields`,
              {
                initialValue: _.get(step, "form.webForm.visibleFields", [])
              }
            )(
              <Select
                mode="multiple"
                placeholder="Additional fields to show"
                maxTagCount={5}
                maxTagPlaceholder={`...${getFieldValue(
                  `steps[${stepIndex}].form.webForm.visibleFields`
                ).length - 5} more fields selected`}
              >
                {primaryKeys.map(primaryKey => (
                  <Option
                    disabled={primaryKey === primary}
                    value={primaryKey}
                    key={primaryKey}
                  >
                    {primaryKey === primary ? (
                      <Tooltip
                        title="The primary key of the form module is included 
                      in the web form by default"
                      >
                        {primaryKey}
                      </Tooltip>
                    ) : (
                      primaryKey
                    )}
                  </Option>
                ))}
              </Select>
            )}
          </Tooltip>
        </FormItem>

        <FormItem>
          <Tooltip
            title="Choose whether the form will be represented as a single-record 
            vertical form (mobile friendly) or a table (desktop friendly)"
            placement="right"
          >
            {getFieldDecorator(`steps[${stepIndex}].form.webForm.layout`, {
              initialValue: _.get(step, "form.webForm.layout", "vertical")
            })(
              <Select placeholder="Layout">
                <Option value="vertical">Single-record form</Option>
                <Option value="table">Data table</Option>
              </Select>
            )}
          </Tooltip>
        </FormItem>

        <FormItem>
          <Tooltip
            title="Users that have access to the web form will be able to see and 
            edit all records"
            placement="right"
          >
            {getFieldDecorator(`steps[${stepIndex}].form.webForm.showAll`, {
              valuePropName: "checked",
              initialValue: _.get(step, "form.webForm.showAll", false)
            })(<Checkbox />)}
            <span>Show all records</span>
          </Tooltip>
        </FormItem>
      </div>
    );
  };

  // ImportExportFields = () => {
  //   const { stepIndex } = this.props;
  //   const { form } = this.context;
  //   const { importExport } = this.state;
  //   const { getFieldValue, setFieldsValue } = form;

  //   const fields = getFieldValue(`steps[${stepIndex}].form.fields`);

  //   const copyToClipboard = () => {
  //     var textField = document.createElement("textarea");
  //     textField.innerHTML = JSON.stringify(fields, null, 2);
  //     document.body.appendChild(textField);
  //     textField.select();
  //     document.execCommand("copy");
  //     textField.remove();
  //     message.success("Copied fields to clipboard");
  //   };

  //   return (
  //     <Modal
  //       visible={importExport.visible}
  //       title="Export/import fields"
  //       onCancel={() => this.setState({ importExport: { visible: false } })}
  //       onOk={() => {
  //         if (importExport.type === "import") {
  //           setFieldsValue({
  //             [`steps[${stepIndex}].form.fields`]: importExport.importValue
  //           });
  //         }
  //         // this.setState({ importExport: { visible: false } });
  //       }}
  //     >
  //       <RadioGroup
  //         onChange={e =>
  //           this.setState({
  //             importExport: { ...importExport, type: e.target.value }
  //           })
  //         }
  //         value={importExport.type}
  //       >
  //         <RadioButton value="export">Export</RadioButton>
  //         <RadioButton value="import">Import</RadioButton>
  //       </RadioGroup>

  //       {importExport.type === "import" && (
  //         <textarea
  //           value={importExport.importValue}
  //           onChange={e =>
  //             this.setState({
  //               importExport: { ...importExport, importValue: e.target.value }
  //             })
  //           }
  //           className="form_import"
  //           placeholder="Paste the JSON object that describes the
  //           form fields to be imported here..."
  //         />
  //       )}

  //       {importExport.type === "export" && (
  //         <code className="form_export">
  //           <Button
  //             shape="circle"
  //             icon="copy"
  //             size="small"
  //             onClick={copyToClipboard}
  //           />
  //           <pre>{JSON.stringify(fields, null, 2)}</pre>
  //         </code>
  //       )}
  //     </Modal>
  //   );
  // };

  onFormDesignOk = formDesign => {
    const { stepIndex } = this.props;
    const { form } = this.context;
    const { fields } = formDesign;

    form.setFieldsValue({
      [`steps[${stepIndex}].form.fields`]: fields || []
    });
  };

  render() {
    const { stepIndex, step } = this.props;
    const { form, labelsUsed, stepKeys, selectedId } = this.context;
    const { formDesign, requiresSave } = this.state;
    const { getFieldDecorator, getFieldValue, getFieldError } = form;

    getFieldDecorator(`steps[${stepIndex}].type`, {
      initialValue: "form"
    });

    getFieldDecorator(`steps[${stepIndex}].form.fields`, {
      rules: [{ required: true }],
      initialValue:
        getFieldValue(`steps[${stepIndex}].form.fields`) ||
        _.get(step, "form.fields") ||
        []
    });
    const fields =
      getFieldValue(`steps[${stepIndex}].form.fields`) ||
      _.get(step, "form.fields", []);

    getFieldDecorator(`steps[${stepIndex}].form.data`, {
      initialValue: _.get(step, "form.data") || []
    });

    const primaryKeys = labelsUsed(stepIndex);

    // Initialize the array that will hold the datasource's actions
    let actions = [
      // <Tooltip title="Export/import fields">
      //   <Icon
      //     type="select"
      //     onClick={() =>
      //       this.setState({ importExport: { visible: true, type: "export" } })
      //     }
      //   />
      // </Tooltip>
    ];

    // if (getFieldValue(`steps[${stepIndex}].form.webForm.active`))
    //   actions.push(
    //     <Tooltip title="Access URL">
    //       <a
    //         href={`/datalab/${selectedId}/form/${stepIndex}`}
    //         target="_blank"
    //         rel="noopener noreferrer"
    //       >
    //         <Icon type="global" />
    //       </a>
    //     </Tooltip>
    //   );

    // If this is the last step, show the delete button
    if ((stepKeys || []).length === stepIndex + 1)
      actions.push(
        <Tooltip title="Remove form">
          <Icon type="delete" onClick={this.handleDelete} />
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
            <FormItem className="no-explain">
              {getFieldDecorator(`steps[${stepIndex}].form.name`, {
                rules: [{ required: true }],
                initialValue: _.get(step, "form.name")
              })(<Input placeholder="Form name" />)}
            </FormItem>
          </div>
        }
      >
        <Button
          onClick={() => this.setState({ formDesign: true })}
          icon="edit"
          style={{ marginBottom: 5 }}
        >
          Edit form design
          <Badge
            count={fields.length}
            style={{
              marginLeft: 5,
              marginTop: -3,
              backgroundColor: fields.length > 0 ? "#D1C4E9" : "#E53935"
            }}
            showZero
          />
        </Button>

        <FormItem className="no-explain">
          <Tooltip
            title={`The field from the DataLab that will be used 
            to identify the data collected from this form`}
            placement="right"
          >
            {getFieldDecorator(`steps[${stepIndex}].form.primary`, {
              rules: [{ required: true }],
              getValueFromEvent: this.onChangePrimary,
              initialValue: _.get(step, "form.primary")
            })(
              <Select placeholder="Primary key">
                {primaryKeys.map(primaryKey => (
                  <Option value={primaryKey} key={primaryKey}>
                    {primaryKey}
                  </Option>
                ))}
              </Select>
            )}
          </Tooltip>
        </FormItem>

        <FormItem>
          {getFieldDecorator(`steps[${stepIndex}].form.activeFrom`, {
            initialValue: _.get(step, "form.activeFrom")
              ? moment(_.get(step, "form.activeFrom"))
              : undefined
          })(
            <DatePicker
              style={{ width: "100%" }}
              showTime
              className="field"
              format="DD/MM/YYYY HH:mm"
              placeholder="Active from"
            />
          )}
        </FormItem>

        <FormItem>
          {getFieldDecorator(`steps[${stepIndex}].form.activeTo`, {
            initialValue: _.get(step, "form.activeTo")
              ? moment(_.get(step, "form.activeTo"))
              : undefined
          })(
            <DatePicker
              style={{ width: "100%" }}
              showTime
              className="field"
              format="DD/MM/YYYY HH:mm"
              placeholder="Active to"
            />
          )}
        </FormItem>

        <div style={{ display: "flex", alignItems: "center" }}>
          <FormItem style={{ width: "auto" }}>
            {getFieldDecorator(`steps[${stepIndex}].form.webForm.active`, {
              valuePropName: "checked",
              initialValue: _.get(step, "form.webForm.active"),
              onChange: () => this.setState({ requiresSave: true })
            })(<Switch />)}
          </FormItem>

          <span style={{ marginLeft: 10 }}>
            {getFieldValue(`steps[${stepIndex}].form.webForm.active`) ? (
              <span>
                Web form enabled
                <Tooltip
                  title={
                    requiresSave
                      ? "The web form will not be accessible until the DataLab is saved"
                      : ""
                  }
                >
                  <Button
                    size="small"
                    style={{ marginLeft: 5 }}
                    disabled={requiresSave}
                    onClick={() =>
                      window.open(
                        `/datalab/${selectedId}/form/${stepIndex}`,
                        "_blank"
                      )
                    }
                  >
                    <Icon type="link" style={{ marginRight: -2 }} /> Link
                  </Button>
                </Tooltip>
              </span>
            ) : (
              "Web form disabled"
            )}
          </span>
        </div>

        {getFieldValue(`steps[${stepIndex}].form.webForm.active`) &&
          this.WebForm()}

        <FormDesign
          stepIndex={stepIndex}
          fields={fields}
          visible={formDesign}
          closeModal={() => this.setState({ formDesign: false })}
          onOk={this.onFormDesignOk}
        />

        {getFieldError(`steps[${stepIndex}].form.fields`) && (
          <Alert
            style={{ marginTop: 5 }}
            type="error"
            message="At least one field is required in the form design"
          />
        )}
      </Card>
    );
  }
}

export default FormModule;
