import React from "react";
import { Input, InputNumber, DatePicker, Checkbox, Select, Radio } from "antd";
import moment from "moment";
import { range } from "lodash";

const Option = Select.Option;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;

class EditableField extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.originalValue
    };
  }

  componentDidUpdate(prevProps) {
    const { originalValue } = this.props;

    if (prevProps.originalValue !== originalValue)
      this.setState({ value: originalValue });
  }

  handleChange = (value, shouldSave) => {
    const { onSave } = this.props;

    this.setState({ value });
    if (shouldSave) onSave(value);
  };

  handleSave = () => {
    const { originalValue, onSave } = this.props;
    const { value } = this.state;

    // Compare contents of the values rather than the referential equality
    // For example, comparing arrays such as [1, 2, 3] === [1, 2, 3] could
    // produce False if the array has different pointers
    if (JSON.stringify(originalValue) !== JSON.stringify(value)) {
      onSave(value);
    }
  };

  TextField = () => {
    const { field, originalValue, editMode } = this.props;
    const { value } = this.state;

    if (!editMode)
      return originalValue instanceof Array
        ? originalValue.join(', ')
        : originalValue;

    if (field.textDisplay === "input") {
      if (field.textArea) {
        return (
          <Input.TextArea
            maxLength={field.maxLength}
            rows="5"
            value={value}
            onChange={e => this.handleChange(e.target.value)}
            onBlur={this.handleSave}
          />
        );
      } else {
        return (
          <Input
            maxLength={field.maxLength}
            value={value}
            onChange={e => this.handleChange(e.target.value)}
            onBlur={this.handleSave}
          />
        );
      }
    }

    if (field.textDisplay === "list") {
      if (field.listStyle === "dropdown") {
        return (
          <Select
            mode={field.multiSelect ? "multiple" : "default"}
            allowClear={true}
            value={value ? value : []}
            onChange={this.handleChange}
            onBlur={this.handleSave}
          >
            {field.options.map(option => (
              <Option key={option.value}>{option.label}</Option>
            ))}
          </Select>
        );
      }

      if (field.listStyle === "radio") {
        if (field.multiSelect) {
          return (
            <CheckboxGroup
              options={field.options.map(option => ({
                label: option.label,
                value: option.value
              }))}
              style={{
                display: "flex",
                flexDirection: field.alignment === "vertical" ? "column" : "row"
              }}
              value={value && value instanceof Array ? value : []}
              onChange={e => this.handleChange(e, true)}
            />
          );
        } else {
          return (
            <RadioGroup
              style={{
                display: "flex",
                flexDirection: field.alignment === "vertical" ? "column" : "row"
              }}
              value={value}
              onChange={e => this.handleChange(e.target.value, true)}
            >
              {field.options.map(option => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </RadioGroup>
          );
        }
      }
    }

    return null;
  };

  NumberField = () => {
    const { field, originalValue, editMode } = this.props;
    const { value } = this.state;

    if (!editMode) return originalValue;

    if (field.numberDisplay === "list") {
      const steps = range(
        field.minimum,
        field.maximum + field.interval,
        field.interval
      );

      return (
        <Select
          value={value}
          onChange={this.handleChange}
          onBlur={this.handleSave}
        >
          {steps.map(step => <Option key={step}>{step}</Option>)}
        </Select>
      );
    } else {
      return (
        <InputNumber
          min={
            field.minimum !== undefined && field.minimum !== null
              ? field.minimum
              : -Infinity
          }
          max={
            field.maximum !== undefined && field.maximum !== null
              ? field.maximum
              : Infinity
          }
          step={field.interval ? field.interval : undefined}
          precision={field.precision}
          value={value}
          onChange={this.handleChange}
          onBlur={this.handleSave}
        />
      );
    }
  };

  DateField = () => {
    const { originalValue, editMode } = this.props;
    const { value } = this.state;

    if (!editMode)
      return originalValue ? moment(originalValue).format("YYYY-MM-DD") : null;

    return (
      <DatePicker
        value={value ? moment(value) : null}
        onChange={e =>
          this.handleChange(e ? moment.utc(e).format() : null, true)
        }
      />
    );
  };

  BooleanField = () => {
    const { originalValue, editMode } = this.props;
    const { value } = this.state;

    if (!editMode) return originalValue ? "True" : "False";

    return (
      <Checkbox
        checked={!!value}
        onChange={e => {
          this.handleChange(e.target.checked, true);
        }}
      />
    );
  };

  render() {
    const { field, originalValue } = this.props;
    
    if (!field) return originalValue;

    switch (field.type) {
      case "text":
        return this.TextField();

      case "number":
        return this.NumberField();

      case "date":
        return this.DateField();

      case "checkbox":
        return this.BooleanField();

      default:
        return null;
    }
  }
}

export default EditableField;
