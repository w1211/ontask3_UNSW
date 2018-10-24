import React from "react";
import {
  Form,
  Select,
  Icon,
  Input,
  InputNumber,
  Button,
  Tooltip,
  DatePicker
} from "antd";
import _ from "lodash";
import memoize from "memoize-one";
import { Parser } from "expr-eval";

import "./QueryBuilder.css";

const { OptGroup, Option } = Select;
const FormItem = Form.Item;

const modMap = {
  datasource: ["#2196F3", "database"],
  form: ["#5E35B1", "form"],
  computed: ["#43A047", "calculator"]
};

const labelMap = {
  ">=": "≥",
  "<=": "≤",
  "==": "="
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

  // usedOperations = memoize((parameters, conditions) => {
  //   const operations = parameters.map(() => new Set());

  //   conditions.forEach(condition => {
  //     condition.forEach((parameter, parameterIndex) => {
  //       if (parameter.operator && parameterIndex in operations)
  //         operations[parameterIndex].add(parameter.operator);
  //     });
  //   });

  //   return operations;
  // });

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

  Operations = (type, parameterIndex) => {
    let operations = [];
    if (type === "number" || type === "date")
      operations = [">", ">=", "<", "<=", "==", "!=", "between"];
    else if (type === "text") operations = ["==", "!="];
    else if (type === "list") operations = ["contains"];

    return operations.map((operation, i) => (
      <Option
        value={operation}
        key={i}
      >
        {operation in labelMap ? labelMap[operation] : operation}
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
    else if (type === "text" || type === "list")
      return <Input key={field} className="field-input" style={{ width }} />;
    else if (type === "date")
      return <DatePicker key={field} className="field-input" placeholder="" />;
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
        <span className="and" key={`${fieldBase}and`}>
          and
        </span>,
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

  hasOverlap = (formulas, type) => {
    console.log(formulas);
    
    if (type === "number") {
      const tests = [];
      const values = new Set();

      formulas.forEach(formula => {
        if (formula.operator === "between") {
          tests.push([`x >= ${formula.from}`, `x <= ${formula.to}`]);
        } else {
          tests.push([`x ${formula.operator} ${formula.comparator}`]);
        }

        values.add(formula.comparator - 1);
        values.add(formula.comparator);
        values.add(formula.comparator + 1);
      });

      console.log(tests);
      console.log(values);

      return [...values].some(value => {
        return tests.every(test =>
          test.every(subtest => {
            const parser = Parser.parse(subtest);
            return parser.evaluate({ x: value });
          })
        );
      });
    }

    return false;
  };

  testOverlaps = () => {
    const { form } = this.props;
    const { typeMap } = this.state;

    const { rule } = form.getFieldsValue();
    const { parameters, conditions } = rule;

    // Instantiate a single bucket containing all the conditions
    let buckets = [conditions]; // i.e. [[cond1, cond2, cond3]]

    // Check whether the conditions overlap *one parameter at a time*
    parameters.forEach((parameter, parameterIndex) => {
      console.log(buckets);

      const newBuckets = [];

      buckets.forEach(bucket => {
        const conditionsChecked = [];

        bucket.forEach((condition, conditionIndex) => {
          if (conditionsChecked.includes(condition)) return;

          // Instantiate a new bucket containing just this condition
          const newBucket = [condition];

          // Compare this condition to each following condition *in the same bucket*
          bucket.slice(conditionIndex + 1).forEach(comparison => {
            // Check whether the condition overlaps
            // e.g. x >= 5 and x <= 5 overlaps if x = 5
            const hasOverlap = this.hasOverlap(
              [condition[parameterIndex], comparison[parameterIndex]],
              typeMap[parameter]
            );

            // If the condition being compared does overlap, add it to the bucket
            if (hasOverlap) {
              newBucket.push(comparison);
              // Prevent the comparison condition from being checked again
              conditionsChecked.push(comparison);
            }
          });

          newBuckets.push(newBucket);
        });
      });

      // Overwrite with the new buckets so that the next iteration only compares
      // conditions that overlap
      buckets = newBuckets;
    });

    console.log(buckets);
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
                                  {this.Operations(
                                    typeMap[parameter],
                                    parameterIndex
                                  )}
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

        <Button onClick={() => this.testOverlaps()}>Test</Button>
      </Form>
    );
  }
}

export default Form.create()(QueryBuilder);
