import React, { Component } from "react";
import { Switch, Redirect, Link, Route } from "react-router-dom";
import { Layout, Menu, Icon } from "antd";

import UserList from "./interfaces/UserList";

const { Content, Sider } = Layout;

class Administration extends Component {
  state = { navigation: false };

  showNavigation = () => {
    this.setState({ navigation: true });
  };

  render() {
    const { match, location } = this.props;
    const { navigation } = this.state;
    const currentKey = location.pathname.split("/")[1].toLowerCase();

    return (
      <div>
        <Content className="wrapper">
          <Layout className="layout">
            <Content className="content">
              <Layout className="content_body">
                {navigation && (
                  <Sider width={200}>
                    <Menu
                      mode="inline"
                      selectedKeys={[currentKey]}
                      style={{ height: "100%" }}
                    >
                      <Menu.Item key="back">
                        <Link to="/dashboard">
                          <Icon type="arrow-left" />
                          <span>Back to dashboard</span>
                        </Link>
                      </Menu.Item>

                      <Menu.Divider />

                      <Menu.Item key="administration">
                        <Link to={`/administration`}>
                          <Icon type="team" />
                          <span>Users</span>
                        </Link>
                      </Menu.Item>
                    </Menu>
                  </Sider>
                )}

                <Content className="content">
                  <Switch>
                    <Redirect
                      exact
                      from={match.url}
                      to={`${match.url}/users`}
                    />

                    <Route
                      path={`${match.url}/users`}
                      render={props => (
                        <UserList
                          {...props}
                          showNavigation={this.showNavigation}
                        />
                      )}
                    />
                  </Switch>
                </Content>
              </Layout>
            </Content>
          </Layout>
        </Content>
      </div>
    );
  }
}
export default Administration;
