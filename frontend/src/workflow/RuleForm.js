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

const handleOk = (form, rule, onCreate, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    if (rule) {
      onUpdate(rule, values);
    } else {
      onCreate(values)
    }
  });
}

const RuleForm = ({ form, rule, visible, loading, onCancel, onCreate, onUpdate, error }) => (
  <Modal
    visible={visible}
    title={rule ? 'Update rule' : 'Create rule'}
    okText={rule ? 'Update' : 'Create'}
    onCancel={() => {form.resetFields(); onCancel()}}
    onOk={() => {handleOk(form, rule, onCreate, onUpdate)}}
    confirmLoading={loading}
  >
    <Form layout="horizontal">
      <FormItem
        {...formItemLayout}
        label="Name"
      >
        {form.getFieldDecorator('name', {
          initialValue: rule ? rule.name : null,
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
          initialValue: rule ? rule.description : null
        })(
          <TextArea rows={4}/>
        )}
      </FormItem>
      { error && <Alert message={error} type="error"/>}
    </Form>
  </Modal>
)

export default Form.create()(RuleForm)
