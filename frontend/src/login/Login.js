import React from 'react';
import { Redirect } from 'react-router-dom';
import { Row, Col, Tabs, Form, Icon, Input, Button, Alert } from 'antd';
import requestWrapper from '../shared/requestWrapper';

import aaf from '../img/aaf.png';
import loginImg from '../img/loginImg.png';

const queryString = require('query-string');

const FormItem = Form.Item;
const TabPane = Tabs.TabPane;

const LoginImgStyle = {
  width: '500px',
  margin: '16px 28px 16px 0',
  float: 'left'
};

class Login extends React.Component {
  state = { error: null };

  handleSubmit() {
    const { form, history, onLogin } = this.props;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      const parameters = {
        url: `/user/local/`,
        method: 'POST',
        errorFn: (error) => {
          this.setState({ error: error });
        },
        successFn: (response) => {
          localStorage.setItem('token', response.token);
          history.push("containers");
          onLogin();
        },
        payload: values,
        isUnauthenticated: true
      }
      requestWrapper(parameters);

    });
  }

  componentDidMount() {
    const { history, onLogin } = this.props;
    const oneTimeToken = queryString.parse(window.location.search).tkn;
    const authToken = localStorage.getItem('token');
    const payload = { token: oneTimeToken };

    if (!authToken && oneTimeToken) {
      const parameters = {
        url: `/user/token/`,
        method: 'POST',
        errorFn: (error) => {
          this.setState({ error: error });
        },
        successFn: (response) => {
          localStorage.setItem('token', response.token);
          history.push("containers");
          onLogin();
        },
        payload: payload,
        isUnauthenticated: true
      }
      requestWrapper(parameters);

    } else if (authToken) {
      history.push("containers");
    }

  }

  render() {
    const { form } = this.props;

    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        { localStorage.getItem('token') ?
          <Redirect to="/containers"/>
        :
          <Row type="flex" justify="center" align="top" gutter={50} style={{padding: '50px'}}>
            <Col><img src={loginImg} alt="Login" style={LoginImgStyle}/></Col>
            <Col style={{height:'350px', margin: '30px'}}>
              <Tabs defaultActiveKey="1" style={{width: '300px', margin: 'auto'}}>
                  <TabPane tab="Internal Login" key="1">
                    <Form style={{width: '300px'}}>
                      <FormItem>
                          {form.getFieldDecorator('email', {
                            rules: [{ required: true, message: 'Username is required' }],
                          })(
                            <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />
                          )}
                        </FormItem>
                        <FormItem>
                          {form.getFieldDecorator('password', {
                            rules: [{ required: true, message: 'Password is required' }],
                          })(
                            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
                          )}
                        </FormItem>
                      { this.state.error && <Alert style={{ marginBottom: 20 }} message={this.state.error} type="error"/>}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Button style={{ marginBottom: 20 }}size="large" type="primary" onClick={() => { this.handleSubmit() }}>
                          Log in
                        </Button>
                      </div>
                  </Form>
                  </TabPane>
                  <TabPane tab="AAF Login" key="2" >
                    <a href="https://rapid.aaf.edu.au/jwt/authnrequest/research/QGSS9UUcaI6UXa7v6AL3Yg"><img src={aaf} alt="AAF Logo" style={{ width: 200 }}/></a>
                  </TabPane>
              </Tabs>
            </Col>
          </Row>
        }
      </div>
    );
  };

};

export default Form.create()(Login);
