import React from 'react';
import { Input, InputNumber, DatePicker, Checkbox, Select } from 'antd';
import moment from 'moment';

const Option = Select.Option;


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
      if (field.textArea) {
        component = (
          <Input.TextArea
            autoFocus={!isColumnEdit} 
            onKeyPress={onKeyPress} 
            defaultValue={value} 
            onChange={(e) => onChange(e.target.value)}
            rows="5"
          />
        );
      } else {
        component = (
          <Input 
            autoFocus={!isColumnEdit} 
            onKeyPress={onKeyPress} 
            defaultValue={value} 
            onChange={(e) => onChange(e.target.value)}
          />
        );
      };
      break;

    case 'number':
      component = (
        <InputNumber 
          autoFocus={!isColumnEdit} 
          defaultValue={value} 
          onChange={(e) => onChange(e)}
        />
      );
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

    case 'dropdown':
      component = (
        <Select 
          defaultValue={value ? value : []}  style={{ width: '100%' }} 
          mode={field.multiSelect ? 'multiple' : 'default'}
          onChange={(e) => onChange(e)}
          allowClear={true}
        >
          { field.options.map(option => 
            <Option key={option.value}>{option.label}</Option>
          )}
        </Select>
      );
      break;

    default:
      component = null;
      break;
  };

  return component;
};

export default EditableField;
