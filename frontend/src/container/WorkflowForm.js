import React from 'react';

import { Modal, Form, Input, Alert } from 'antd';

const FormItem = Form.Item;
const { TextArea } = Input;


const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 5 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 19 },
  },
};

const handleOk = (form, container, workflow, onCreate, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    if (workflow) {
      onUpdate(container, workflow, values);
    } else {
      onCreate(container, values)
    }
  });
}

const WorkflowForm = ({ form, container, workflow, visible, loading, onCancel, onCreate, onUpdate, error }) => (
  <Modal
    visible={visible}
    title={workflow ? 'Update workflow' : 'Create workflow'}
    okText={workflow ? 'Update' : 'Create'}
    onCancel={onCancel}
    onOk={() => {handleOk(form, container, workflow, onCreate, onUpdate)}}
    confirmLoading={loading}
  >
    <Form layout="horizontal">
      <FormItem
        {...formItemLayout}
        label="Name"
      >
        {form.getFieldDecorator('name', {
          initialValue: workflow ? workflow.name : null,
          rules: [{ required: true, message: 'Name is required' }]
        })(
          <Input/>
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label="Description"
      >
        {form.getFieldDecorator('description', {
          initialValue: workflow ? workflow.description : null,
          rules: [{ required: true, message: 'Description is required' }]
        })(
          <TextArea rows={4}/>
        )}
      </FormItem>
      { error && <Alert message={error} type="error"/>}
    </Form>
  </Modal>
)

export default Form.create()(WorkflowForm)
