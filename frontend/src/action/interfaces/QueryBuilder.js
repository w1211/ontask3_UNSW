import React from "react";
import { Form, Select, Icon, Input, InputNumber, Button, Tooltip } from "antd";
import _ from "lodash";

import "./QueryBuilder.css";

const { OptGroup, Option } = Select;
const FormItem = Form.Item;

const modMap = {
  datasource: ["#2196F3", "database"],
  form: ["#5E35B1", "form"],
  computed: ["#43A047", "calculator"]
};

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
  style: { marginBottom: 6 }
};

const OptionTitle = (type, label) => (
  <span style={{ color: modMap[type][0] }}>
    <Icon type={modMap[type][1]} style={{ marginRight: 5 }} />
    {label}
  </span>
);

class QueryBuilder extends React.Component {
  state = {};

  componentDidMount() {
    const [options, typeMap] = this.generateOptions();
    this.setState({ options, typeMap });
  }

  generateOptions = () => {
    const { steps, datasources } = this.props;

    const typeMap = {};

    const computedFields = [];
    const options = steps.reduce((options, mod) => {
      if (mod.type === "datasource") {
        const name = datasources.find(
          datasource => datasource.id === mod[mod.type].id
        ).name;

        options.push(
          <OptGroup label={OptionTitle("datasource", name)} key={name}>
            {mod.datasource.fields.map(field => {
              const label = mod.datasource.labels[field];
              const type = mod.datasource.types[field];
              typeMap[label] = type;
              return <Option key={label}>{label}</Option>;
            })}
          </OptGroup>
        );
      }

      if (mod.type === "form") {
        options.push(
          <OptGroup
            label={OptionTitle("form", mod.form.name)}
            key={mod.form.name}
          >
            {mod.form.fields.map(field => {
              typeMap[field.name] = field.type;
              return <Option key={field.name}>{field.name}</Option>;
            })}
          </OptGroup>
        );
      }

      if (mod.type === "computed") {
        computedFields.push(
          ...mod.computed.fields.map(field => {
            typeMap[field.name] = field.type;
            return <Option key={field.name}>{field.name}</Option>;
          })
        );
      }

      return options;
    }, []);

    options.push(
      <OptGroup
        label={OptionTitle("computed", "Computed fields")}
        key={"computed"}
      >
        {computedFields}
      </OptGroup>
    );

    return [options, typeMap];
  };

  Operations = type => {
    let operations = [];
    if (type === "number")
      operations = [">", "≥", "<", "≤", "=", "!=", "between"];
    else if (type === "text") operations = ["=", "!="];

    return operations.map((operation, i) => (
      <Option value={operation} key={i}>
        {operation}
      </Option>
    ));
  };

  Element = (type, field) => {
    const { form } = this.props;
    const { getFieldValue } = form;

    const value = getFieldValue(field) || "";

    // Create a temporary DOM element to calculate the width of the input value
    const widthCalc = document.createElement("span");
    widthCalc.innerHTML = value;
    document.body.appendChild(widthCalc);
    const width = widthCalc.getBoundingClientRect().width + 24; // Includes padding
    widthCalc.remove();

    if (type === "number")
      return (
        <InputNumber
          key={field}
          className="field-input"
          style={{ width: width + 18 }} // Include extra space for the up/down arrows
        />
      );
    else if (type === "text")
      return <Input key={field} className="field-input" style={{ width }} />;
  };

  Comparator = (type, operation, conditionIndex, parameterIndex) => {
    const { form } = this.props;
    const { getFieldDecorator } = form;

    const fieldBase = `rule.conditions[${conditionIndex}][${parameterIndex}].`;

    if (operation === "between")
      return [
        getFieldDecorator(`${fieldBase}from`)(
          this.Element(type, `${fieldBase}from`)
        ),
        <span key={`${fieldBase}and`}>and</span>,
        getFieldDecorator(`${fieldBase}to`)(
          this.Element(type, `${fieldBase}to`)
        )
      ];

    return getFieldDecorator(`${fieldBase}comparator`)(
      this.Element(type, `${fieldBase}comparator`)
    );
  };

