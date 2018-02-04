import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import { Layout, Menu } from 'antd';
import logo from './img/logo.png'; // Tell Webpack this JS file uses this image

import Login from './login/Login';
import Container from './container/Container';
import Workflow from './workflow/Workflow';

const { Header, Footer } = Layout;


class App extends React.Component {

  render() {
    return (
      <Layout style={{ minHeight: '100%' }}>
        <Header style={{ lineHeight: '64px', borderBottom: '1px solid #e8e8e8', background: '#fff' }}>
          <img src={logo} alt="Logo" style={{ width: '120px', height: '31px', margin: '16px 28px 16px 0', float: 'left' }}/>
          <Menu mode="horizontal" defaultSelectedKeys={['1']} style={{ lineHeight: '62px' }}>
            <Menu.Item key="1">Dashboard</Menu.Item>
            <Menu.Item key="2">About</Menu.Item>
            <Menu.Item key="3">Help</Menu.Item>
            <Menu.Item key="4">Contact</Menu.Item>
          </Menu>
        </Header>
        <Router>
          <Switch>
            <Route exact path="/" component={Login}/>
            <Route path="/containers" component={Container}/>
            <Route path="/workflow/:id" component={Workflow}/>
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
