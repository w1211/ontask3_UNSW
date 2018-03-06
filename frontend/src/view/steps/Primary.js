import React from 'react';
import { Modal, Form, Alert, Select } from 'antd';

import formItemLayout from '../../shared/FormItemLayout';

const FormItem = Form.Item;
const confirm = Modal.confirm;


const Primary = ({ form, formState, options, view, onChange }) => {

  const confirmChange = (e) => {
    // If the primary key already has a value, then prompt the user if they want to change it
    // If changing an existing value, then all other form values will be reset
    let currentPrimary = form.getFieldValue('primary');
  
    if (currentPrimary) {
      // Present a confirmation dialog to the user
      confirm({
        title: 'Change primary key',
        content: 'Any settings configured for this view will need to be re-entered if you change the primary key. Are you sure you want to proceed?',
        onOk() {
          onChange(e);
        }
      });
      // getValueFromEvent() doesn't support waiting for the result of the confirmation dialog, it expects a value immediately
      // So by default, we return the previous value of the primary field
      // If the user proceeds at the confirm dialog, then manually set the primary field to the new value
      return currentPrimary;
    // Primary key doesn't have a value yet, so no confirmation is needed
    } else {
      onChange(e);
      return e;
    }
  };

  return (
    <div>
      <FormItem
        {...formItemLayout}
        label="Primary key"
      >
        {form.getFieldDecorator('primary', {
          rules: [{ required: true, message: 'Primary key is required' }],
          initialValue: formState && formState.primary ? formState.primary.value : undefined,
          getValueFromEvent: confirmChange
        })(
          <Select>
            {options}
          </Select>
        )}
      </FormItem>
      <Alert style={{ marginTop: 10 }} message="Informational Notes" type="info" showIcon/>
    </div>
  );
};

export default Primary;
