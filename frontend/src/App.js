import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { withRouter } from "react-router";
import { Layout, Menu, Button } from "antd";
import queryString from "query-string";
import _ from "lodash";

import logo from "./img/logo.png";

import { requestToken } from "./auth/AuthActions";

import Login from "./auth/Login";
import Container from "./container/Container";
import DataLab from "./dataLab/DataLab";
import Workflow from "./workflow/Workflow";

import "./App.css";

const { Header, Footer } = Layout;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { hasToken: false };
  }

  logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    this.setState({ hasToken: false });
  };

  finishRequestToken = response => {
    localStorage.setItem("token", response.token);
    localStorage.setItem("email", response.email);
    this.setState({ hasToken: true });
  };

  componentWillMount() {
    this.setState({
      hasToken: localStorage.getItem("token") ? true : false
    });

    const oneTimeToken = queryString.parse(window.location.search).tkn;
    if (oneTimeToken) requestToken(oneTimeToken, this.finishRequestToken);
  }

  AuthenticatedRoute = ({ component: Component, ...routeProps }) => {
    const { location } = this.props;
    const { hasToken } = this.state;

    return (
      <Route
        {...routeProps}
        render={props =>
          hasToken ? (
            <Component {...props} />
          ) : (
            <Redirect
              to={{
                pathname: "/",
                state: { redirectTo: location.pathname }
              }}
            />
          )
        }
      />
    );
  };

  render() {
    const { location, history } = this.props;
    const { hasToken } = this.state;

    const pathName = location.pathname.slice(1);
    let menuKey;
    if (["about", "help", "contact"].includes(pathName)) {
      menuKey = pathName;
    } else {
      menuKey = "dashboard";
    }

    const redirectTo = _.get(location, "state.redirectTo");

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
              history.push(key === "dashboard" ? "/" : `/${key}`)
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
            render={() =>
              !hasToken ? (
                <Login onLogin={() => this.setState({ hasToken: true })} />
              ) : (
                <Redirect to={redirectTo ? redirectTo : "/containers"} />
              )
            }
          />

          {this.AuthenticatedRoute({
            path: "/containers",
            component: Container
          })}

          {this.AuthenticatedRoute({
            path: "/datalab/:id?",
            component: DataLab
          })}

          {this.AuthenticatedRoute({
            path: "/workflow/:id",
            component: Workflow
          })}
        </Switch>

        <Footer className="footer">© OnTask Project 2018</Footer>
      </Layout>
    );
  }
}

export default withRouter(App);
