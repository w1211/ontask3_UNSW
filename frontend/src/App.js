import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import { Layout, Menu, Button } from 'antd';
import logo from './img/logo.png'; // Tell Webpack this JS file uses this image

import requestWrapper from './shared/requestWrapper';

import Login from './login/Login';
import Container from './container/Container';
import View from './view/View';
import Workflow from './workflow/Workflow';
import StaticPageStudent from './staticPage/StaticPageStudent';
import StaticPageStaff from './staticPage/StaticPageStaff';
import StaticPageHistoryStaff from './staticPage/StaticPageHistoryStaff';
import StaticPageHistoryStudent from './staticPage/StaticPageHistoryStudent';

const { Header, Footer } = Layout;
const queryString = require('query-string');
const link_id = queryString.parse(window.location.search).link_id;
const zid = queryString.parse(window.location.search).zid;

//if user has longtime token in localstorage then can access the page they wish to access
//if user does not has longtime token redirect them to login page
const AuthenticatedRoute = ({ component: Component, ...routeProps }) => (
  <Route {...routeProps} render={props => (
    localStorage.getItem('token')? (
      <Component {...props}/>
    ) : (
      <Redirect to="/"/>
    )
  )}/>
)

class App extends React.Component {

  state = { didLogin: false, didLogout: false };

  logout() {
    localStorage.removeItem('token');
    this.setState({ didLogout: true });
  }

  //if there is one time toke in query string, post it to backend to get longtimetoken and store in local storage
  componentWillMount(){
    const oneTimeToken = queryString.parse(window.location.search).tkn;

    if (oneTimeToken) {
      const payload = { token: oneTimeToken };
      const parameters = {
        url: `/user/token/`,
        method: 'POST',
        errorFn: (error) => {
          this.setState({ error: error });
        },
        successFn: (response) => {
          localStorage.setItem('token', response.token);
          this.forceUpdate();
        },
        payload: payload,
        isUnauthenticated: true
      }
      requestWrapper(parameters);
    } 
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
            <AuthenticatedRoute path="/view/:id" component={View}/>
            <AuthenticatedRoute path="/workflow/:id" component={Workflow}/>
            <AuthenticatedRoute path="/staticPageHistoryStaff/:id" component={StaticPageHistoryStaff}/>
            <AuthenticatedRoute path="/staticPageHistoryStudent" component={StaticPageHistoryStudent}/>
            <AuthenticatedRoute path="/staticPageStudent" component={StaticPageStudent}/>
            <AuthenticatedRoute path="/staticPageStaff" component={StaticPageStaff}/>
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
