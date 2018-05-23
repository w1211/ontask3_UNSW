import React from 'react';
import { Input, InputNumber, DatePicker, Checkbox, Select, Slider, Radio } from 'antd';
import moment from 'moment';
import _ from 'lodash';

const Option = Select.Option;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;


const EditableField = ({ field, value, onChange, onOk, isColumnEdit }) => {
  const type = field.type;

  const onKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onOk();
    };
  };

  let component;

  switch (type) {
    case 'text':
      if (field.textDisplay === 'input') {
        if (field.textArea) {
          component = (
            <Input.TextArea
              autoFocus={!isColumnEdit} 
              onKeyPress={onKeyPress} 
              defaultValue={value} 
              onChange={(e) => onChange(e.target.value)}
              rows="5"
              maxLength={field.maxLength}
            />
          );
        } else {
          component = (
            <Input 
              autoFocus={!isColumnEdit} 
              onKeyPress={onKeyPress} 
              defaultValue={value} 
              onChange={(e) => onChange(e.target.value)}
              maxLength={field.maxLength}
            />
          );
        };
      } else if (field.textDisplay === 'list') {
        if (field.listStyle === 'dropdown') {
          component = (
            <Select 
              defaultValue={value ? value : []}
              mode={field.multiSelect ? 'multiple' : 'default'}
              onChange={(e) => onChange(e)}
              allowClear={true}
              style={{ width: '100%' }}
            >
              { field.options.map(option => 
                <Option key={option.value}>{option.label}</Option>
              )}
            </Select>
          );
        } else if (field.listStyle === 'radio') {
          if (field.multiSelect) {
            component = (
              <CheckboxGroup
                defaultValue={value && value instanceof Array ? value : []}
                onChange={(e) => { onChange(e); }}
                options={field.options.map(option => ({ label: option.label, value: option.value }))}
                style={{ display: 'flex', flexDirection: field.alignment === 'vertical' ? 'column' : 'row'}}
              />
            );
          } else {
            component = (
              <RadioGroup
                defaultValue={value ? value : []}
                onChange={(e) => onChange(e.target.value)}
                style={{ display: 'flex', flexDirection: field.alignment === 'vertical' ? 'column' : 'row'}}
              >
                { field.options.map(option => 
                  <Radio key={option.value} value={option.value}>{option.label}</Radio>
                )}
              </RadioGroup>
            );
          }
        };
      };
      break;

    case 'number':
      if (field.numberDisplay === 'range') {
        component = (
          <Slider
            range
            autoFocus={!isColumnEdit} 
            defaultValue={value instanceof Array && value.length === 2 ? value : [0, null]} 
            onChange={(e) => onChange(e)}
            min={field.minimum}
            max={field.maximum}
            step={field.interval}
            style={{ width: '100%' }}
            marks={value instanceof Array && value.length === 2 ? Object.assign(...value.map(val => (val ? { [val]: val } : {}))) : {}}
          />
        );
      } else if (field.numberDisplay === 'list') {
        const steps = _.range(field.minimum, (field.maximum + field.interval), field.interval);
        component = (
          <Select 
            autoFocus={!isColumnEdit} 
            defaultValue={value} 
            onChange={(e) => onChange(e)}
            style={{ width: '100%' }}
          >
            { steps.map(step => <Option key={step}>{step}</Option>) }
          </Select>
        );
      } else {
        component = (
          <InputNumber 
            autoFocus={!isColumnEdit} 
            defaultValue={value instanceof Array ? null : value} 
            onChange={(e) => onChange(e)}
            min={field.minimum !== undefined && field.minimum !== null ? field.minimum : -Infinity}
            max={field.maximum !== undefined && field.maximum !== null ? field.maximum : Infinity}
            step={field.interval ? field.interval : undefined}
            precision={field.precision}
          />
        );
      }
      break;

    case 'date':
      component = (
        <DatePicker 
          defaultValue={value ? moment(value) : null} 
          onChange={(e) => onChange(e ? moment.utc(e).format() : null)}
        />
      );
      break;

    case 'checkbox':
      component = (
        <Checkbox 
          defaultChecked={value === 'True'} 
          onChange={(e) => { onChange(e.target.checked) }}
        />
      );
      break;

    default:
      component = null;
      break;
  };

  return component;
};

export default EditableField;
