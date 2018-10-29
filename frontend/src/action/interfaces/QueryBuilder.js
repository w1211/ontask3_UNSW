import React from "react";
import {
  Form,
  Select,
  Icon,
  Input,
  InputNumber,
  Button,
  Tooltip,
  DatePicker,
  Modal,
  Alert
} from "antd";
import _ from "lodash";
import moment from "moment";
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
  state = { overlappingConditions: [] };

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
      <Option value={operation} key={i}>
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
    else if (type === "text")
      return <Input key={field} className="field-input" style={{ width }} />;
    else if (type === "list")
      return <Select mode="tags" className="field-input" style={{ width }} />;
    else if (type === "date")
      return (
        <DatePicker
          key={field}
          className="field-input"
          placeholder=""
          // Make the time negligible, as we only care about the date
          // This is important when converting to unix epoch for testing date field overlaps
          showTime={{ defaultValue: moment("00:00:00", "HH:mm:ss") }}
        />
      );
  };

  Comparator = (type, operation, conditionIndex, parameterIndex) => {
    const { form } = this.props;
    const { getFieldDecorator } = form;

    const fieldBase = `rule.conditions[${conditionIndex}][${parameterIndex}].`;

    if (operation === "between")
      return [
        getFieldDecorator(`${fieldBase}from`, {
          rules: [
            {
              required: true
            }
          ]
        })(this.Element(type, `${fieldBase}from`)),
        <span className="and" key={`${fieldBase}and`}>
          and
        </span>,
        getFieldDecorator(`${fieldBase}to`, {
          rules: [
            {
              required: true
            }
          ]
        })(this.Element(type, `${fieldBase}to`))
      ];

    return getFieldDecorator(`${fieldBase}comparator`, {
      rules: [
        {
          required: true
        }
      ]
    })(this.Element(type, `${fieldBase}comparator`));
  };

  componentDidUpdate() {
    const { form } = this.props;
    const { hasMissingValues } = this.state;

    const { getFieldValue, setFieldsValue, getFieldError } = form;

    const conditionKeys = getFieldValue("conditionKeys");

    // Ensure that there is at least one condition in the rule
    if (conditionKeys && conditionKeys.length < 1)
      setFieldsValue({
        conditionKeys: [_.uniqueId()]
      });

    // If the missing values error message is visible, then
    // check whether it is still needed after form values change
    if (hasMissingValues) {
      const conditionErrors = getFieldError("rule.conditions")
        .flat()
        .some(condition => Object.values(condition).some(error => !!error));

      if (!conditionErrors) this.setState({ hasMissingValues: false });
    }
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
    // If either formula has any incomplete details, then cancel the overlap check
    let isIncomplete = false;
    formulas.forEach(formula => {
      if (
        Object.values(formula).some(
          value => value === undefined || value === null
        )
      ) {
        isIncomplete = true;
      }
    });
    if (isIncomplete) return false;

    if (type === "text") {
      // Define the logical tests which would indicate an overlap
      const tests = [
        (formula1, formula2) =>
          formula1.operator === "==" &&
          formula2.operator === "==" &&
          formula1.comparator === formula2.comparator,
        (formula1, formula2) =>
          formula1.operator === "!=" && formula2.operator === "!=",
        (formula1, formula2) =>
          // If one of the formula's operator is ==
          [formula1.operator, formula2.operator].some(
            operator => operator === "=="
          ) &&
          // And the other formula's operator is !=
          [formula1.operator, formula2.operator].some(
            operator => operator === "!="
          ) &&
          // And the two formulas have a different comparator
          formula1.comparator !== formula2.comparator
      ];

      // If *any* of the logical tests above returns true, then there is an overlap
      if (tests.some(test => test(formulas[0], formulas[1]))) return true;
    }

    if (type === "list") {
      // The only operator for lists is "contains", so the below test is sufficient
      if (formulas[0].comparator === formulas[1].comparator) return true;
    }

    if (type === "number" || type === "date") {
      const expressionGroups = []; // Two expression "groups", one for each condition
      const values = new Set(); // Values to logically test the expressions

      formulas.forEach(formula => {
        if (formula.operator === "between") {
          if (type === "date") {
            // Convert moment datetimes to unix epoch
            formula.from = formula.from.unix();
            formula.to = formula.to.unix();
          }
          // Push an array of two expressions, one for each of "from" and "to"
          expressionGroups.push([`x >= ${formula.from}`, `x <= ${formula.to}`]);
          [-1, 0, 1].forEach(i => {
            values.add(formula.from + i);
            values.add(formula.to + i);
          });
        } else {
          if (type === "date") {
            formula.comparator = formula.comparator.unix();
          }
          // Push an array of one expression
          expressionGroups.push([
            `x ${formula.operator} ${formula.comparator}`
          ]);
          [-1, 0, 1].forEach(i => values.add(formula.comparator + i));
        }
      });

      // If for *any* of the values...
      return [...values].some(value => {
        // the logical tests of the expressions for *both* conditions returns true, given that...
        return expressionGroups.every(expressions =>
          // the logical tests of every expression for that condition returns true...
          expressions.every(expression => {
            const parser = Parser.parse(expression);
            return parser.evaluate({ x: value });
          })
        );
      });
      // then an overlap must exist between the two conditions being compared, for the
      // parameter being tested.
    }

    // If none of the above tests returned true, then there must not be an overlap
    return false;
  };

  testOverlaps = () => {
    const { form } = this.props;
    const { typeMap } = this.state;

    const { rule } = form.getFieldsValue();
    const { parameters, conditions } = rule;

    // Instantiate a single bucket containing all the conditions
    let buckets = [conditions]; // i.e. [[cond1, cond2, cond3]]

    // Iterate over the parameters
    //
    // On the first passthrough (i.e. the first parameter), assign each
    // condition to a given bucket if there is an overlap in the formula
    // for that particular parameter. E.g. first parameter is "grade",
    // one condition has grade >= 50 and the other condition has grade <= 60.
    // These conditions would overlap if 50 <= grade <= 60.
    //
    // For each next parameter, perform comparisons between the conditions as
    // above, but only with those conditions in the same bucket, and assign
    // them to the same bucket if there is an overlap. Otherwise, a new bucket
    // is created.
    //
    // The buckets should thin out with each passthrough. If there are no overlaps
    // between the conditions after iterating through all parameters, then all buckets
    // should have a length of 1.
    //
    // The final result is a list of buckets where the first condition (index 0)
    // definitely overlaps (taking all parameters into consideration) with every
    // other condition in that bucket
    parameters.forEach((parameter, parameterIndex) => {
      const newBuckets = [];

      buckets.forEach(bucket => {
        const conditionsChecked = [];

        bucket.forEach((condition, conditionIndex) => {
          // If this condition has already been assigned to a bucket due to
          // overlapping, then do not create a new bucket
          if (conditionsChecked.includes(condition)) return;

          // Instantiate a new bucket containing just this condition
          const newBucket = [condition];

          // Compare this condition to each following condition *in the same bucket*
          bucket.slice(conditionIndex + 1).forEach(comparison => {
            // Check whether the condition overlaps
            const hasOverlap = this.hasOverlap(
              [condition[parameterIndex], comparison[parameterIndex]],
              typeMap[parameter]
            );

            // If the condition being compared does overlap, add it to the new bucket.
            // Otherwise, the condition will be assigned to its own bucket, and the process
            // will repeat until all conditions are exhausted for this passthrough
            if (hasOverlap) {
              newBucket.push(comparison);
              conditionsChecked.push(comparison);
            }
          });

          newBuckets.push(newBucket);
        });
      });

      // Overwrite with the new buckets so that the next iteration only compares
      // conditions that overlap as of the n-th parameter passthrough
      buckets = newBuckets;
    });

    // Find the first instance of a bucket with conditions that overlap (if any)
    const overlappingConditions = buckets.find(bucket => bucket.length > 1);

    if (overlappingConditions) {
      return overlappingConditions.map(condition =>
        conditions.indexOf(condition)
      );
    }
  };

  handleOk = () => {
    const { form } = this.props;

    form.validateFields((err, values) => {
      if (err) {
        if ("conditions" in err.rule) this.setState({ hasMissingValues: true });
        return;
      }

      const overlappingConditions = this.testOverlaps();
      this.setState({ overlappingConditions, hasMissingValues: false });

      if (overlappingConditions) return;

      
    });
  };

  handleCancel = () => {
    const { onClose } = this.props;

    onClose();
  };

  render() {
    const { form, type, selected, visible } = this.props;
    const {
      options,
      typeMap,
      overlappingConditions,
      hasMissingValues
    } = this.state;
    const { getFieldDecorator, getFieldValue } = form;

    getFieldDecorator("conditionKeys", { initialValue: [] });
    const conditionKeys = getFieldValue("conditionKeys");
    const parameters = getFieldValue("rule.parameters");

    return (
      <Modal
        title={`${selected ? "Update" : "Create"} ${type}`}
        visible={visible}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        width={650}
      >
        <Form layout="horizontal" className="querybuilder">
          {type === "rule" && (
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
          )}

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
                    <li
                      key={key}
                      className={
                        overlappingConditions &&
                        overlappingConditions.includes(conditionIndex)
                          ? "overlap"
                          : ""
                      }
                    >
                      {conditionKeys.length > 1 && (
                        <div className="delete">
                          <Tooltip title="Delete condition">
                            <Button
                              icon="close"
                              shape="circle"
                              size="small"
                              disabled={conditionKeys.length <= 1}
                              onClick={() =>
                                this.deleteCondition(conditionIndex)
                              }
                            />
                          </Tooltip>
                        </div>
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
                                <FormItem>
                                  {getFieldDecorator(
                                    `rule.conditions[${conditionIndex}][${parameterIndex}].operator`,
                                    {
                                      rules: [
                                        {
                                          required: true
                                        }
                                      ]
                                    }
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
                                </FormItem>
                              </div>

                              <div className="comparator">
                                <FormItem>
                                  {this.Comparator(
                                    typeMap[parameter],
                                    operation,
                                    conditionIndex,
                                    parameterIndex
                                  )}
                                </FormItem>
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

          {overlappingConditions &&
            overlappingConditions.length > 0 && (
              <Alert
                message="Condition overlap detected"
                description="For the conditions marked in red, a record could 
              match multiple conditions at the same time. Adjust the settings to ensure
              mutual exclusivity before continuing."
                type="error"
                showIcon
              />
            )}

          {hasMissingValues && (
            <Alert
              message="Missing condition values"
              description="The values marked in red must be filled in order for the condition to be valid."
              type="error"
              showIcon
            />
          )}
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(QueryBuilder);
