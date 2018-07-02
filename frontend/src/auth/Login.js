import React from "react";
import { Tabs, Form, Icon, Input, Button, Alert } from "antd";
import { login } from "./AuthActions";

import aaf from "../img/aaf.png";
import loginImg from "../img/loginImg.png";

import "./Login.css";

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;

class Login extends React.Component {
  state = {
    loading: false,
    error: null
  };

  beginLogin = () => {
    this.setState({ loading: true });
  };

  finishLogin = response => {
    const { onLogin } = this.props;

    this.setState({ loading: false });
    localStorage.setItem("token", response.token);
    localStorage.setItem("email", response.email);

    onLogin();
  };

  onError = error => {
    this.setState({
      loading: false,
      error
    });
  };

  handleSubmit = () => {
    const { form } = this.props;

    form.validateFields((err, values) => {
      if (err) return;

      login(values, this.beginLogin, this.finishLogin, this.onError);
    });
  };

  render() {
    const { form } = this.props;
    const { error, loading } = this.state;

    return (
      <div className="login">
        <div className="content">
          <div>
            <img src={loginImg} alt="Login" className="login_image" />
          </div>

          <div>
            <Tabs defaultActiveKey="1" className="tabs">
              <TabPane tab="AAF Login" key="1">
                <a href={`${process.env.REACT_APP_AAF_URL}`}>
                  <img
                    src={aaf}
                    alt="Australian Access Federation Login"
                    className="AAF"
                  />
                </a>
              </TabPane>

              <TabPane tab="Internal Login" key="2">
                <Form>
                  <FormItem>
                    {form.getFieldDecorator("email", {
                      rules: [
                        { required: true, message: "Username is required" }
                      ]
                    })(
                      <Input
                        prefix={<Icon type="user" />}
                        placeholder="Username"
                      />
                    )}
                  </FormItem>

                  <FormItem>
                    {form.getFieldDecorator("password", {
                      rules: [
                        { required: true, message: "Password is required" }
                      ]
                    })(
                      <Input
                        prefix={<Icon type="lock" />}
                        type="password"
                        placeholder="Password"
                        onPressEnter={this.handleSubmit}
                      />
                    )}
                  </FormItem>

                  <Button
                    size="large"
                    type="primary"
                    onClick={this.handleSubmit}
                    loading={loading}
                  >
                    Log in
                  </Button>

                  {error && (
                    <Alert message={error} type="error" className="error" />
                  )}
                </Form>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
}

export default Form.create()(Login);
