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
import DataLabForm from "./form/Form";

import apiRequest from "../shared/apiRequest";

const { Content, Sider } = Layout;
const SubMenu = Menu.SubMenu;

class DataLab extends React.Component {
  state = { fetching: true, forms: [] };

  componentDidMount() {
    const { match, location, history } = this.props;

    const containerId = _.get(location, "state.containerId");

    // User pressed "Create DataLab", as the containerId is only set in the
    // location state when the navigation occurs
    if (containerId) {
      this.setState({
        fetching: false,
        datasources: _.get(location, "state.datasources", []),
        containerId
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

  updateDatalab = datalab => {
    this.setState({ ...datalab });
  };

  updateForms = ({ formIndex, updatedForm, isDelete }) => {
    const { forms } = this.state;

    if (isDelete) {
      forms.splice(formIndex, 1);
    } else {
      if (formIndex >= 0) {
        forms[formIndex] = updatedForm;
      } else {
        forms.push(updatedForm);
      }
    }

    this.setState({ forms });
  };

  render() {
    const { match, history, location } = this.props;
    const {
      fetching,
      datasources,
      name,
      steps,
      order,
      data,
      container,
      forms,
      columns
    } = this.state;

    const selectedId = match.params.id;

    let menuKey = [location.pathname.split("/")[3]];
    if (menuKey[0] === "form") menuKey.push(location.pathname.split("/")[4]);

    return (
      <div className="dataLab">
        <Content className="wrapper">
          <Breadcrumb className="breadcrumbs">
            <Breadcrumb.Item>
              <Link to="/">Dashboard</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/containers">Containers</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>DataLab</Breadcrumb.Item>
          </Breadcrumb>

          <Layout className="layout">
            <Content className="content">
              <Layout className="content_body">
                {selectedId && (
                  <Sider width={200}>
                    <Menu
                      mode="inline"
                      selectedKeys={menuKey}
                      style={{ height: "100%" }}
                      defaultOpenKeys={["form"]}
                    >
                      <Menu.Item key="back">
                        <Link to="/dashboard">
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

                      <SubMenu
                        key="form"
                        title={
                          <span>
                            <Icon type="form" />
                            <span>Forms ({forms.length})</span>
                          </span>
                        }
                      >
                        <Menu.Item key="create">
                          <Link to={`${match.url}/form/create`}>
                            <span>Create new form</span>
                          </Link>
                        </Menu.Item>

                        {forms.length > 0 && <Menu.Divider />}

                        {forms.map(form => (
                          <Menu.Item key={form.id}>
                            <Link to={`${match.url}/form/${form.id}`}>
                              <span>{form.name}</span>
                            </Link>
                          </Menu.Item>
                        ))}
                      </SubMenu>
                    </Menu>
                  </Sider>
                )}

                <Content className="content" style={{ overflowY: "hidden" }}>
                  {fetching ? (
                    <Spin size="large" />
                  ) : (
                    <div>
                      <h1>{name ? name : "Create DataLab"}</h1>

                      {!selectedId && (
                        <Link
                          to="/dashboard"
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
                                forms={forms}
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
                                forms={forms}
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
                                forms={forms}
                              />
                            )}
                          />

                          <Route
                            path={`${match.url}/form/:formId`}
                            render={props => {
                              const formId = props.match.params.formId;
                              const formIndex = forms.findIndex(
                                form => form.id === formId
                              );
                              return (
                                <DataLabForm
                                  {...props}
                                  columns={columns}
                                  selectedId={formId !== "create" && formId}
                                  dataLabId={selectedId}
                                  containerId={container}
                                  formDetails={
                                    formIndex >= 0 && forms[formIndex]
                                  }
                                  updateForms={({ updatedForm, isDelete }) =>
                                    this.updateForms({
                                      formIndex,
                                      updatedForm,
                                      isDelete
                                    })
                                  }
                                  data={data}
                                />
                              );
                            }}
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
