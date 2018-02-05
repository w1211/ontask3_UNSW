import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import { Layout, Menu, Button } from 'antd';
import logo from './img/logo.png'; // Tell Webpack this JS file uses this image

import Login from './login/Login';
import Container from './container/Container';
import Workflow from './workflow/Workflow';

const queryString = require('query-string');

const { Header, Footer } = Layout;

const AuthenticatedRoute = ({ component: Component, ...routeProps }) => (
  <Route {...routeProps} render={props => (
    localStorage.getItem('token') ? (
      <Component {...props}/>
    ) : (
      <Redirect to="/"/>
    )
  )}/>
)

class App extends React.Component {

  state = { didLogin: false, didLogout: false };

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
            this.setState({ didLogin: true });
          })
        }
      })
      .catch(error => {
        console.log(error);
      })
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.setState({ didLogout: true });
  }

  render() {
    return (
      <Layout style={{ minHeight: '100%' }}>
        <Header style={{ lineHeight: '64px', borderBottom: '1px solid #e8e8e8', background: '#fff' }}>
          <img src={logo} alt="Logo" style={{ width: '120px', height: '31px', margin: '16px 28px 16px 0', float: 'left' }}/>
          { localStorage.getItem('token') && 
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', float: 'right' }}>
              <Button icon="logout" onClick={() => { this.logout(); }}/>
            </div>
          }
          <Menu mode="horizontal" defaultSelectedKeys={['1']} style={{ lineHeight: '62px' }}>
            <Menu.Item key="1">Dashboard</Menu.Item>
            <Menu.Item key="2">About</Menu.Item>
            <Menu.Item key="3">Help</Menu.Item>
            <Menu.Item key="4">Contact</Menu.Item>
          </Menu>
        </Header>
        <Router>
          <Switch>
            <Route exact path='/' render={(props) => (
              <Login {...props} onLogin={() => { this.setState({ didLogin: true }) }} />
            )}/>
            <AuthenticatedRoute path="/containers" component={Container}/>
            <AuthenticatedRoute path="/workflow/:id" component={Workflow}/>
          </Switch>
        </Router>
        <Footer style={{ textAlign: 'center' }}>
          © OnTask Project 2017
        </Footer>
      </Layout>
    );
  };

};

export default App;
