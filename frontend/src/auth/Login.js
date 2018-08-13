import React from "react";
import { Tabs, Form, Icon, Input, Button, Alert } from "antd";
import { login } from "./AuthActions";

import aaf from "../img/aaf.png";
import loginImg from "../img/loginImg.png";
import Register from "./Register";

import "./Login.css";

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;

class Login extends React.Component {
  state = {
    loading: false,
    error: null,
    registerVisible: false
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
    const { error, loading, registerVisible } = this.state;

    return (
      <div className="login">
        <div className="content">
          <div>
            <img src={loginImg} alt="Login" className="login_image" />
          </div>

          <div>
            <Tabs
              defaultActiveKey={process.env.REACT_APP_DEMO ? "2" : "1"}
              className="tabs"
            >
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
                {process.env.REACT_APP_DEMO && (
                  <div>
                    <div className="register">
                      New to OnTask?
                      <br />
                      <a
                        onClick={() => this.setState({ registerVisible: true })}
                      >
                        Click here to register an account
                      </a>
                    </div>

                    <Register
                      visible={registerVisible}
                      closeModal={() =>
                        this.setState({ registerVisible: false })
                      }
                    />
                  </div>
                )}

                <Form>
                  <FormItem>
                    {form.getFieldDecorator("email", {
                      rules: [{ required: true, message: "Email is required" }]
                    })(
                      <Input
                        prefix={<Icon type="mail" />}
                        placeholder="Email"
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
                    Sign in
                  </Button>

                  {error && (
                    <Alert message={error} type="error" className="error" />
                  )}
                </Form>
              </TabPane>
            </Tabs>
          </div>
        </div>

        {process.env.REACT_APP_DEMO && (
          <Alert
            className="demo_warning"
            showIcon
            type="warning"
            message="Data stored in this demo version of OnTask may be wiped when 
            new features are released. Please do not upload confidential data."
          />
        )}
      </div>
    );
  }
}

export default Form.create()(Login);
