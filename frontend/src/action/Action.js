import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Switch, Route, Redirect } from "react-router-dom";
import { Layout, Breadcrumb, Icon, Spin, Menu } from "antd";

import * as ActionActionCreators from "./ActionActions";

import Compose from "./interfaces/Compose";
import Email from "./interfaces/Email";
import StaticPage from "./interfaces/StaticPage";

import "./Action.css";

const { Content, Sider } = Layout;

class Action extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      ActionActionCreators,
      dispatch
    );
  }

  componentDidMount() {
    const { match } = this.props;
    this.boundActionCreators.fetchAction(match.params.id);
  }

  render() {
    const { match, location, isFetching, action } = this.props;

    return (
      <div className="action">
        <Content className="wrapper">
          <Breadcrumb className="breadcrumbs">
            <Breadcrumb.Item>
              <Link to="/">Dashboard</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/containers">Containers</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Action</Breadcrumb.Item>
          </Breadcrumb>

          <Layout className="layout">
            <Content className="content">
              <Layout className="content_body">
                <Sider width={200}>
                  <Menu
                    mode="inline"
                    selectedKeys={[location.pathname.split("/")[3]]}
                    style={{ height: "100%" }}
                  >
                    <Menu.Item key="back">
                      <Link to="/containers">
                        <Icon type="arrow-left" />
                        <span>Back to containers</span>
                      </Link>
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Item key="compose">
                      <Link to={`${match.url}/compose`}>
                        <Icon type="form" />
                        <span>Compose</span>
                      </Link>
                    </Menu.Item>

                    <Menu.Item key="email">
                      <Link to={`${match.url}/email`}>
                        <Icon type="mail" />
                        <span>Email</span>
                      </Link>
                    </Menu.Item>

                    <Menu.Item key="static" disabled>
                      <Link to={`${match.url}/static`}>
                        <Icon type="link" />
                        <span>Static page</span>
                        {/* <Tag style={{ marginLeft: 5 }} color="red" size="small">OFF</Tag> */}
                      </Link>
                    </Menu.Item>
                  </Menu>
                </Sider>

                <Content className="content">
                  <h1>{action && action.name}</h1>

                  {isFetching ? (
                    <Spin size="large" />
                  ) : (
                    <Switch>
                      <Redirect
                        exact
                        from={match.url}
                        to={`${match.url}/compose`}
                      />

                      <Route
                        path={`${match.url}/compose`}
                        component={Compose}
                      />

                      <Route path={`${match.url}/email`} component={Email} />

                      <Route
                        path={`${match.url}/static`}
                        component={StaticPage}
                      />
                    </Switch>
                  )}
                </Content>
              </Layout>
            </Content>
          </Layout>
        </Content>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { isFetching, action } = state.action;
  return {
    isFetching,
    action
  };
};

export default connect(mapStateToProps)(Action);
