import React from 'react';
import { Redirect } from 'react-router-dom';
import { Form, Icon, Input, Button, Alert } from 'antd';

import aaf from '../img/aaf.png';

const queryString = require('query-string');

const FormItem = Form.Item;


class Login extends React.Component {
  state = { error: null };

  handleSubmit() {
    const { form, history } = this.props;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      fetch(`/user/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      })
      .then(response => {
        if (response.status >= 400 && response.status < 600) {
          response.json().then(response => {
            this.setState({ error: response.error });
          });
        } else {
          response.json().then(response => {
            localStorage.setItem('token', response.token);
            history.push("containers");
          })
        }
      })
      .catch(error => {
        this.setState({ error: error });
      })

    });
  }

  componentDidMount() {
    const oneTimeToken = queryString.parse(window.location.search).tkn;
    const authToken = localStorage.getItem('token');
    const payload = { token: oneTimeToken };

    if (!authToken && oneTimeToken) {
      fetch('http://uat-ontask2.teaching.unsw.edu.au/user/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (response.status >= 400 && response.status < 600) {
          response.json().then(error => {
            console.log(error);
          });
        } else {
          response.json().then(response => {
            localStorage.setItem('token', response.token);
            this.props.history.push("containers");
          })
        }
      })
      .catch(error => {
        console.log(error);
      })
    } else if (authToken) {
      this.props.history.push("containers");
    }

  }


  render() {
    const { form } = this.props;

    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        { localStorage.getItem('token') ?
          <Redirect to="/containers"/>
        :
          <Form>
            <div style={{ margin: '30px 0', minWidth: 350, border: '1px solid #d9d9d9', padding: 20 }}>
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
            </div>
            { this.state.error && <Alert style={{ marginBottom: 20 }} message={this.state.error} type="error"/>}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Button style={{ marginBottom: 20 }}size="large" type="primary" onClick={() => { this.handleSubmit() }}>
                Log in
              </Button>
              <a href="https://rapid.aaf.edu.au/jwt/authnrequest/research/QGSS9UUcaI6UXa7v6AL3Yg"><img src={aaf} alt="AAF Logo" style={{ width: 200 }}/></a>
            </div>
          </Form>
        }
      </div>
    );
  };

};

export default Form.create()(Login);
