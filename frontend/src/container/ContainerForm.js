import React from 'react';

import { Form, Input } from 'antd';

const FormItem = Form.Item;
const { TextArea } = Input;


class ContainerForm extends React.Component {
  render() {
    const { getFieldDecorator } = this.props.form;

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

    return (
      <Form layout="horizontal">
        <FormItem
          {...formItemLayout}
          label="Code"
        >
          {getFieldDecorator('code', {
            initialValue: this.props.container ? this.props.container.code : null,
            rules: [{ required: true, message: 'Code is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="School"
        >
          {getFieldDecorator('school', {
            initialValue: this.props.container ? this.props.container.school : null
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Faculty"
        >
          {getFieldDecorator('faculty', {
            initialValue: this.props.container ? this.props.container.faculty : null
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Description"
        >
          {getFieldDecorator('description', {
            initialValue: this.props.container ? this.props.container.description : null,
            rules: [{ required: true, message: 'Description is required' }]
          })(
            <TextArea rows={4}/>
          )}
        </FormItem>
      </Form>
    );

  }
}

export default Form.create()(ContainerForm);
