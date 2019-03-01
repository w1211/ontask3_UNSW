import React from "react";
import { Table, Icon, Checkbox, Select, message, notification } from "antd";

import apiRequest from "../../shared/apiRequest";

import components from "./Column";

const fromMap = {
  form: { icon: "form", className: "formIcon" },
  datasource: { icon: "database", className: "datasourceIcon" },
  computed: { icon: "calculator", className: "computedIcon" }
};

class Details extends React.Component {
  dragProps = {
    components,
    onRow: (record, index) => ({
      index,
      moveRow: this.moveRow
    })
  };

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

  updateFieldtype = (stepIndex, field, newType, oldType) => {
    const { selectedId, updateDatalab } = this.props;

    const columns = [...this.props.columns];
    columns.find(
      column => column.stepIndex === stepIndex && column.field === field
    ).details.field_type = newType;
    updateDatalab({ columns });

    apiRequest(`/datalab/${selectedId}/update_field_type/`, {
      method: "PATCH",
      payload: { stepIndex, field, type: newType },
      onSuccess: () => {
        message.success("Field type successfully updated.");
      },
      onError: () => {
        notification["error"]({
          message: "Failed to update field type"
        });
        columns.find(
          column => column.stepIndex === stepIndex && column.field === field
        ).details.field_type = oldType;
        updateDatalab({ columns });
      }
    });
  };

  updateFieldVisibility = (columnIndex, visible) => {
    const { selectedId, updateDatalab, restrictedView } = this.props;

    const columns = [...this.props.columns];
    columns[columnIndex].visible = visible;
    updateDatalab({ columns });

    if (restrictedView) return;

    apiRequest(`/datalab/${selectedId}/change_column_visibility/`, {
      method: "PATCH",
      payload: { columnIndex, visible },
      onSuccess: () => {
        message.success("Column visibility successfully updated.");
      },
      onError: () => {
        notification["error"]({
          message: "Failed to update column visibility"
        });
        columns[columnIndex].visible = !visible;
        updateDatalab({ columns });
      }
    });
  };

  updatePinnedStatus = (columnIndex, pinned) => {
    const { selectedId, updateDatalab, restrictedView } = this.props;

    const columns = [...this.props.columns];
    columns[columnIndex].pin = pinned;
    updateDatalab({ columns });

    if (restrictedView) return;

    apiRequest(`/datalab/${selectedId}/change_pinned_status/`, {
      method: "PATCH",
      payload: { columnIndex, pinned },
      onSuccess: () => {
        message.success("Pinned status successfully updated.");
      },
      onError: () => {
        notification["error"]({
          message: "Failed to update pinned status"
        });
        columns[columnIndex].pinned = !pinned;
        updateDatalab({ columns });
      }
    });
  };

  render() {
    const { columns, restrictedView } = this.props;

    let tableColumns = [
      { title: "Field", dataIndex: "details.label", key: "label" }
    ];

    if (!restrictedView)
      tableColumns.push(
        ...[
          {
            title: "From",
            dataIndex: "details.from",
            key: "from",
            render: (text, record) => (
              <div className="from">
                <Icon
                  type={fromMap[record.details.module_type].icon}
                  className={fromMap[record.details.module_type].className}
                />
                {record.details.module_type !== "computed" ? (
                  record.details.from
                ) : (
                  <span style={{ fontStyle: "italic" }}>Computed</span>
                )}
              </div>
            )
          },
          {
            title: "Type",
            dataIndex: "details.field_type",
            key: "type",
            render: (type, record) => {
              if (
                ["datasource", "computed"].includes(record.details.module_type)
              )
                return (
                  <Select
                    size="small"
                    defaultValue={type}
                    onChange={newType =>
                      this.updateFieldtype(
                        record.stepIndex,
                        record.field,
                        newType,
                        type
                      )
                    }
                  >
                    <Select.Option value="text">text</Select.Option>
                    <Select.Option value="number">number</Select.Option>
                    {record.details.module_type === "datasource" && (
                      <Select.Option value="date">date</Select.Option>
                    )}
                    {record.details.module_type === "computed" && (
                      <Select.Option value="list">list</Select.Option>
                    )}
                  </Select>
                );
              if (record.details.module_type === "form") return type;
            }
          }
        ]
      );

    tableColumns.push(
      ...[
        {
          title: "Visible",
          dataIndex: "visible",
          key: "visible",
          render: (text, record, index) => (
            <Checkbox
              defaultChecked={text}
              onChange={e =>
                this.updateFieldVisibility(index, e.target.checked)
              }
            />
          )
        },
        {
          title: "Pinned",
          dataIndex: "pin",
          key: "pin",
          render: (text, record, index) => (
            <Checkbox
              defaultChecked={text}
              onChange={e => this.updatePinnedStatus(index, e.target.checked)}
            />
          )
        }
      ]
    );

    const dragProps = !restrictedView ? this.dragProps : {};

    return (
      <div className="details">
        <Table
          {...dragProps}
          columns={tableColumns}
          dataSource={columns}
          pagination={false}
          rowKey={(record, i) => i}
        />
      </div>
    );
  }
}

export default Details;
