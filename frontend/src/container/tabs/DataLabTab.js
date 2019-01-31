import React from "react";
import { Icon, Tooltip, Button, Modal, notification, Table, Tag } from "antd";

import apiRequest from "../../shared/apiRequest";
import ContainerContext from "../ContainerContext";

const confirm = Modal.confirm;

class DataLabTab extends React.Component {
  static contextType = ContainerContext;

  state = { filter: null, deleting: {}, cloning: {} };

  deleteDataLab = dataLabId => {
    const { updateContainers } = this.context;

    confirm({
      title: "Confirm DataLab deletion",
      content:
        "All associated actions will be irrevocably deleted with the DataLab.",
      okText: "Continue with deletion",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({
          deleting: { [dataLabId]: true }
        });

        apiRequest(`/datalab/${dataLabId}/`, {
          method: "DELETE",
          onSuccess: () => {
            this.setState({ deleting: { [dataLabId]: false } });
            updateContainers();
            notification["success"]({
              message: "DataLab deleted",
              description: "The DataLab was successfully deleted."
            });
          },
          onError: error => {
            this.setState({ deleting: { [dataLabId]: false } });
            notification["error"]({
              message: "DataLab deletion failed",
              description: error
            });
          }
        });
      }
    });
  };

  cloneDataLab = datalabId => {
    const { updateContainers } = this.context;

    confirm({
      title: "Confirm DataLab clone",
      content: "Are you sure you want to clone this DataLab?",
      onOk: () => {
        this.setState({
          cloning: { [datalabId]: true }
        });

        apiRequest(`/datalab/${datalabId}/clone_datalab/`, {
          method: "POST",
          onSuccess: () => {
            this.setState({ cloning: { [datalabId]: false } });
            updateContainers();
            notification["success"]({
              message: "DataLab cloned",
              description: "The DataLab was successfully cloned."
            });
          },
          onError: error => {
            this.setState({ cloning: { [datalabId]: false } });
            notification["error"]({
              message: "DataLab cloning failed",
              description: error
            });
          }
        });
      }
    });
  };

  render() {
    const { containerId, dataLabs, datasources } = this.props;
    const { deleting, cloning } = this.state;
    const { history } = this.context;

    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name)
      },
      {
        title: "Modules",
        dataIndex: "steps",
        key: "modules",
        render: steps => {
          let didIncludeComputed = false;

          return steps.map((step, stepIndex) => {
            if (step.type === "datasource")
              return (
                <Tag color="blue" key={stepIndex}>
                  <Icon type="database" style={{ marginRight: 5 }} />
                  {
                    datasources.find(
                      datasource => datasource.id === step.datasource.id
                    ).name
                  }
                </Tag>
              );
            else if (step.type === "form")
              return (
                <Tag color="purple" key={stepIndex}>
                  <Icon type="edit" style={{ marginRight: 5 }} />
                  {step.form.name}
                </Tag>
              );
            else if (step.type === "computed" && !didIncludeComputed) {
              didIncludeComputed = true;
              return (
                <Tag color="green" key={stepIndex}>
                  <Icon type="calculator" style={{ marginRight: 5 }} />
                  Computed
                </Tag>
              );
            }
            return null;
          });
        }
      },
      {
        title: "Actions",
        key: "actions",
        render: (text, dataLab) => (
          <div>
            <Tooltip title="Edit DataLab settings">
              <Button
                style={{ marginRight: 5 }}
                icon="setting"
                onClick={() => {
                  history.push(`/datalab/${dataLab.id}/settings`);
                }}
              />
            </Tooltip>

            <Tooltip title="View DataLab data">
              <Button
                style={{ marginRight: 5 }}
                icon="table"
                onClick={() => {
                  history.push(`/datalab/${dataLab.id}/data`);
                }}
              />
            </Tooltip>

            <Tooltip title="Clone DataLab">
              <Button
                style={{ marginRight: 5 }}
                icon="copy"
                loading={dataLab.id in cloning && cloning[dataLab.id]}
                onClick={() => this.cloneDataLab(dataLab.id)}
              />
            </Tooltip>

            <Tooltip title="Delete DataLab">
              <Button
                type="danger"
                icon="delete"
                loading={dataLab.id in deleting && deleting[dataLab.id]}
                onClick={() => this.deleteDataLab(dataLab.id)}
              />
            </Tooltip>
          </div>
        )
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
              pathname: "/datalab",
              state: { containerId }
            })
          }
        >
          Create DataLab
        </Button>

        <Table
          bordered
          dataSource={dataLabs}
          columns={columns}
          rowKey="id"
          locale={{
            emptyText: "No DataLabs have been created yet"
          }}
        />
      </div>
    );
  }
}

export default DataLabTab;
