import React from "react";
import { Table, Icon, Checkbox, Select, message, notification } from "antd";

import apiRequest from "../../shared/apiRequest";

import components from "./Column";

const { Option } = Select;

class Details extends React.Component {
  moveRow = (dragIndex, hoverIndex) => {
    const { selectedId, updateDatalab } = this.props;

    apiRequest(`/datalab/${selectedId}/change_column_order/`, {
      method: "PATCH",
      onSuccess: dataLab => {
        message.success("Column order successfully updated.");
        updateDatalab(dataLab);
      },
      onError: error =>
        notification["error"]({
          message: "Failed to change column order"
        }),
      payload: {
        dragIndex,
        hoverIndex
      }
    });
  };

  render() {
    const {
      datasources,
      dataLabs,
      selectedId,
      order,
      steps,
      updateDatalab,
      forms
    } = this.props;

    let columns = [];
    let tableData = [];
    let orderedTableData = [];

    if (steps) {
      columns = [
        { title: "Field", dataIndex: "label", key: "label" },
        {
          title: "From",
          dataIndex: "from",
          key: "from",
          render: (text, record) => {
            if (record.module === "datasource")
              return (
                <div className="from">
                  <Icon type="database" className="datasourceIcon" />
                  {record.from}
                </div>
              );
            if (record.module === "form")
              return (
                <div className="from">
                  <Icon type="form" className="formIcon" />
                  {record.from}
                </div>
              );
            if (record.module === "computed")
              return (
                <div className="from computed">
                  <Icon type="calculator" className="computedIcon" />
                  Computed
                </div>
              );
          }
        },
        {
          title: "Type",
          dataIndex: "type",
          key: "type",
          render: (text, record) => {
            if (["datasource", "computed"].includes(record.module))
              return (
                <Select
                  size="small"
                  defaultValue={text}
                  onChange={e =>
                    apiRequest(`/datalab/${selectedId}/update_field_type/`, {
                      method: "PATCH",
                      onSuccess: dataLab => {
                        message.success("Field type successfully updated.");
                        updateDatalab(dataLab);
                      },
                      onError: error =>
                        notification["error"]({
                          message: "Failed to update field type"
                        }),
                      payload: {
                        stepIndex: record.stepIndex,
                        field: record.field,
                        type: e
                      }
                    })
                  }
                >
                  <Option value="text">text</Option>
                  <Option value="number">number</Option>
                  {record.module === "datasource" && (
                    <Option value="date">date</Option>
                  )}
                  {record.module === "computed" && (
                    <Option value="list">list</Option>
                  )}
                </Select>
              );
            if (record.module === "form") return text;
          }
        },
        {
          title: "Visible",
          dataIndex: "visible",
          key: "visible",
          render: (text, record, row) => (
            <Checkbox
              defaultChecked={text}
              onChange={e =>
                apiRequest(`/datalab/${selectedId}/change_column_visibility/`, {
                  method: "PATCH",
                  onSuccess: dataLab => {
                    message.success("Column visibility successfully updated.");
                    updateDatalab(dataLab);
                  },
                  onError: error =>
                    notification["error"]({
                      message: "Failed to update column visibility"
                    }),
                  payload: {
                    columnIndex: row,
                    visible: e.target.checked
                  }
                })
              }
            />
          )
        },
        {
          title: "Pin",
          dataIndex: "pin",
          key: "pin",
          render: (text, record, row) => (
            <Checkbox
              defaultChecked={text}
              onChange={e =>
                apiRequest(`/datalab/${selectedId}/change_pinned_status/`, {
                  method: "PATCH",
                  onSuccess: dataLab => {
                    message.success("Pinned status successfully updated.");
                    updateDatalab(dataLab);
                  },
                  onError: error =>
                    notification["error"]({
                      message: "Failed to update pinned status"
                    }),
                  payload: {
                    columnIndex: row,
                    pinned: e.target.checked
                  }
                })
              }
            />
          )
        }
      ];

      const getOrder = (stepIndex, field) =>
        order.find(
          column => column.stepIndex === stepIndex && column.field === field
        );

      steps.forEach((step, stepIndex) => {
        if (step.type === "datasource") {
          const module = step.type;
          step = step.datasource;

          const datasource =
            datasources.find(datasource => datasource.id === step.id) ||
            dataLabs.find(dataLab => dataLab.id === step.id);

          step.fields.forEach((field, fieldIndex) => {
            const orderItem = getOrder(stepIndex, field);
            const label = step.labels[field];
            const type = step.types[field];
            tableData.push({
              stepIndex,
              field,
              key: label,
              label,
              module,
              from: datasource.name,
              type,
              visible: orderItem.visible,
              pin: orderItem.pinned
            });
          });
        } else if (step.type === "form") {
          step = forms.find(form => form.id === step.form);

          step.fields.forEach((field, fieldIndex) => {
            const orderItem = getOrder(stepIndex, field.name);
            tableData.push({
              stepIndex,
              field: field.name,
              key: field.name,
              label: field.name,
              module: "form",
              from: step.name,
              type: field.type,
              visible: orderItem.visible,
              pin: orderItem.pinned
            });
          });
        } else if (step.type === "computed") {
          const module = step.type;
          step = step[module];

          step.fields.forEach((field, fieldIndex) => {
            const orderItem = getOrder(stepIndex, field.name);
            tableData.push({
              stepIndex,
              field: field.name,
              key: field.name,
              label: field.name,
              module,
              from: step.name,
              type: field.type,
              visible: orderItem.visible,
              pin: orderItem.pinned
            });
          });
        }
      });

      // Order the columns
      order.forEach(field => {
        const column = tableData.find(
          column =>
            column.stepIndex === field.stepIndex && column.field === field.field
        );
        if (column) orderedTableData.push(column);
      });
    }

    return (
      <div className="details">
        <Table
          columns={columns}
          dataSource={orderedTableData}
          pagination={false}
          components={components}
          onRow={(record, index) => ({
            index,
            moveRow: this.moveRow
          })}
        />
      </div>
    );
  }
}

export default Details;
