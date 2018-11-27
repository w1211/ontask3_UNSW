import React from "react";
import { Input, Icon, Tooltip, Button, Card, Modal, notification } from "antd";

import SchedulerModal from "../../scheduler/SchedulerModal";
import DataPreview from "../../datasource/DataPreview";

import apiRequest from "../../shared/apiRequest";
import ContainerContext from "../ContainerContext";

const { Meta } = Card;
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

  state = {
    filter: null,
    previewing: {},
    deleting: {},
    scheduler: { visible: false, selected: null, data: {} },
    dataPreview: { visible: false, selected: null, data: {} }
  };

  updateSchedule = ({ payload, onSuccess, onError }) => {
    const { scheduler } = this.state;
    const { updateContainers } = this.context;
    const { selected } = scheduler;

    const isCreate = !(scheduler.data.schedule || false);

    apiRequest(`/datasource/${selected}/update_schedule/`, {
      method: "PATCH",
      payload,
      onSuccess: () => {
        notification["success"]({
          message: `Schedule ${isCreate ? "created" : "updated"}`,
          description: `The schedule was successfully ${
            isCreate ? "created" : "updated"
          }.`
        });
        onSuccess();
        updateContainers();
      },
      onError: error => onError(error)
    });
  };

  deleteSchedule = ({ onError, onSuccess }) => {
    const { scheduler } = this.state;
    const { updateContainers } = this.context;
    const { selected } = scheduler;

    apiRequest(`/datasource/${selected}/delete_schedule/`, {
      method: "PATCH",
      onSuccess: () => {
        notification["success"]({
          message: "Schedule deleted",
          description: "The schedule was successfully deleted."
        });
        onSuccess();
        updateContainers();
      },
      onError: error => onError(error)
    });
  };

  previewDatasource = datasourceId => {
    this.setState({
      previewing: { [datasourceId]: true }
    });

    apiRequest(`/datasource/${datasourceId}/`, {
      method: "GET",
      onSuccess: datasource => {
        const preview = datasource.data;
        let columns = {};
        if (preview.length !== 0) {
          columns = Object.keys(preview[0]).map(k => {
            return { title: k, dataIndex: k };
          });
        }
        this.setState({
          previewing: { [datasourceId]: false },
          dataPreview: { visible: true, data: { columns, preview } }
        });
      },
      onError: error => {
        this.setState({ previewing: { [datasourceId]: false } });
        notification["error"]({
          message: "Datasource preview failed",
          description: error
        });
      }
    });
  };

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
    const { containerId, datasources, openModal } = this.props;
    const { filter, deleting, previewing, scheduler, dataPreview } = this.state;

    return (
      <div className="tab">
        {datasources && datasources.length > 0 && (
          <div className="filter_wrapper">
            <div className="filter">
              <Input
                placeholder="Filter datasources by name"
                value={filter}
                addonAfter={
                  <Tooltip title="Clear filter">
                    <Icon
                      type="close"
                      onClick={() => this.setState({ filter: null })}
                    />
                  </Tooltip>
                }
                onChange={e => this.setState({ filter: e.target.value })}
              />
            </div>
          </div>
        )}

        {datasources &&
          datasources.map((datasource, i) => {
            if (filter && !datasource.name.includes(filter)) return null;

            let actions = [];
            actions.push(
              <Tooltip title="Edit datasource">
                <Button
                  icon="edit"
                  onClick={() => {
                    openModal({ type: "datasource", selected: datasource });
                  }}
                />
              </Tooltip>
            );

            if (
              [
                "mysql",
                "postgresql",
                "sqlite",
                "mssql",
                "s3BucketFile"
              ].includes(datasource.connection.dbType)
            )
              actions.push(
                <Tooltip
                  title={
                    datasource.schedule || false
                      ? "Update schedule"
                      : "Create schedule"
                  }
                >
                  <Button
                    icon="calendar"
                    onClick={() => {
                      this.setState({
                        scheduler: {
                          visible: true,
                          selected: datasource.id,
                          data: {
                            schedule: datasource.schedule
                          }
                        }
                      });
                    }}
                  />
                </Tooltip>
              );

            actions.push(
              <Tooltip title="Preview datasource">
                <Button
                  icon="search"
                  loading={previewing[datasource.id] || false}
                  onClick={() => this.previewDatasource(datasource.id)}
                />
              </Tooltip>
            );

            actions.push(
              <Tooltip title="Delete datasource">
                <Button
                  type="danger"
                  icon="delete"
                  loading={deleting[datasource.id] || false}
                  onClick={() => this.deleteDatasource(datasource.id)}
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
                    <span>{TYPEMAP[datasource.connection.dbType]}</span>
                  }
                />
              </Card>
            );
          })}

        <SchedulerModal
          {...scheduler}
          onUpdate={this.updateSchedule}
          onDelete={this.deleteSchedule}
          closeModal={() =>
            this.setState({ scheduler: { visible: false, data: {} } })
          }
        />

        <DataPreview
          {...dataPreview}
          closeModal={() =>
            this.setState({ dataPreview: { visible: false, data: {} } })
          }
        />

        <div
          className="add item"
          onClick={() => {
            openModal({ type: "datasource", data: { containerId } });
          }}
        >
          <Icon type="plus" />
          <span>Add datasource</span>
        </div>
      </div>
    );
  }
}

export default DatasourceTab;
