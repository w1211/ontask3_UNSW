import React from 'react';
import { Modal, Form, Icon, Input } from 'antd';

import formItemLayout from '../../shared/FormItemLayout';

const FormItem = Form.Item;


const ResolveFieldNameModal = ({ form, formState, visible, onCancel, onOk }) => {
  // Don't render anything if visible is false, 
  // So that the form does not try to validate against the fields in this component
  if (!formState || !visible) return null;

  const fields = formState && formState.columns ? formState.columns.map(column => (column.label && column.label.value) ? column.label.value : column.field.value): [];

  const checkFields = (rule, value, callback) => {
    // If the provided value is already in the list of fields for this view, then show an error
    if (fields.includes(value)) {
      callback('Field name is already being used');
    }
    // Otherwise return no errors
    callback();
    return;
  };
  
  return (
    <Modal
      visible={visible}
      title={
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Icon type="exclamation-circle" style={{ marginRight: 5, color: '#faad14', fontSize: '150%'}}/>
          Resolve Field Name Conflict
        </div>
      }
      onCancel={onCancel}
      onOk={onOk}
      width={350}
    >
      <p>A field is already being used with this name. Provide a new name (label) for this field:</p>
      <FormItem {...formItemLayout} label="Label">
          {form.getFieldDecorator('label', {
            rules: [
              { required: true, message: 'Label is required' },
              { validator: checkFields } // Custom validator to ensure that the new field name is not another duplicate
            ]
          })(
            <Input/>
          )}
      </FormItem>
    </Modal>
  );
};

export default ResolveFieldNameModal;
