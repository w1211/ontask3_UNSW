import React from "react";
import {
  Layout,
  Icon,
  Button,
  Spin,
  Modal,
  Select,
  Tooltip,
  List,
  Collapse,
  notification,
  Menu,
  Card
} from "antd";

import ContainerModal from "./ContainerModal";
import ContainerShare from "./ContainerShare";
import ActionModal from "../action/ActionModal";

import DatasourceTab from "./tabs/DatasourceTab";
import DataLabTab from "./tabs/DataLabTab";
import ActionTab from "./tabs/ActionTab";

import ContainerContext from "./ContainerContext";

import apiRequest from "../shared/apiRequest";

import "./Container.css";

const { Content } = Layout;
const Panel = Collapse.Panel;

class Dashboard extends React.Component {
  state = {
    dashboard: [],
    container: { visible: false, selected: null },
    action: { visible: false, selected: null, data: {} },
    sharing: { visible: false, selected: null },
    lti: { visible: false },
    deleting: {}
  };

  fetchDashboard = () => {
    this.setState({ fetching: true });

    apiRequest(`/container/`, {
      method: "GET",
      onSuccess: dashboard => {
        let accordionKey = localStorage.getItem("accordionKey");
        let tabKey = localStorage.getItem("tabKey");

        if (!accordionKey || !tabKey) {
          accordionKey = dashboard[0].id;
          tabKey = dashboard[0].has_full_permission
            ? "datasources"
            : ["information_submission"].find(
                type => dashboard[0][type].length > 0
              );
        }

        this.setState({
          dashboard,
          fetching: false,
          accordionKey,
          tabKey
        });
      },
      onError: error => {
        notification["error"]({
          message: "Failed to fetch dashboard"
        });
        this.setState({ fetching: false });
      }
    });
  };

  componentDidMount() {
    this.fetchDashboard();

    console.log(this.props);
    if (this.props.ltiResourceId) {
      this.setState({ lti: { visible: true } });
      console.log(this.props.ltiResourceId);
    }
  }

  openModal = ({ type, selected, data }) => {
    // Opens a model of the specified type
    // E.g. create/edit container, modify sharing permissions of a container
    this.setState({
      [type]: {
        visible: true,
        selected,
        data
      }
    });
  };

  closeModal = type => {
    // Close the model of the specified type, and clear the parameters
    this.setState({
      [type]: {
        visible: false,
        selected: null,
        data: {}
      }
    });
  };

