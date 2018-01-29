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


const handleOk = (form, container, onCreate, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    if (container) {
      onUpdate(container.id, values);
    } else {
      onCreate(values)
    }
  });
}

const ContainerModal = ({ 
  form, visible, loading, error, container, 
  onCreate, onUpdate, onCancel 
}) => (
  <Modal
    visible={visible}
    title={container ? 'Update container' : 'Create container'}
    okText={container ? 'Update' : 'Create'}
    onCancel={() => { form.resetFields(); onCancel() }}
    onOk={() => { handleOk(form, container, onCreate, onUpdate) }}
    confirmLoading={loading}
  >
    <Form layout="horizontal">
      <FormItem
        {...formItemLayout}
        label="Code"
      >
        {form.getFieldDecorator('code', {
          initialValue: container ? container.code : null,
          rules: [{ required: true, message: 'Code is required' }]
        })(
          <Input/>
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label="School"
      >
        {form.getFieldDecorator('school', {
          initialValue: container ? container.school : null
        })(
          <Input/>
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label="Faculty"
      >
        {form.getFieldDecorator('faculty', {
          initialValue: container ? container.faculty : null
        })(
          <Input/>
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label="Description"
      >
        {form.getFieldDecorator('description', {
          initialValue: container ? container.description : null,
          rules: [{ required: true, message: 'Description is required' }]
        })(
          <TextArea rows={4}/>
        )}
      </FormItem>
      { error && <Alert message={error} type="error"/>}
    </Form>
  </Modal>
)

export default Form.create()(ContainerModal)
