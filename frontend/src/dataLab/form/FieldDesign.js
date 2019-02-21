import React from "react";
import {
  Input,
  InputNumber,
  Form,
  Select,
  Checkbox,
  Icon,
  Tooltip,
  Button,
  Radio
} from "antd";
import _ from "lodash";

import { IconName } from "./IconName";

import FormItemLayout from "../../shared/FormItemLayout";

const FormItem = Form.Item;
const Option = Select.Option;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class FieldDesign extends React.Component {
  constructor(props) {
    super(props);
    const { field } = props;

    this.state = {
      optionKeys: _.get(field, "options", [null]).map(() => _.uniqueId())
    };
  }

  TextField = () => {
    const { field, fieldIndex, form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <div>
        <div>
          <FormItem {...FormItemLayout} label="Multi-line input">
            {getFieldDecorator(`fields[${fieldIndex}].textArea`, {
              initialValue: _.get(field, "textArea") || false,
              valuePropName: "checked"
            })(<Checkbox />)}
          </FormItem>

          <FormItem {...FormItemLayout} label="Max characters">
            {getFieldDecorator(`fields[${fieldIndex}].maxLength`, {
              initialValue: _.get(field, "maxLength")
            })(<InputNumber min={1} />)}
          </FormItem>
        </div>
      </div>
    );
  };

  ListField = () => {
    const { field, fieldIndex, form, updateClonedField } = this.props;
    const { optionKeys } = this.state;
    const { getFieldDecorator, getFieldValue, setFieldsValue } = form;

    return (
      <div>
        <div>
          <FormItem {...FormItemLayout} label="List style">
            {getFieldDecorator(`fields[${fieldIndex}].listStyle`, {
              initialValue: _.get(field, "listStyle") || "dropdown"
            })(
              <RadioGroup>
                <RadioButton value="dropdown">Dropdown</RadioButton>
                <RadioButton value="radio">Radio boxes</RadioButton>
              </RadioGroup>
            )}
          </FormItem>

          {getFieldValue(`fields[${fieldIndex}].listStyle`) === "radio" && (
            <FormItem {...FormItemLayout} label="Alignment">
              {getFieldDecorator(`fields[${fieldIndex}].alignment`, {
                initialValue: _.get(field, "alignment") || "horizontal"
              })(
                <RadioGroup>
                  <RadioButton value="horizontal">Horizontal</RadioButton>
                  <RadioButton value="vertical">Vertical</RadioButton>
                </RadioGroup>
              )}
            </FormItem>
          )}

          <FormItem {...FormItemLayout} label="Use icons">
            {getFieldDecorator(`fields[${fieldIndex}].useIcon`, {
              initialValue: _.get(field, "useIcon") || false,
              valuePropName: "checked"
            })(<Checkbox />)}
          </FormItem>

          <FormItem {...FormItemLayout} label="Multi-select">
            {getFieldDecorator(`fields[${fieldIndex}].multiSelect`, {
              initialValue: _.get(field, "multiSelect") || false,
              valuePropName: "checked"
            })(<Checkbox />)}
          </FormItem>

          <FormItem {...FormItemLayout} label="Options">
            <Button
              size="small"
              type="primary"
              onClick={() => {
                this.setState({
                  optionKeys: [...optionKeys, _.uniqueId()]
                });
              }}
            >
              Add option
            </Button>

            {optionKeys.map((key, i) => (
              <div key={`option_${i}`} className="option">
                <FormItem className="no-explain" style={{ marginBottom: 0 }}>
                  {getFieldDecorator(
                    `fields[${fieldIndex}].options[${i}].label`,
                    {
                      rules: [{ required: true }],
                      initialValue: _.get(field, `options[${i}].label`)
                    }
                  )(
                    getFieldValue(`fields[${fieldIndex}].useIcon`) ? (
                      <Select
                        showSearch
                        showArrow={false}
                        style={{ width: "100%" }}
                        placeholder="Choose icon"
                      >
                        {IconName.map(icon => (
                          <Option key={icon} value={icon}>
                            <Icon type={icon} /> {icon}
                          </Option>
                        ))}
                      </Select>
                    ) : (
                      <Input placeholder="Label" />
                    )
                  )}
                </FormItem>

                <FormItem className="no-explain" style={{ margin: "0 5px" }}>
                  {getFieldDecorator(
                    `fields[${fieldIndex}].options[${i}].value`,
                    {
                      rules: [{ required: true }],
                      initialValue: _.get(field, `options[${i}].value`)
                    }
                  )(<Input placeholder="Value" />)}
                </FormItem>

                <Tooltip title="Delete this option">
                  <Button
                    type="danger"
                    icon="delete"
                    disabled={optionKeys.length === 1}
                    onClick={() => {
                      const options = getFieldValue(
                        `fields[${fieldIndex}].options`
                      );

                      optionKeys.splice(i, 1);
                      options.splice(i, 1);

                      this.setState({ optionKeys });
                      setFieldsValue({
                        [`fields[${fieldIndex}].options`]: options
                      });
                      updateClonedField({ ...field, options });
                    }}
                  />
                </Tooltip>
              </div>
            ))}
          </FormItem>
        </div>
      </div>
    );
  };

  NumberField = () => {
    const { field, fieldIndex, form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;

    return (
      <div>
        <FormItem {...FormItemLayout} label="Display">
          {getFieldDecorator(`fields[${fieldIndex}].numberDisplay`, {
            initialValue: _.get(field, "numberDisplay") || "input"
          })(
            <RadioGroup>
              <RadioButton value="input">Input</RadioButton>
              <RadioButton value="list">List</RadioButton>
            </RadioGroup>
          )}
        </FormItem>

        <FormItem {...FormItemLayout} label="Interval">
          {getFieldDecorator(`fields[${fieldIndex}].interval`, {
            initialValue: _.get(field, "interval"),
            rules: [
              {
                required:
                  getFieldValue(`fields[${fieldIndex}].numberDisplay`) !==
                  "input",
                message: "Interval is required"
              }
            ]
          })(<InputNumber min={0} />)}
        </FormItem>

        <FormItem {...FormItemLayout} label="Minimum">
          {getFieldDecorator(`fields[${fieldIndex}].minimum`, {
            initialValue: _.get(field, "minimum"),
            rules: [
              {
                required:
                  getFieldValue(`fields[${fieldIndex}].numberDisplay`) !==
                  "input",
                message: "Minimum is required"
              }
            ]
          })(
            <InputNumber
              step={getFieldValue(`fields[${fieldIndex}].interval`)}
            />
          )}
        </FormItem>

        <FormItem {...FormItemLayout} label="Maximum">
          {getFieldDecorator(`fields[${fieldIndex}].maximum`, {
            initialValue: _.get(field, "maximum"),
            rules: [
              {
                required:
                  getFieldValue(`fields[${fieldIndex}].numberDisplay`) !==
                  "input",
                message: "Maximum is required"
              },
              {
                message: "Maximum must be greater than minimum",
                validator: (rule, value, cb) => {
                  const min =
                    getFieldValue(`fields[${fieldIndex}].minimum`) || undefined;
                  const max =
                    getFieldValue(`fields[${fieldIndex}].maximum`) || undefined;
                  if (max <= min) cb(true);
                  cb();
                }
              }
            ]
          })(
            <InputNumber
              step={getFieldValue(`fields[${fieldIndex}].interval`)}
            />
          )}
        </FormItem>

        {getFieldValue(`fields[${fieldIndex}].numberDisplay`) === "input" ||
          (!getFieldValue(`fields[${fieldIndex}].numberDisplay`) &&
            _.get(field, "numberDisplay") === "input" && (
              <FormItem {...FormItemLayout} label="Decimal places">
                {getFieldDecorator(`fields[${fieldIndex}].precision`, {
                  initialValue: _.get(field, "precision")
                })(<InputNumber min={0} />)}
              </FormItem>
            ))}
      </div>
    );
  };

  render() {
    const { labels, field, fieldIndex, deleteField, form } = this.props;
    const { getFieldDecorator, getFieldValue } = form;

    return (
      <div className="field-design" style={{ width: "100%" }}>
        <FormItem {...FormItemLayout} label="Field name">
          {getFieldDecorator(`fields[${fieldIndex}].name`, {
            rules: [
              { required: true, message: "Field name is required" },
              {
                message:
                  "Field name is already being used in the DataLab or form",
                validator: (rule, value, cb) => {
                  if (_.get(field, "name") === value) cb();
                  labels.some(label => label === value) ? cb(true) : cb();
                }
              }
            ],
            initialValue: _.get(field, "name")
          })(<Input style={{ width: "calc(100% - 37px)" }} />)}

          <Tooltip title="Delete this field">
            <Button
              type="danger"
              icon="delete"
              style={{ marginLeft: 5 }}
              onClick={deleteField}
            />
          </Tooltip>
        </FormItem>

        <FormItem {...FormItemLayout} label="Field type">
          {getFieldDecorator(`fields[${fieldIndex}].type`, {
            rules: [{ required: true, message: "Field type is required" }],
            initialValue: _.get(field, "type")
          })(
            <Select className="field">
              <Option value="text">Text</Option>
              <Option value="list">List</Option>
              <Option value="number">Number</Option>
              <Option value="date">Date</Option>
              <Option value="checkbox">Checkbox</Option>
            </Select>
          )}
        </FormItem>

        {getFieldValue(`fields[${fieldIndex}].type`) === "text" &&
          this.TextField()}

        {getFieldValue(`fields[${fieldIndex}].type`) === "list" &&
          this.ListField()}

        {getFieldValue(`fields[${fieldIndex}].type`) === "number" &&
          this.NumberField()}
      </div>
    );
  }
}

export default FieldDesign;
