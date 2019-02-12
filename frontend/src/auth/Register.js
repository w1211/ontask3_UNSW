import React from "react";
import { Form, Modal, Input, Icon, Alert, notification } from "antd";
import { register } from "./AuthActions";

import formItemLayout from "../shared/FormItemLayout";

const FormItem = Form.Item;

class Register extends React.Component {
  state = {
    loading: false,
    error: null
  };

  handleOk = () => {
    const { form, closeModal } = this.props;

    form.validateFields((err, payload) => {
      if (err) return;

      this.setState({ loading: true });

      delete payload.confirmPassword;

      register({
        payload,
        onError: error => this.setState({ error, loading: false }),
        onFinish: () => {
          this.setState({ error: null, loading: false });
          notification["success"]({
            message: "Sign up successful",
            description: "You may now sign in using the provided credentials."
          });
          closeModal();
        }
      });
    });
  };

  handleCancel = () => {
    const { form, closeModal } = this.props;

    form.resetFields();
    closeModal();
  };

  render() {
    const { form, visible } = this.props;
    const { error, loading } = this.state;
    const { getFieldDecorator, getFieldValue } = form;

    return (
      <Modal
        title="Sign up"
        visible={visible}
        confirmLoading={loading}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
      >
        <FormItem {...formItemLayout} label="Email">
          {getFieldDecorator("email", {
            validateTrigger: "onBlur",
            rules: [
              { type: "email", message: "Email is invalid" },
              { required: true, message: "Email is required" }
            ]
          })(<Input type="email" />)}
        </FormItem>

        <FormItem {...formItemLayout} label="First name">
          {getFieldDecorator("first_name", {
            rules: [{ required: true, message: "First name is required" }]
          })(<Input />)}
        </FormItem>

        <FormItem {...formItemLayout} label="Last name">
          {getFieldDecorator("last_name", {
            rules: [{ required: true, message: "Last name is required" }]
          })(<Input />)}
        </FormItem>

        <FormItem {...formItemLayout} label="Password">
          {getFieldDecorator("password", {
            validateTrigger: "onBlur",
            rules: [
              { min: 8, message: "Password must be at least 8 characters" },
              { required: true, message: "Password is required" }
            ]
          })(<Input type="password" />)}
        </FormItem>

        <FormItem {...formItemLayout} label="Confirm password">
          {getFieldDecorator("confirmPassword", {
            validateTrigger: "onBlur",
            rules: [
              getFieldValue("password")
                ? {
                    type: "enum",
                    enum: [getFieldValue("password")],
                    message: "Password does not match"
                  }
                : {},
              {
                required: true,
                message: "Password confirmation is required"
              }
            ]
          })(<Input type="password" />)}
        </FormItem>

        {error && <Alert message={error} type="error" className="error" />}
      </Modal>
    );
  }
}

export default Form.create()(Register);
