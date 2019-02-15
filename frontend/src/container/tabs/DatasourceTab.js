import React from "react";
import { Tooltip, Button, Modal, notification, Table, Tag } from "antd";

import apiRequest from "../../shared/apiRequest";
import ContainerContext from "../ContainerContext";

import moment from "moment";

const confirm = Modal.confirm;

const TYPEMAP = {
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  xlsXlsxFile: "Excel file",
  csvTextFile: "CSV/text file",
  s3BucketFile: "S3 bucket file",
  sqlite: "SQLite",
  mssql: "MSSQL"
};

class DatasourceTab extends React.Component {
  static contextType = ContainerContext;

  state = { deleting: {}, refreshing: {} };

  deleteDatasource = datasourceId => {
    const { fetchDashboard } = this.context;

    confirm({
      title: "Confirm datasource deletion",
      content: "Are you sure you want to delete this datasource?",
      okText: "Continue with deletion",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({
          deleting: { [datasourceId]: true }
        });

        apiRequest(`/datasource/${datasourceId}/`, {
          method: "DELETE",
          onError: error => {
            this.setState({ deleting: { [datasourceId]: false } });
            notification["error"]({
              message: "Datasource deletion failed",
              description: error
            });
          },
          onSuccess: () => {
            this.setState({ deleting: { [datasourceId]: false } });
            fetchDashboard();
            notification["success"]({
              message: "Datasource deleted",
              description: "The datasource was successfully deleted."
            });
          }
        });
      }
    });
  };

  forceRefresh = datasourceId => {
    const { fetchDashboard } = this.context;

    this.setState({
      refreshing: { [datasourceId]: true }
    });

    apiRequest(`/datasource/${datasourceId}/force_refresh/`, {
      method: "POST",
      onError: error => {
        this.setState({ refreshing: { [datasourceId]: false } });
        notification["error"]({
          message: "Data refresh failed",
          description: error
        });
      },
      onSuccess: () => {
        this.setState({ refreshing: { [datasourceId]: false } });
        fetchDashboard();
        notification["success"]({
          message: "Datasource data refreshed",
          description: "The datasource data was successfully refreshed."
        });
      }
    });
  };

  render() {
    const { containerId, datasources } = this.props;
    const { deleting, refreshing } = this.state;
    const { history } = this.context;

    const canScheduleUpdates = dbType =>
      ["mysql", "postgresql", "sqlite", "mssql", "s3BucketFile"].includes(
        dbType
      );

    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name)
      },
      {
        title: "Type",
        dataIndex: "connection.dbType",
        key: "type",
        render: dbType => TYPEMAP[dbType],
        filters: Object.entries(TYPEMAP)
          .map(entry => ({
            text: entry[1],
            value: entry[0]
          }))
          .filter(filter =>
            datasources.some(
              datasource => datasource.connection.dbType === filter.value
            )
          ),
        onFilter: (value, record) => record.connection.dbType === value,
        sorter: (a, b) => a.connection.dbType.localeCompare(b.connection.dbType)
      },
      {
        title: "Data last updated",
        dataIndex: "lastUpdated",
        key: "lastUpdated",
        render: lastUpdated => moment(lastUpdated).format("DD/MM/YYYY, HH:mm"),
        sorter: (a, b) =>
          moment(a.lastUpdated) > moment(b.lastUpdated) ? 1 : -1
      },
      {
        title: "Scheduled data updates",
        dataIndex: "schedule",
        key: "schedule",
        render: (schedule, datasource) => {
          return canScheduleUpdates(datasource.connection.dbType) ? (
            <div>
              {schedule ? (
                <Tag color="green">On</Tag>
              ) : (
                <Tag color="red">Off</Tag>
              )}
              <Button
                size="small"
                icon="thunderbolt"
                loading={refreshing[datasource.id] || false}
                onClick={() => this.forceRefresh(datasource.id)}
              >
                Refresh now
              </Button>
            </div>
          ) : (
            <Tag>Not applicable</Tag>
          );
        },
        filters: [
          {
            text: "On",
            value: true
          },
          {
            text: "Off",
            value: false
          }
        ],
        onFilter: (value, datasource) =>
          canScheduleUpdates(datasource.connection.dbType) &&
          (!!datasource.schedule === (value === "true") ||
            !datasource.schedule === (value === "false"))
      },
      {
        title: "Actions",
        key: "actions",
        render: (text, datasource) => {
          return (
            <div>
              <Tooltip title="Edit datasource settings">
                <Button
                  style={{ margin: 3 }}
                  icon="setting"
                  onClick={() => {
                    history.push(`/datasource/${datasource.id}/settings`);
                  }}
                />
              </Tooltip>

              <Tooltip
                title={
                  canScheduleUpdates(datasource.connection.dbType)
                    ? "Configure scheduled data updates"
                    : "This datasource type does not support scheduled data updates"
                }
              >
                <Button
                  style={{ margin: 3 }}
                  disabled={!canScheduleUpdates(datasource.connection.dbType)}
                  icon="calendar"
                  onClick={() => {
                    history.push(`/datasource/${datasource.id}/schedule`);
                  }}
                />
              </Tooltip>

              <Tooltip title="Preview datasource data">
                <Button
                  style={{ margin: 3 }}
                  icon="database"
                  onClick={() => {
                    history.push(`/datasource/${datasource.id}/preview`);
                  }}
                />
              </Tooltip>

              <Tooltip title="Delete datasource">
                <Button
                  style={{ margin: 3 }}
                  type="danger"
                  icon="delete"
                  loading={deleting[datasource.id] || false}
                  onClick={() => this.deleteDatasource(datasource.id)}
                />
              </Tooltip>
            </div>
          );
        }
      }
    ];

    return (
      <div>
        <Button
          style={{ marginBottom: 15 }}
          type="primary"
          icon="plus"
          onClick={() =>
            history.push({
              pathname: "/datasource",
              state: { containerId }
            })
          }
        >
          Add Datasource
        </Button>

        <Table
          bordered
          dataSource={datasources}
          columns={columns}
          rowKey="id"
          locale={{
            emptyText: "No datasources have been added yet"
          }}
        />
      </div>
    );
  }
}

export default DatasourceTab;
