import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { withRouter } from "react-router";
import { Layout, Menu, Button } from "antd";
import queryString from "query-string";
import _ from "lodash";

import logo from "./img/logo.png";

import { requestToken } from "./auth/AuthActions";

import Login from "./auth/Login";
import Dashboard from "./container/Dashboard";
import Datasource from "./datasource/Datasource";
import DataLab from "./dataLab/DataLab";
import Action from "./action/Action";

import Forbidden from "./error/Forbidden";

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

  AuthenticatedRoute = ({
    component: Component,
    feedbackForm,
    ...routeProps
  }) => {
    const { location } = this.props;
    const { hasToken } = this.state;

    const shouldRedirectToAAF =
      feedbackForm && process.env.NODE_ENV !== "development";

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
                state: {
                  redirectTo: location.pathname + location.search,
                  shouldRedirectToAAF
                }
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

    const pathName = location.pathname.slice(1).split("/");
    let menuKey;
    if (["about", "help", "contact"].includes(pathName[0])) {
      menuKey = pathName;
    } else {
      menuKey = "dashboard";
    }

    const webForm = pathName[2] === "form";
    const feedbackForm = pathName[0] === "feedback";

    const redirectTo = _.get(location, "state.redirectTo");
    const shouldRedirectToAAF = _.get(location, "state.shouldRedirectToAAF");

    if (!hasToken && shouldRedirectToAAF && process.env.REACT_APP_AAF_URL)
      window.location = process.env.REACT_APP_AAF_URL;

    return (
      <Layout className="app">
        <Header className="header">
          <img src={logo} alt="OnTask" className="logo" />

          {hasToken && (
            <div className="logout">
              <Button icon="logout" onClick={this.logout} />
            </div>
          )}

          {!feedbackForm && (
            <Menu
              mode="horizontal"
              defaultSelectedKeys={[menuKey]}
              className="navigation"
              onSelect={({ key }) =>
                history.push(
                  key === "dashboard" ? (webForm ? webForm : "/") : `/${key}`
                )
              }
            >
              <Menu.Item key="dashboard">
                {webForm ? "Form" : "Dashboard"}
              </Menu.Item>
              <Menu.Item key="about">About</Menu.Item>
              <Menu.Item key="help">Help</Menu.Item>
              <Menu.Item key="contact">Contact</Menu.Item>
            </Menu>
          )}
        </Header>

        <Switch>
          <Route
            exact
            path="/"
            render={() =>
              !hasToken ? (
                <Login onLogin={() => this.setState({ hasToken: true })} />
              ) : (
                <Redirect to={redirectTo ? redirectTo : "/dashboard"} />
              )
            }
          />

          {this.AuthenticatedRoute({
            path: "/dashboard",
            component: Dashboard,
          })}

          {this.AuthenticatedRoute({
            path: "/datasource/:id?",
            component: Datasource
          })}

          {this.AuthenticatedRoute({
            path: "/datalab/:id?",
            component: DataLab
          })}

          {this.AuthenticatedRoute({
            path: "/action/:id",
            component: Action
          })}

          <Route exact path="/forbidden" component={Forbidden} />
          
          <Route
            path="/feedback/:id"
            render={props => <Action {...props} isFeedbackForm />}
          />
        </Switch>

        <Footer className="footer">© OnTask Project 2018</Footer>
      </Layout>
    );
  }
}

export default withRouter(App);
