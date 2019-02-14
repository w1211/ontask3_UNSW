import React from "react";
import { Link } from "react-router-dom";
import { Switch, Route, Redirect } from "react-router-dom";
import { Layout, Icon, Spin, Menu, notification, Tag } from "antd";
import _ from "lodash";

import Settings from "./interfaces/DatasourceSettings";
import Scheduler from "../shared/Scheduler";
import Preview from "./interfaces/DatasourcePreview";

import apiRequest from "../shared/apiRequest";
import moment from "moment";

const { Content, Sider } = Layout;

class Datasource extends React.Component {
  state = { fetching: false };

  componentWillMount() {
    const { match, history, location } = this.props;

    const datasourceId = match.params.id;

    if (datasourceId) {
      this.setState({ fetching: true });

      apiRequest(`/datasource/${datasourceId}/`, {
        method: "GET",
        onSuccess: datasource => this.setState({ fetching: false, datasource }),
        onError: (error, status) => {
          if (status === 403) {
            history.replace("/forbidden");
          } else {
            this.setState({ fetching: false });
          }
        }
      });
    } else if (!_.get(location, "state.containerId")) {
      // The user must have cold-loaded the URL, so we have no container to reference
      // Therefore redirect the user back to the container list
      history.push("/dashboard");
    }
  }

  updateSchedule = ({ payload, onSuccess, onError }) => {
    const { datasource } = this.state;

    const isCreate = !datasource.schedule;

    apiRequest(`/datasource/${datasource.id}/update_schedule/`, {
      method: "PATCH",
      payload,
      onSuccess: updatedDatasource => {
        notification["success"]({
          message: `Schedule ${isCreate ? "created" : "updated"}`,
          description: `The schedule was successfully ${
            isCreate ? "created" : "updated"
          }.`
        });
        onSuccess();
        this.updateDatasource(updatedDatasource);
      },
      onError: error => onError(error)
    });
  };

  deleteSchedule = ({ onError, onSuccess }) => {
    const { datasource } = this.state;

    apiRequest(`/datasource/${datasource.id}/delete_schedule/`, {
      method: "PATCH",
      onSuccess: updatedDatasource => {
        notification["success"]({
          message: "Schedule deleted",
          description: "The schedule was successfully deleted."
        });
        onSuccess();
        this.updateDatasource(updatedDatasource);
      },
      onError: error => onError(error)
    });
  };

  updateDatasource = datasource => {
    this.setState({ datasource });
  };

  render() {
    const { match, location, history } = this.props;
    const { fetching, datasource } = this.state;

    const datasourceId = match.params.id;
    const canScheduleUpdates = [
      "mysql",
      "postgresql",
      "sqlite",
      "mssql",
      "s3BucketFile"
    ].includes(datasource && datasource.connection.dbType);

    const now = moment();
    const scheduleIsActive =
      datasource &&
      datasource.schedule &&
      moment(datasource.schedule.startTime || now).isSameOrBefore(now) &&
      moment(datasource.schedule.endTime || now).isSameOrAfter(now);

    return (
      <div>
        <Content className="wrapper">
          <Layout className="layout">
            <Content className="content">
              <Layout className="content_body">
                {datasourceId && (
                  <Sider width={200}>
                    <Menu
                      mode="inline"
                      selectedKeys={[location.pathname.split("/")[3]]}
                      style={{ height: "100%" }}
                    >
                      <Menu.Item key="back">
                        <Link to="/dashboard">
                          <Icon type="arrow-left" />
                          <span>Back to dashboard</span>
                        </Link>
                      </Menu.Item>

                      <Menu.Divider />

                      <Menu.Item key="settings">
                        <Link to={`${match.url}/settings`}>
                          <Icon type="setting" />
                          <span>Settings</span>
                        </Link>
                      </Menu.Item>

                      <Menu.Item key="schedule" disabled={!canScheduleUpdates}>
                        <Link to={`${match.url}/schedule`}>
                          <Icon type="calendar" />
                          <span>Schedule</span>
                          {canScheduleUpdates &&
                            (scheduleIsActive ? (
                              <Tag style={{ marginLeft: 5 }} color="green">
                                On
                              </Tag>
                            ) : (
                              <Tag style={{ marginLeft: 5 }} color="red">
                                Off
                              </Tag>
                            ))}
                        </Link>
                      </Menu.Item>

                      <Menu.Item key="preview">
                        <Link to={`${match.url}/preview`}>
                          <Icon type="database" />
                          <span>Data preview</span>
                        </Link>
                      </Menu.Item>
                    </Menu>
                  </Sider>
                )}

                <Content className="content">
                  {fetching ? (
                    <Spin size="large" />
                  ) : (
                    <div>
                      {!datasourceId && (
                        <Link
                          to="/dashboard"
                          style={{ display: "inline-block", marginBottom: 20 }}
                        >
                          <Icon type="arrow-left" style={{ marginRight: 5 }}/>
                          <span>Back to dashboard</span>
                        </Link>
                      )}
                      
                      <h1>{datasource ? datasource.name : "Add Datasource"}</h1>

                      {datasourceId ? (
                        <Switch>
                          <Redirect
                            exact
                            from={match.url}
                            to={`${match.url}/settings`}
                          />

                          <Route
                            path={`${match.url}/settings`}
                            render={props => (
                              <Settings
                                {...props}
                                datasource={datasource}
                                updateDatasource={this.updateDatasource}
                              />
                            )}
                          />

                          <Route
                            path={`${match.url}/schedule`}
                            render={props =>
                              canScheduleUpdates ? (
                                <Scheduler
                                  {...props}
                                  schedule={datasource.schedule}
                                  onUpdate={this.updateSchedule}
                                  onDelete={this.deleteSchedule}
                                />
                              ) : (
                                <div>
                                  This datasource type does not support
                                  scheduled data updates.
                                </div>
                              )
                            }
                          />

                          <Route
                            path={`${match.url}/preview`}
                            render={() => <Preview data={datasource.data} />}
                          />
                        </Switch>
                      ) : (
                        <Settings
                          history={history}
                          containerId={_.get(location, "state.containerId")}
                          updateDatasource={this.updateDatasource}
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

export default Datasource;