  removeBinding = containerId => {
    Modal.confirm({
      title: "Confirm binding removal",
      content:
        "Are you sure you want to remove the resource binding for this container?",
      okText: "Continue with removal",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({
          unbinding: true
        });

        apiRequest(`/container/${containerId}/`, {
          method: "PATCH",
          payload: { lti_resource: null },
          onSuccess: () => {
            notification["success"]({
              message: "Container binding successfully removed"
            });
            this.fetchDashboard();
          },
          onError: () =>
            notification["error"]({
              message: "Failed to remove binding from container"
            })
        });
      }
    });
  };

  deleteContainer = containerId => {
    const { deleting } = this.state;

    Modal.confirm({
      title: "Confirm container deletion",
      content:
        "All associated datasources, views and actions will be irrevocably deleted with the container.",
      okText: "Continue with deletion",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({
          deleting: { ...deleting, [containerId]: true }
        });

        apiRequest(`/container/${containerId}/`, {
          method: "DELETE",
          onSuccess: () => {
            notification["success"]({
              message: "Container deleted",
              description:
                "The container and its associated datasources, DataLabs and actions have been successfully deleted."
            });
            this.fetchDashboard();
            this.setState({
              deleting: { ...deleting, [containerId]: false }
            });
          },
          onError: () => {
            notification["error"]({
              message: "Failed deletion",
              description: "The container was not deleted."
            });
            this.setState({
              deleting: { ...deleting, [containerId]: false }
            });
          }
        });
      }
    });
  };

  surrenderAccess = containerId => {
    const { deleting } = this.state;

    Modal.confirm({
      title: "Confirm sharing removal",
      content:
        "You will no longer be able to see or interact with this container.",
      okText: "Continue",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({
          deleting: { ...deleting, [containerId]: true }
        });

        apiRequest(`/container/${containerId}/surrender_access/`, {
          method: "POST",
          onSuccess: () => {
            notification["success"]({
              message: "Sharing removed",
              description: "You no longer have access to the container"
            });
            this.setState({
              deleting: { ...deleting, [containerId]: false }
            });
            this.fetchDashboard();
          },
          onError: () => {
            notification["error"]({
              message: "Failed to remove sharing"
            });
            this.setState({
              deleting: { ...deleting, [containerId]: false }
            });
          }
        });
      }
    });
  };

  bindResource = () => {
    const { ltiResourceId, history } = this.props;
    const { lti } = this.state;

    if (!lti.container) {
      notification["error"]({
        message: "Container required",
        description: "You must choose a container to bind to this resource"
      });
      return;
    }

    this.setState({ lti: { ...lti, binding: true } });

    apiRequest(`/container/${lti.container}/`, {
      method: "PATCH",
      payload: { lti_resource: ltiResourceId },
      onSuccess: container => {
        notification["success"]({
          message: "Container successfully bound to resource"
        });
        history.push(`/container/${container.id}`);
      },
      onError: error =>
        notification["error"]({
          message: "Failed to bind container to resource"
        })
    });
  };

  Header = container => {
    const { deleting } = this.state;

    const currentUser = localStorage.getItem("email");
    const isOwner = currentUser === container.owner;

    return (
      <div>
        {container.code}

        {container.has_full_permission && (
          <div className="header_buttons">
            {!isOwner ? (
              <Tooltip title={`This container is owned by ${container.owner}`}>
                <span className="shared">SHARED</span>
              </Tooltip>
            ) : (
              <Tooltip title="Share container">
                <Button
                  icon="share-alt"
                  onClick={e => {
                    e.stopPropagation();
                    this.openModal({ type: "sharing", selected: container });
                  }}
                />
              </Tooltip>
            )}

            <Tooltip title="Edit container">
              <Button
                icon="edit"
                onClick={e => {
                  e.stopPropagation();
                  this.openModal({ type: "container", selected: container });
                }}
              />
            </Tooltip>

            {container.lti_resource && (
              <Tooltip title="Remove resource binding">
                <Button
                  type="danger"
                  icon="disconnect"
                  onClick={e => {
                    e.stopPropagation();
                    this.removeBinding(container.id);
                  }}
                >
                  Remove binding
                </Button>
              </Tooltip>
            )}

            <Tooltip title={isOwner ? "Delete container" : "Remove sharing"}>
              <Button
                type="danger"
                icon={isOwner ? "delete" : "close"}
                loading={container.id in deleting && deleting[container.id]}
                onClick={e => {
                  e.stopPropagation();
                  if (isOwner) {
                    this.deleteContainer(container.id);
                  } else {
                    this.surrenderAccess(container.id);
                  }
                }}
              />
            </Tooltip>
          </div>
        )}
      </div>
    );
  };

  ContainerList = () => {
    const { history } = this.props;
    const { accordionKey, tabKey, dashboard } = this.state;

    return (
      <div className="container_list">
        <Collapse
          accordion
          onChange={accordionKey => {
            if (accordionKey) {
              const container = dashboard.find(
                container => container.id === accordionKey
              );

              const tabKey = container.has_full_permission
                ? "datasources"
                : ["information_submission"].find(
                    type => container[type].length > 0
                  );

              this.setState({ accordionKey, tabKey });
              localStorage.setItem("accordionKey", accordionKey);
              localStorage.setItem("tabKey", tabKey);
            } else {
              this.setState({ accordionKey: null, tabKey: null });
              localStorage.removeItem("accordionKey");
              localStorage.removeItem("tabKey");
            }
          }}
          activeKey={accordionKey}
        >
          {dashboard.map((container, i) => (
            <Panel
              header={this.Header(container)}
              key={container.id}
              style={{ background: i.toString() === accordionKey && "#eee" }}
            >
              <div style={{ display: "flex" }}>
                <Menu
                  mode="inline"
                  selectedKeys={[tabKey]}
                  onSelect={e => {
                    const tabKey = e.key;
                    this.setState({ tabKey });
                    localStorage.setItem("tabKey", tabKey);
                  }}
                  style={{ maxWidth: 250 }}
                >
                  {container.has_full_permission && [
                    <Menu.Item key="datasources">
                      Datasources ({container.datasources.length})
                    </Menu.Item>,
                    <Menu.Item key="datalabs">
                      DataLabs ({container.datalabs.length})
                    </Menu.Item>,
                    <Menu.Item key="actions">
                      Actions ({container.actions.length})
                    </Menu.Item>
                  ]}

                  {container.has_full_permission &&
                    ["information_submission"].some(
                      type => container[type].length > 0
                    ) && <Menu.Divider />}

                  {container.information_submission.length > 0 && (
                    <Menu.Item key="information_submission">
                      Information Submission (
                      {container.information_submission.length})
                    </Menu.Item>
                  )}
                </Menu>

                <div style={{ flex: 1, margin: "4px 0 0 20px" }}>
                  {container.has_full_permission &&
                    tabKey === "datasources" && (
                      <DatasourceTab
                        containerId={container.id}
                        datasources={container.datasources}
                      />
                    )}

                  {container.has_full_permission && tabKey === "datalabs" && (
                    <DataLabTab
                      containerId={container.id}
                      datasources={container.datasources}
                      dataLabs={container.datalabs}
                    />
                  )}

                  {container.has_full_permission && tabKey === "actions" && (
                    <ActionTab
                      containerId={container.id}
                      dataLabs={container.datalabs}
                      actions={container.actions}
                    />
                  )}

                  {tabKey === "information_submission" && (
                    <List
                      grid={{
                        gutter: 16
                      }}
                      dataSource={container.information_submission}
                      renderItem={form => (
                        <List.Item>
                          <Card title={form.name} style={{ maxWidth: 300 }}>
                            <div style={{ marginBottom: 10 }}>
                              {form.description}
                            </div>

                            <Button
                              icon="arrow-right"
                              type="primary"
                              onClick={() => history.push(`/form/${form.id}`)}
                            >
                              Open
                            </Button>
                          </Card>
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    );
  };

  render() {
    const { history } = this.props;
    const { fetching, dashboard, container, action, sharing, lti } = this.state;

    return (
      <ContainerContext.Provider
        value={{
          fetchDashboard: this.fetchDashboard,
          history
        }}
      >
        <div className="container">
          <Content className="wrapper">
            <Layout className="layout">
              <Content className="content">
                <h1>Dashboard</h1>

                {fetching ? (
                  <Spin size="large" />
                ) : (
                  <div>
                    <Button
                      onClick={() => this.openModal({ type: "container" })}
                      type="primary"
                      icon="plus"
                      size="large"
                      className="create_container"
                    >
                      New Container
                    </Button>

                    <ContainerModal
                      {...container}
                      fetchDashboard={this.fetchDashboard}
                      updateAccordionKey={accordionKey => {
                        this.setState({ accordionKey, tabKey: "datasources" });
                        localStorage.setItem("accordionKey", accordionKey);
                        localStorage.setItem("tabKey", "datasources");
                      }}
                      closeModal={() => this.closeModal("container")}
                    />

                    <ActionModal
                      {...action}
                      closeModal={() => this.closeModal("action")}
                    />

                    <ContainerShare
                      {...sharing}
                      fetchDashboard={this.fetchDashboard}
                      closeModal={() => this.closeModal("sharing")}
                    />

                    <Modal
                      visible={lti.visible}
                      title="Bind LTI resource"
                      onCancel={() =>
                        Modal.confirm({
                          title: "Cancel resource binding",
                          content:
                            "Are you sure you do not want to bind this resource to a container?",
                          onOk: () => this.setState({ lti: { visible: false } })
                        })
                      }
                      onOk={this.bindResource}
                      confirmLoading={lti.binding}
                    >
                      <p>
                        The LTI resource you have come from has not yet been
                        bound to a container. Choose a container from the list
                        below:
                      </p>
                      <Select
                        style={{ width: "100%" }}
                        placeholder="Choose a container"
                        value={lti.container}
                        onChange={container =>
                          this.setState({ lti: { ...lti, container } })
                        }
                      >
                        {dashboard
                          .filter(container => !container.lti_resource)
                          .map(container => (
                            <Select.Option key={container.id}>
                              {container.code}
                            </Select.Option>
                          ))}
                      </Select>
                    </Modal>

                    {dashboard.length > 0 ? (
                      this.ContainerList()
                    ) : (
                      <h2>
                        <Icon type="info-circle-o" className="info_icon" />
                        Get started by creating your first container.
                      </h2>
                    )}
                  </div>
                )}
              </Content>
            </Layout>
          </Content>
        </div>
      </ContainerContext.Provider>
    );
  }
}

export default Dashboard;
