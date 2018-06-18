import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Button, Collapse, Card, Icon, Tooltip, Tabs, Input } from "antd";

import * as ContainerActionCreators from "./ContainerActions";
import { deleteView } from "../view/ViewActions";
import {
  openDatasourceModal,
  deleteDatasource
} from "../datasource/DatasourceActions";
import { openWorkflowModal, deleteWorkflow } from "../workflow/WorkflowActions";
import { openSchedulerModal } from "../scheduler/SchedulerActions";

const TabPane = Tabs.TabPane;
const Panel = Collapse.Panel;
const { Meta } = Card;
const ButtonGroup = Button.Group;

class ContainerList extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      {
        ...ContainerActionCreators,
        deleteView,
        openDatasourceModal,
        deleteDatasource,
        openWorkflowModal,
        deleteWorkflow,
        openSchedulerModal
      },
      dispatch
    );

    this.state = {
      datasourceFilter: null,
      dataLabFilter: null,
      actionFilter: null
    };
  }

  containerHeader = container => (
    <div>
      {container.code}

      <div className="container_header_buttons_wrapper">
        <ButtonGroup className="container_header_button">
          <Button disabled icon="user" />
          <Button disabled icon="share-alt" />
        </ButtonGroup>

        <Tooltip title="Edit container">
          <Button
            icon="edit"
            className="container_header_button"
            onClick={e => {
              e.stopPropagation();
              this.boundActionCreators.openContainerModal(container);
            }}
          />
        </Tooltip>

        <Tooltip title="Delete container">
          <Button
            type="danger"
            icon="delete"
            className="container_header_button"
            onClick={e => {
              e.stopPropagation();
              this.boundActionCreators.deleteContainer(container.id);
            }}
          />
        </Tooltip>
      </div>
    </div>
  );

  datasourceTab = (containerId, datasources) => {
    const { datasourceFilter } = this.state;

    const typeMap = {
      mysql: "MySQL",
      postgresql: "PostgreSQL",
      xlsXlsxFile: "Excel file",
      csvTextFile: "CSV/text file",
      s3BucketFile: "S3 bucket file",
      sqlite: "SQLite",
      mssql: "MSSQL"
    };

    return (
      <div className="tab">
        {datasources.length > 0 && (
          <div className="filter_wrapper">
            <div className="filter">
              <Input
                placeholder="Filter datasources by name"
                value={datasourceFilter}
                addonAfter={
                  <Tooltip title="Clear filter">
                    <Icon
                      type="close"
                      onClick={() => this.setState({ datasourceFilter: null })}
                    />
                  </Tooltip>
                }
                onChange={e =>
                  this.setState({ datasourceFilter: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {datasources.map((datasource, i) => {
          if (datasourceFilter && !datasource.name.includes(datasourceFilter))
            return null;

          let actions = [];
          actions.push(
            <Tooltip title="Edit datasource">
              <Button
                icon="edit"
                onClick={() => {
                  this.boundActionCreators.openDatasourceModal(
                    containerId,
                    datasource
                  );
                }}
              />
            </Tooltip>
          );

          if (
            ["mysql", "postgresql", "sqlite", "mssql", "s3BucketFile"].includes(
              datasource.connection.dbType
            )
          )
            actions.push(
              <Tooltip
                title={
                  "schedule" in datasource
                    ? "Update schedule"
                    : "Create schedule"
                }
              >
                <Button
                  icon="calendar"
                  onClick={() => {
                    this.boundActionCreators.openSchedulerModal(
                      datasource.id,
                      datasource.schedule
                    );
                  }}
                />
              </Tooltip>
            );

          actions.push(
            <Tooltip title="Delete datasource">
              <Button
                type="danger"
                icon="delete"
                onClick={() => {
                  this.boundActionCreators.deleteDatasource(datasource.id);
                }}
              />
            </Tooltip>
          );

          return (
            <Card
              className="item"
              bodyStyle={{ flex: 1 }}
              title={datasource.name}
              actions={actions}
              key={i}
            >
              <Meta
                description={
                  <span>{typeMap[datasource.connection.dbType]}</span>
                }
              />
            </Card>
          );
        })}

        <div
          className="add item"
          onClick={() => {
            this.boundActionCreators.openDatasourceModal(containerId);
          }}
        >
          <Icon type="plus" />
          <span>Add datasource</span>
        </div>
      </div>
    );
  };

  dataLabTab = (containerId, dataLabs) => {
    const { dataLabFilter } = this.state;

    return (
      <div className="tab">
        {dataLabs.length > 0 && (
          <div className="filter_wrapper">
            <div className="filter">
              <Input
                placeholder="Filter DataLabs by name"
                value={dataLabFilter}
                addonAfter={
                  <Tooltip title="Clear filter">
                    <Icon
                      type="close"
                      onClick={() => this.setState({ dataLabFilter: null })}
                    />
                  </Tooltip>
                }
                onChange={e => this.setState({ dataLabFilter: e.target.value })}
              />
            </div>
          </div>
        )}

        {dataLabs.map((dataLab, i) => {
          if (dataLabFilter && !dataLab.name.includes(dataLabFilter))
            return null;

          return (
            <Card
              className="item"
              bodyStyle={{ flex: 1 }}
              title={dataLab.name}
              actions={[
                <Link to={{ pathname: `/datalab/${dataLab.id}/data` }}>
                  <Tooltip title="Edit DataLab">
                    <Button icon="arrow-right" />
                  </Tooltip>
                </Link>,
                <Tooltip title="Delete DataLab">
                  <Button
                    type="danger"
                    icon="delete"
                    onClick={() => {
                      this.boundActionCreators.deleteView(dataLab.id);
                    }}
                  />
                </Tooltip>
              ]}
              key={i}
            >
              <Meta
                description={
                  <div>
                    {`${dataLab.steps.length} ${
                      dataLab.steps.length > 1 ? "modules" : "module"
                    }`}
                  </div>
                }
              />
            </Card>
          );
        })}
        <Link
          to={{
            pathname: `/datalab`,
            state: { containerId }
          }}
        >
          <div className="add item">
            <Icon type="plus" />
            <span>Create DataLab</span>
          </div>
        </Link>
      </div>
    );
  };

  actionTab = (containerId, dataLabs, actions) => {
    const { actionFilter } = this.state;

    return (
      <div className="tab">
        {actions.length > 0 && (
          <div className="filter_wrapper">
            <div className="filter">
              <Input
                placeholder="Filter actions by name"
                value={actionFilter}
                addonAfter={
                  <Tooltip title="Clear filter">
                    <Icon
                      type="close"
                      onClick={() => this.setState({ actionFilter: null })}
                    />
                  </Tooltip>
                }
                onChange={e => this.setState({ actionFilter: e.target.value })}
              />
            </div>
          </div>
        )}
        {actions.map((action, i) => {
          if (actionFilter && !action.name.includes(actionFilter)) return null;

          return (
            <Card
              className="item"
              bodyStyle={{ flex: 1 }}
              title={action.name}
              actions={[
                <Tooltip title="Edit action">
                  <Link to={`/workflow/${action.id}`}>
                    <Button icon="arrow-right" />
                  </Link>
                </Tooltip>,
                <Tooltip title="Delete action">
                  <Button
                    type="danger"
                    icon="delete"
                    onClick={() => {
                      this.boundActionCreators.deleteWorkflow(action.id);
                    }}
                  />
                </Tooltip>
              ]}
              key={i}
            >
              <Meta
                description={
                  <div>
                    {action.description
                      ? action.description
                      : "No description provided"}
                  </div>
                }
              />
            </Card>
          );
        })}
        <div
          className="add item"
          onClick={() => {
            this.boundActionCreators.openWorkflowModal(containerId, dataLabs);
          }}
        >
          <Icon type="plus" />
          <span>Create action</span>
        </div>
      </div>
    );
  };

  render() {
    const { containers, accordionKey, tabKey } = this.props;

    return (
      <Collapse
        accordion
        onChange={this.boundActionCreators.changeContainerAccordion}
        activeKey={accordionKey}
        className="container_list"
      >
        {containers.map((container, i) => {
          return (
            <Panel header={this.containerHeader(container)} key={i}>
              <Tabs
                activeKey={tabKey}
                tabPosition="left"
                tabBarStyle={{ minWidth: 160 }}
                onChange={this.boundActionCreators.changeContainerTab}
              >
                <TabPane
                  tab={`Datasources (${container.datasources.length})`}
                  key="1"
                >
                  {this.datasourceTab(container.id, container.datasources)}
                </TabPane>

                <TabPane tab={`DataLabs (${container.views.length})`} key="2">
                  {this.dataLabTab(container.id, container.views)}
                </TabPane>

                <TabPane
                  tab={`Actions (${container.workflows.length})`}
                  key="3"
                >
                  {this.actionTab(
                    container.id,
                    container.views,
                    container.workflows
                  )}
                </TabPane>
              </Tabs>
            </Panel>
          );
        })}
      </Collapse>
    );
  }
}

const mapStateToProps = state => {
  const { containers, accordionKey, tabKey } = state.containers;

  return {
    containers,
    accordionKey,
    tabKey
  };
};

export default connect(mapStateToProps)(ContainerList);
