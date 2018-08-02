import React from "react";
import {
  Modal,
  Input,
  InputNumber,
  Form,
  Select,
  Checkbox,
  Icon,
  Tooltip,
  Button,
  Alert,
  message,
  Radio
} from "antd";

import FormItemLayout from "../../shared/FormItemLayout";

const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class FormFieldModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = { options: [], error: null };
  }

  componentWillReceiveProps(nextProps) {
    const { options } = this.state;

    const field = nextProps.field;
    if (field && "options" in field && options.length === 0)
      this.setState({ options: field.options });
  }

  handleOk = () => {
    const { form, field, fieldIndex, updateBuild } = this.props;
    const { options } = this.state;

    const { getFieldValue } = form;

    let optionsError = false;

    form.validateFields((formError, values) => {
      if (
        getFieldValue("textDisplay") === "list" ||
        (!getFieldValue("textDisplay") && field && field.textDisplay === "list")
      ) {
        if (options.length === 0) {
          this.setState({ error: "At least one option must be added" });
          optionsError = true;
        }

        options &&
          options.forEach(option => {
            if ((!option.label || !option.value) && !optionsError) {
              this.setState({
                error: "All options must have a label and value"
              });
              optionsError = true;
            }
          });

        values = { ...values, options };
      }

      if (formError || optionsError) return;

      if (field) {
        updateBuild(`fields[${fieldIndex}]`, values);
      } else {
        updateBuild("add", values, true);
      }

      this.handleClose();
    });
  };

  handleClose = () => {
    const { form, onCancel, closeFormFieldModal } = this.props;

    this.setState({ options: [], error: null });
    form.resetFields();
    if (onCancel) onCancel();
    closeFormFieldModal();
  };

  handleDelete = () => {
    const {
      stepIndex,
      fieldIndex,
      field,
      updateBuild,
      hasDependency
    } = this.props;

    if (hasDependency(stepIndex, field.name)) {
      message.error(
        `'${
          field.name
        }' cannot be removed as it is being used as a matching field.`
      );
    } else {
      confirm({
        title: "Confirm field deletion",
        content: `Are you sure you want to delete this field from the form? 
          Any data entered in the form for this field will be lost.`,
        onOk: () => {
          updateBuild("delete", fieldIndex, true);
          this.handleClose();
        }
      });
    }
  };

  render() {
    const { visible, form, field, usedLabels } = this.props;
    const { options, error } = this.state;

    const { getFieldDecorator, getFieldValue } = form;

    return (
      <Modal
        className="formField"
        visible={visible}
        title={`${field ? "Edit" : "Add"} field`}
        onCancel={this.handleClose}
        footer={
          <div>
            <Button onClick={this.handleClose}>Cancel</Button>
            {field && (
              <Button type="danger" onClick={this.handleDelete}>
                Delete
              </Button>
            )}
            <Button type="primary" onClick={this.handleOk}>
              {field ? "Update" : "Add"}
            </Button>
          </div>
        }
      >
        <FormItem
          {...FormItemLayout}
          label={
            <div className="field_label">
              Field name
              <Tooltip title="The name for this field in the DataLab">
                <Icon type="question-circle-o" />
              </Tooltip>
            </div>
          }
        >
          {getFieldDecorator("name", {
            rules: [
              { required: true, message: "Field name is required" },
              {
                message: "Field name is already being used in the DataLab",
                validator: (rule, value, cb) => {
                  if (field && field.name === value) cb();
                  usedLabels.includes(value) ? cb(true) : cb();
                }
              }
            ],
            initialValue: field && field.name
          })(<Input />)}
        </FormItem>

        <FormItem {...FormItemLayout} label="Field type">
          {getFieldDecorator("type", {
            rules: [{ required: true, message: "Field type is required" }],
            initialValue: field && field.type,
            onChange: () => this.setState({ error: null })
          })(
            <Select className="field">
              <Option value="text">Text</Option>
              <Option value="number">Number</Option>
              <Option value="date">Date</Option>
              <Option value="checkbox">Checkbox</Option>
            </Select>
          )}
        </FormItem>

        {(getFieldValue("type") === "text" ||
          (!getFieldValue("type") && field && field.type === "text")) && (
          <div>
            <FormItem {...FormItemLayout} label="Display">
              {getFieldDecorator("textDisplay", {
                initialValue:
                  field && field.textDisplay ? field.textDisplay : "input",
                onChange: () => this.setState({ error: null })
              })(
                <RadioGroup>
                  <RadioButton value="input">Input</RadioButton>
                  <RadioButton value="list">List</RadioButton>
                </RadioGroup>
              )}
            </FormItem>

            {getFieldValue("textDisplay") === "input" ||
            (!getFieldValue("textDisplay") &&
              field &&
              field.textDisplay === "input") ? (
              <div>
                <FormItem {...FormItemLayout} label="Multi-line input">
                  {getFieldDecorator("textArea", {
                    initialValue: field ? field.textArea : false,
                    valuePropName: "checked"
                  })(<Checkbox />)}
                </FormItem>

                <FormItem {...FormItemLayout} label="Max characters">
                  {getFieldDecorator("maxLength", {
                    initialValue: field && field.maxLength
                  })(<InputNumber min={1} />)}
                </FormItem>
              </div>
            ) : (
              <div>
                <FormItem {...FormItemLayout} label="List style">
                  {getFieldDecorator("listStyle", {
                    initialValue:
                      field && field.listStyle ? field.listStyle : "dropdown"
                  })(
                    <RadioGroup>
                      <RadioButton value="dropdown">Dropdown</RadioButton>
                      <RadioButton value="radio">Radio boxes</RadioButton>
                    </RadioGroup>
                  )}
                </FormItem>

                {(getFieldValue("listStyle") === "radio" ||
                  (!getFieldValue("listStyle") &&
                    field &&
                    field.listStyle === "radio")) && (
                  <FormItem {...FormItemLayout} label="Alignment">
                    {getFieldDecorator("alignment", {
                      initialValue:
                        field && field.alignment
                          ? field.alignment
                          : "horizontal"
                    })(
                      <RadioGroup>
                        <RadioButton value="horizontal">Horizontal</RadioButton>
                        <RadioButton value="vertical">Vertical</RadioButton>
                      </RadioGroup>
                    )}
                  </FormItem>
                )}

                <FormItem {...FormItemLayout} label="Multi-select">
                  {getFieldDecorator("multiSelect", {
                    initialValue: field ? field.multiSelect : false,
                    valuePropName: "checked"
                  })(<Checkbox />)}
                </FormItem>

                <FormItem
                  {...FormItemLayout}
                  label="Options"
                  validateStatus="success"
                >
                  <Button
                    size="small"
                    type="primary"
                    onClick={() =>
                      this.setState({ options: [...options, {}], error: null })
                    }
                  >
                    Add option
                  </Button>

                  {options.map((option, i) => (
                    <div key={i} className="option">
                      <Input
                        placeholder="Label"
                        value={options[i].label}
                        onChange={e => {
                          options[i].label = e.target.value;
                          this.setState({ options, error: null });
                        }}
                      />

                      <Input
                        placeholder="Value"
                        value={options[i].value}
                        onChange={e => {
                          options[i].value = e.target.value;
                          this.setState({ options, error: null });
                        }}
                      />

                      <Button
                        type="danger"
                        icon="delete"
                        onClick={() => {
                          this.setState({
                            options: options.filter(
                              optionItem => optionItem !== option
                            )
                          });
                        }}
                      />
                    </div>
                  ))}
                </FormItem>
              </div>
            )}
          </div>
        )}

        {(getFieldValue("type") === "number" ||
          (!getFieldValue("type") && field && field.type === "number")) && (
          <div>
            <FormItem {...FormItemLayout} label="Display">
              {getFieldDecorator("numberDisplay", {
                initialValue:
                  field && field.numberDisplay ? field.numberDisplay : "input"
              })(
                <RadioGroup>
                  <RadioButton value="input">Input</RadioButton>
                  <RadioButton value="list">List</RadioButton>
                </RadioGroup>
              )}
            </FormItem>

            <FormItem {...FormItemLayout} label="Interval">
              {getFieldDecorator("interval", {
                initialValue: field && field.interval,
                rules: [
                  {
                    required: getFieldValue("numberDisplay") !== "input",
                    message: "Interval is required"
                  }
                ]
              })(<InputNumber min={0} />)}
            </FormItem>

            <FormItem {...FormItemLayout} label="Minimum">
              {getFieldDecorator("minimum", {
                initialValue: field && field.minimum,
                rules: [
                  {
                    required: getFieldValue("numberDisplay") !== "input",
                    message: "Minimum is required"
                  }
                ]
              })(<InputNumber step={getFieldValue("interval")} />)}
            </FormItem>

            <FormItem {...FormItemLayout} label="Maximum">
              {getFieldDecorator("maximum", {
                initialValue: field && field.maximum,
                rules: [
                  {
                    required: getFieldValue("numberDisplay") !== "input",
                    message: "Maximum is required"
                  },
                  {
                    message: "Maximum must be greater than minimum",
                    validator: (rule, value, cb) => {
                      getFieldValue("minimum") &&
                      getFieldValue("maximum") <= getFieldValue("minimum")
                        ? cb(true)
                        : cb();
                    }
                  }
                ]
              })(<InputNumber step={getFieldValue("interval")} />)}
            </FormItem>

            {(getFieldValue("numberDisplay") === "input" ||
              (!getFieldValue("numberDisplay") &&
                field &&
                field.numberDisplay === "input")) && (
              <FormItem {...FormItemLayout} label="Decimal places">
                {getFieldDecorator("precision", {
                  initialValue: field && field.precision
                })(<InputNumber min={0} />)}
              </FormItem>
            )}
          </div>
        )}

        <div>{error && <Alert message={error} type="error" />}</div>
      </Modal>
    );
  }
}

export default Form.create()(FormFieldModal);
