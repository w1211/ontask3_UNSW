import React from "react";
import { Switch, Route, Link, Redirect } from "react-router-dom";
import { Spin, Layout, Breadcrumb, Icon, Menu } from "antd";
import { DragDropContext } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import _ from "lodash";

import "./DataLab.css";

import Model from "./model/Model";
import Details from "./details/Details";
import Data from "./data/Data";
import WebForm from "./webform/WebForm";

import apiRequest from "../shared/apiRequest";

const { Content, Sider } = Layout;
const SubMenu = Menu.SubMenu;

class DataLab extends React.Component {
  state = { fetching: true, isForm: false };

  componentDidMount() {
    const { match, location, history } = this.props;

    const route = location.pathname.split("/");
    const isForm = route[route.length - 2] === "form";

    const containerId = _.get(location, "state.containerId");

    if (isForm) {
      this.setState({ fetching: false });
    } else {
      // User pressed "Create DataLab", as the containerId is only set in the
      // location state when the navigation occurs
      if (containerId) {
        apiRequest(`/container/${containerId}/datasources/`, {
          method: "GET",
          onSuccess: datasources =>
            this.setState({ fetching: false, datasources, containerId }),
          onError: () => this.setState({ fetching: false })
        });
      } else if (match.params.id) {
        apiRequest(`/datalab/${match.params.id}/`, {
          method: "GET",
          onSuccess: datalab => {
            this.setState({
              fetching: false,
              ...datalab
            });
          },
          onError: () => this.setState({ fetching: false })
        });
      } else {
        // The user must have cold-loaded the URL, so we have no container to reference
        // Therefore redirect the user back to the container list
        history.push("/containers");
      }
    }
  }

  componentDidUpdate(prevState) {
    const { match } = this.props;
    const { showBreadcrumbs, name } = this.state;

    if (!prevState.showBreadcrumbs && showBreadcrumbs && !name) {
      apiRequest(`/datalab/${match.params.id}/`, {
        method: "GET",
        onSuccess: datalab => {
          this.setState({
            ...datalab
          });
        }
      });
    }
  }

  updateDatalab = datalab => {
    this.setState({ ...datalab });
  };

  render() {
    const { match, history, location } = this.props;
    const {
      showBreadcrumbs,
      fetching,
      datasources,
      name,
      steps,
      order,
      data
    } = this.state;

    const route = location.pathname.split("/");
    const isForm = route[route.length - 2] === "form";

    const webForms = [];
    steps &&
      steps.forEach((step, stepIndex) => {
        if (_.get(step, "form.webForm.active"))
          webForms.push({ name: step.form.name, index: stepIndex });
      });

    const selectedId = match.params.id;

    let menuKey = [location.pathname.split("/")[3]];
    if (menuKey[0] === "form") menuKey.push(location.pathname.split("/")[4]);

    return (
      <div className={`dataLab ${isForm && !showBreadcrumbs && "is_web_form"}`}>
        <Content className="wrapper">
          {(!isForm || showBreadcrumbs) && (
            <Breadcrumb className="breadcrumbs">
              <Breadcrumb.Item>
                <Link to="/">Dashboard</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <Link to="/containers">Containers</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>DataLab</Breadcrumb.Item>
            </Breadcrumb>
          )}

          <Layout className="layout">
            <Content className="content">
              <Layout className="content_body">
                {(!isForm || showBreadcrumbs) && selectedId && (
                  <Sider width={200}>
                    <Menu
                      mode="inline"
                      selectedKeys={menuKey}
                      style={{ height: "100%" }}
                      defaultOpenKeys={menuKey.includes("form") ? ["form"] : []}
                    >
                      <Menu.Item key="back">
                        <Link to="/containers">
                          <Icon type="arrow-left" />
                          <span>Back to containers</span>
                        </Link>
                      </Menu.Item>

                      <Menu.Divider />

                      <Menu.Item key="settings">
                        <Link to={`${match.url}/settings`}>
                          <Icon type="setting" />
                          <span>Settings</span>
                        </Link>
                      </Menu.Item>

                      <Menu.Item key="data">
                        <Link to={`${match.url}/data`}>
                          <Icon type="table" />
                          <span>Data</span>
                        </Link>
                      </Menu.Item>

                      <Menu.Item key="details">
                        <Link to={`${match.url}/details`}>
                          <Icon type="profile" />
                          <span>Details</span>
                        </Link>
                      </Menu.Item>

                      {webForms.length > 0 && (
                        <SubMenu
                          key="form"
                          title={
                            <span>
                              <Icon type="global" />
                              <span>Web forms ({webForms.length})</span>
                            </span>
                          }
                        >
                          {webForms.map(webForm => (
                            <Menu.Item key={webForm.index}>
                              <Link to={`${match.url}/form/${webForm.index}`}>
                                <span>{webForm.name}</span>
                              </Link>
                            </Menu.Item>
                          ))}
                        </SubMenu>
                      )}
                    </Menu>
                  </Sider>
                )}

                <Content className="content" style={{ overflowY: "hidden" }}>
                  {fetching ? (
                    <Spin size="large" />
                  ) : (
                    <div>
                      {!isForm && <h1>{name ? name : "Create DataLab"}</h1>}

                      {!selectedId && (
                        <Link
                          to="/containers"
                          style={{ display: "inline-block", marginBottom: 20 }}
                        >
                          <Icon type="arrow-left" />
                          <span>Back to containers</span>
                        </Link>
                      )}

                      {selectedId ? (
                        <Switch>
                          <Redirect
                            exact
                            from={match.url}
                            to={`${match.url}/settings`}
                          />

                          <Route
                            path={`${match.url}/settings`}
                            render={props => (
                              <Model
                                {...props}
                                datasources={datasources}
                                selectedId={selectedId}
                                name={name}
                                steps={steps}
                                updateDatalab={this.updateDatalab}
                              />
                            )}
                          />

                          <Route
                            path={`${match.url}/data`}
                            render={props => (
                              <Data
                                {...props}
                                steps={steps}
                                data={data}
                                order={order}
                                selectedId={selectedId}
                                updateDatalab={this.updateDatalab}
                              />
                            )}
                          />

                          <Route
                            path={`${match.url}/details`}
                            render={props => (
                              <Details
                                {...props}
                                datasources={datasources}
                                selectedId={selectedId}
                                steps={steps}
                                order={order}
                                updateDatalab={this.updateDatalab}
                              />
                            )}
                          />

                          <Route
                            path={`${match.url}/form/:moduleIndex`}
                            render={props => (
                              <WebForm
                                {...props}
                                dataLabId={match.params.id}
                                showBreadcrumbs={() =>
                                  this.setState({ showBreadcrumbs: true })
                                }
                              />
                            )}
                          />
                        </Switch>
                      ) : (
                        <Model
                          history={history}
                          location={location}
                          datasources={datasources}
                          updateDatalab={this.updateDatalab}
                        />
                      )}
                    </div>
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

export default DragDropContext(HTML5Backend)(DataLab);