  componentDidUpdate() {
    const { form } = this.props;
    const { getFieldValue, setFieldsValue } = form;

    const conditionKeys = getFieldValue("conditionKeys");

    // Ensure that there is at least one condition in the rule
    if (conditionKeys && conditionKeys.length < 1)
      setFieldsValue({
        conditionKeys: [_.uniqueId()]
      });
  }

  addCondition = () => {
    const { form } = this.props;
    const { getFieldValue, setFieldsValue } = form;

    const conditionKeys = getFieldValue("conditionKeys");

    setFieldsValue({
      conditionKeys: [...conditionKeys, _.uniqueId()]
    });
  };

  deleteCondition = conditionIndex => {
    const { form } = this.props;
    const { getFieldValue } = form;

    const conditionKeys = getFieldValue("conditionKeys");
    const conditions = getFieldValue("rule.conditions");

    conditionKeys.splice(conditionIndex, 1);
    if (conditions) conditions.splice(conditionIndex, 1);

    form.setFieldsValue({
      conditionKeys,
      "rule.conditions": conditions
    });
  };

  render() {
    const { form } = this.props;
    const { options, typeMap } = this.state;
    const { getFieldDecorator, getFieldValue } = form;

    getFieldDecorator("conditionKeys", { initialValue: [] });
    const conditionKeys = getFieldValue("conditionKeys");
    const parameters = getFieldValue("rule.parameters");

    return (
      <Form
        layout="horizontal"
        style={{
          border: "1px solid black",
          borderRadius: 3,
          marginBottom: 20,
          padding: 20
        }}
        className="querybuilder"
      >
        <FormItem label="Rule name" {...formItemLayout}>
          {getFieldDecorator("rule.name", {
            rules: [
              {
                required: true,
                message: "Rule name is required"
              }
            ]
          })(<Input />)}
        </FormItem>

        <FormItem label="Parameters" {...formItemLayout}>
          {getFieldDecorator("rule.parameters", {
            rules: [
              {
                required: true,
                message: "At least one parameter is required"
              }
            ],
            initialValue: []
          })(
            <Select showSearch mode="multiple">
              {options}
            </Select>
          )}
        </FormItem>

        {parameters &&
          parameters.length > 0 && (
            <div>
              <FormItem label="Conditions" {...formItemLayout}>
                <Tooltip title="Add condition">
                  <Button
                    icon="plus"
                    size="small"
                    type="primary"
                    onClick={this.addCondition}
                  />
                </Tooltip>
              </FormItem>

              <ul className="conditions">
                {conditionKeys.map((key, conditionIndex) => (
                  <li key={key}>
                    {conditionKeys.length > 1 && (
                      <Tooltip title="Delete condition">
                        <div className="delete">
                          <Button
                            icon="close"
                            shape="circle"
                            size="small"
                            disabled={conditionKeys.length <= 1}
                            onClick={() => this.deleteCondition(conditionIndex)}
                          />
                        </div>
                      </Tooltip>
                    )}

                    <div className="parameters">
                      {parameters.map((parameter, parameterIndex) => {
                        const operation = getFieldValue(
                          `rule.conditions[${conditionIndex}][${parameterIndex}].operator`
                        );

                        return (
                          <div className="field" key={`${key}_${parameter}`}>
                            <div className="name">{parameter}</div>

                            <div className="operation">
                              {getFieldDecorator(
                                `rule.conditions[${conditionIndex}][${parameterIndex}].operator`
                              )(
                                <Select
                                  showArrow={false}
                                  dropdownMatchSelectWidth={false}
                                >
                                  {this.Operations(typeMap[parameter])}
                                </Select>
                              )}
                            </div>

                            <div className="comparator">
                              {this.Comparator(
                                typeMap[parameter],
                                operation,
                                conditionIndex,
                                parameterIndex
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </Form>
    );
  }
}

export default Form.create()(QueryBuilder);
