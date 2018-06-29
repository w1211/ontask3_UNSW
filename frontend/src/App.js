import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { withRouter } from "react-router";

import { Layout, Menu, Button } from "antd";
import queryString from "query-string";

import logo from "./img/logo.png";

import { requestToken } from "./auth/AuthActions";

import Login from "./auth/Login";
import Container from "./container/Container";
import DataLab from "./dataLab/DataLab";
import Workflow from "./workflow/Workflow";
import StaticPageStudent from "./staticPage/StaticPageStudent";
import StaticPageStaff from "./staticPage/StaticPageStaff";
import StaticPageHistoryStaff from "./staticPage/StaticPageHistoryStaff";
import StaticPageHistoryStudent from "./staticPage/StaticPageHistoryStudent";

import "./App.css";

const { Header, Footer } = Layout;

const AuthenticatedRoute = ({
  hasToken,
  component: Component,
  ...routeProps
}) => (
  <Route
    {...routeProps}
    render={props =>
      hasToken ? <Component {...props} /> : <Redirect to="/" />
    }
  />
);

class App extends React.Component {
  state = { didLogin: false, didLogout: false };

  logout = () => {
    localStorage.removeItem("token");
    this.setState({ didLogout: true });
  };

  finishRequestToken = response => {
    localStorage.setItem("token", response.token);
    localStorage.setItem("email", response.email);
    this.setState({ didLogin: true });
  };

  componentWillMount() {
    const oneTimeToken = queryString.parse(window.location.search).tkn;
    if (oneTimeToken) requestToken(oneTimeToken, this.finishRequestToken);
  }

  render() {
    const { location, history } = this.props;
    const hasToken = localStorage.getItem("token");

    const pathName = location.pathname.slice(1);
    let menuKey;
    if (["about", "help", "contact"].includes(pathName)) {
      menuKey = pathName;
    } else {
      menuKey = "dashboard";
    }

    return (
      <Layout className="app">
        <Header className="header">
          <img src={logo} alt="OnTask" className="logo" />
          {hasToken && (
            <div className="logout">
              <Button icon="logout" onClick={this.logout} />
            </div>
          )}
          <Menu
            mode="horizontal"
            defaultSelectedKeys={[menuKey]}
            className="navigation"
            onSelect={({ key }) =>
              history.push(key === "dashboard" ? "/" : key)
            }
          >
            <Menu.Item key="dashboard">Dashboard</Menu.Item>
            <Menu.Item key="about">About</Menu.Item>
            <Menu.Item key="help">Help</Menu.Item>
            <Menu.Item key="contact">Contact</Menu.Item>
          </Menu>
        </Header>

        <Switch>
          <Route
            exact
            path="/"
            render={props => (
              <Login
                {...props}
                hasToken={hasToken}
                onLogin={() => this.setState({ didLogin: true })}
              />
            )}
          />

          <AuthenticatedRoute
            hasToken={hasToken}
            path="/containers"
            component={Container}
          />

          <AuthenticatedRoute
            hasToken={hasToken}
            path="/datalab/:id?"
            component={DataLab}
          />

          <AuthenticatedRoute
            hasToken={hasToken}
            path="/workflow/:id"
            component={Workflow}
          />

          <AuthenticatedRoute
            hasToken={hasToken}
            path="/staticPageHistoryStaff/:id"
            component={StaticPageHistoryStaff}
          />

          <AuthenticatedRoute
            hasToken={hasToken}
            path="/staticPageHistoryStudent"
            component={StaticPageHistoryStudent}
          />

          <AuthenticatedRoute
            hasToken={hasToken}
            path="/staticPageStudent"
            component={StaticPageStudent}
          />

          <AuthenticatedRoute
            hasToken={hasToken}
            path="/staticPageStaff"
            component={StaticPageStaff}
          />
        </Switch>

        <Footer className="footer">© OnTask Project 2018</Footer>
      </Layout>
    );
  }
}

export default withRouter(App);
