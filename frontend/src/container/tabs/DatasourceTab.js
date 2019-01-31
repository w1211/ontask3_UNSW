import React from "react";
import { Tooltip, Button, Modal, notification, Table } from "antd";

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

  state = { deleting: {} };

  deleteDatasource = datasourceId => {
    const { updateContainers } = this.context;

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
            updateContainers();
            notification["success"]({
              message: "Datasource deleted",
              description: "The datasource was successfully deleted."
            });
          }
        });
      }
    });
  };

  render() {
    const { containerId, datasources } = this.props;
    const { deleting } = this.state;
    const { history } = this.context;

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
        render: schedule => (schedule ? "Yes" : "No"),
        filters: [
          {
            text: "Yes",
            value: true
          },
          {
            text: "No",
            value: false
          }
        ],
        sorter: (a, b) => !!a.schedule,
        onFilter: (value, record) => !!record.schedule === (value === "true")
      },
      {
        title: "Actions",
        key: "actions",
        render: (text, datasource) => {
          const canScheduleUpdates = [
            "mysql",
            "postgresql",
            "sqlite",
            "mssql",
            "s3BucketFile"
          ].includes(datasource.connection.dbType);

          return (
            <div>
              <Tooltip title="Edit datasource settings">
                <Button
                  style={{ marginRight: 5 }}
                  icon="setting"
                  onClick={() => {
                    history.push(`/datasource/${datasource.id}/settings`);
                  }}
                />
              </Tooltip>

              <Tooltip
                title={
                  canScheduleUpdates
                    ? "Configure scheduled data updates"
                    : "This datasource type does not support scheduled data updates"
                }
              >
                <Button
                  style={{ marginRight: 5 }}
                  disabled={!canScheduleUpdates}
                  icon="calendar"
                  onClick={() => {
                    history.push(`/datasource/${datasource.id}/schedule`);
                  }}
                />
              </Tooltip>

              <Tooltip title="Preview datasource data">
                <Button
                  style={{ marginRight: 5 }}
                  icon="database"
                  onClick={() => {
                    history.push(`/datasource/${datasource.id}/preview`);
                  }}
                />
              </Tooltip>

              <Tooltip title="Delete datasource">
                <Button
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
          Add datasource
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
