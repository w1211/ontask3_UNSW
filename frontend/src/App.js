import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import { Layout, Menu, Breadcrumb } from 'antd';
import logo from './logo.png'; // Tell Webpack this JS file uses this image

import Login from './login/Login';
import Container from './container/Container';
import Workflow from './workflow/Workflow';

const { Header, Content, Footer } = Layout;

const LogoStyle = {
  width: '120px',
  height: '31px',
  margin: '16px 28px 16px 0',
  float: 'left'
};

const HeaderStyle = {
  lineHeight: '64px',
  borderBottom: '1px solid #e8e8e8',
  background: '#fff'
}

class App extends React.Component {
  render() {
    return (
      <Layout style={{ minHeight: '100%' }}>
        <Header style={HeaderStyle}>
          <img src={logo} alt="Logo" style={LogoStyle}/>
          <Menu mode="horizontal" defaultSelectedKeys={['1']} style={{ lineHeight: '62px' }}>
            <Menu.Item key="1">Dashboard</Menu.Item>
            <Menu.Item key="2">About</Menu.Item>
            <Menu.Item key="3">Help</Menu.Item>
            <Menu.Item key="4">Contact</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item>Containers</Breadcrumb.Item>
          </Breadcrumb>
          <Layout style={{ padding: '24px 0', background: '#fff' }}>
            <Content style={{ padding: '0 24px', minHeight: 280 }}>
              <Router>
                <Switch>
                  <Route exact path="/" component={Login}/>
                  <Route path="/containers" component={Container}/>
                  <Route path="/workflow/:id" component={Workflow}/>
                </Switch>
              </Router>
            </Content>
          </Layout>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          © OnTask Project 2017
        </Footer>
      </Layout>
    );
  };
};

export default App;
