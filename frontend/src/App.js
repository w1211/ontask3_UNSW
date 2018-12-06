import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { withRouter } from "react-router";
import { Layout, Menu, Button, Icon } from "antd";
import queryString from "query-string";
import _ from "lodash";

import logo from "./img/logo.png";

import { requestToken } from "./auth/AuthActions";

import Login from "./auth/Login";
import Container from "./container/Container";
import DataLab from "./dataLab/DataLab";
import Action from "./action/Action";

import "./App.css";

const { Header, Footer, Sider, Content } = Layout;

const smallScreenWidth = 768;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { hasToken: false, width: 0 };
  }

  componentDidMount() {
    this.updateWindowWidth();
    window.addEventListener("resize", this.updateWindowWidth);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowWidth);
  }

  updateWindowWidth = () => {
    this.setState({ width: window.innerWidth });
  };

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

  menuComponent = (menuKey, webForm) => {
    const { history } = this.props;
    const { width } = this.state;

    const mode = width >= smallScreenWidth ? "horizontal" : "inline";

    return (
      <Menu
        mode={mode}
        defaultSelectedKeys={[menuKey]}
        theme="light"
        className="navigation"
        onSelect={({ key }) =>
          history.push(
            key === "dashboard" ? (webForm ? webForm : "/") : `/${key}`
          )
        }
      >
        <Menu.Item key="dashboard">{webForm ? "Form" : "Dashboard"}</Menu.Item>
        <Menu.Item key="about">About</Menu.Item>
        <Menu.Item key="help">Help</Menu.Item>
        <Menu.Item key="contact">Contact</Menu.Item>
        {mode === "inline" && (
          <Menu.Item key="logout">
            Logout <Icon type="logout" />
          </Menu.Item>
        )}
      </Menu>
    );
  };

  render() {
    const { location } = this.props;
    const { hasToken, width } = this.state;

    const pathName = location.pathname.slice(1).split("/");
    let menuKey;
    if (["about", "help", "contact"].includes(pathName[0])) {
      menuKey = pathName;
    } else {
      menuKey = "dashboard";
    }

    const webForm = pathName[2] === "form";
    const feedbackForm = pathName[2] === "feedback";

    const redirectTo = _.get(location, "state.redirectTo");
    const shouldRedirectToAAF = _.get(location, "state.shouldRedirectToAAF");

    if (!hasToken && shouldRedirectToAAF && process.env.REACT_APP_AAF_URL)
      window.location = process.env.REACT_APP_AAF_URL;

    return (
      <Layout className="app">
        {width >= smallScreenWidth ? (
          <Header className="header">
            <img src={logo} alt="OnTask" className="logo" />

            {hasToken && (
              <div className="logout">
                <Button icon="logout" onClick={this.logout} />
              </div>
            )}

            {!feedbackForm && this.menuComponent(menuKey, webForm)}
          </Header>
        ) : (
          <Sider
            breakpoint="md"
            collapsedWidth="0"
            className="sider-navigation"
          >
            <img src={logo} alt="OnTask" className="sider-logo" />
            {!feedbackForm && this.menuComponent(menuKey, webForm)}
          </Sider>
        )}

        <Content>
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
              path: "/action/:id",
              component: Action,
              feedbackForm
            })}
          </Switch>

          <Footer className="footer">© OnTask Project 2018</Footer>
        </Content>
      </Layout>
    );
  }
}

export default withRouter(App);
