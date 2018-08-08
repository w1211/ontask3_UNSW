import React from "react";
import { Form, Modal, Input, Icon, Alert, notification } from "antd";
import { register } from "./AuthActions";

const FormItem = Form.Item;

class Register extends React.Component {
  state = {
    loading: false,
    error: null
  };

  handleOk= () => {
    const { form, closeModal } = this.props;

    form.validateFields((err, payload) => {
      if (err) return;

      this.setState({ loading: true });

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
        loading={loading}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
      >
        <FormItem>
          {getFieldDecorator("fullname", {
            rules: [{ required: true, message: "Full name is required" }]
          })(<Input prefix={<Icon type="user" />} placeholder="Full name" />)}
        </FormItem>

        <FormItem>
          {getFieldDecorator("email", {
            validateTrigger: "onBlur",
            rules: [
              { type: "email", message: "Email is invalid" },
              { required: true, message: "Email is required" }
            ]
          })(
            <Input
              prefix={<Icon type="mail" />}
              type="email"
              placeholder="Email"
            />
          )}
        </FormItem>

        <FormItem>
          {getFieldDecorator("password", {
            validateTrigger: "onBlur",
            rules: [
              { min: 8, message: "Password must be at least 8 characters" },
              { required: true, message: "Password is required" }
            ]
          })(
            <Input
              prefix={<Icon type="lock" />}
              type="password"
              placeholder="Password"
            />
          )}
        </FormItem>

        <FormItem>
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
          })(
            <Input
              prefix={<Icon type="lock" />}
              type="password"
              placeholder="Confirm password"
            />
          )}
        </FormItem>

        {error && <Alert message={error} type="error" className="error" />}
      </Modal>
    );
  }
}

export default Form.create()(Register);
