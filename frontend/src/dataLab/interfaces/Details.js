import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Table, Icon, Checkbox, Select } from "antd";

import * as DataLabActionCreators from "../DataLabActions";

import components from "../draggable/Column";

const { Option } = Select;

class Details extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );
  }

  moveRow = (dragIndex, hoverIndex) => {
    const { selectedId } = this.props;

    this.boundActionCreators.changeColumnOrder(selectedId, {
      dragIndex,
      hoverIndex
    });
  };

  render() {
    const { build, datasources, selectedId } = this.props;

    let columns = [];
    let tableData = [];
    let orderedTableData = [];

    if (build) {
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
                    this.boundActionCreators.updateFieldType(selectedId, {
                      stepIndex: record.stepIndex,
                      field: record.field,
                      type: e
                    })
                  }
                >
                  <Option value="text">text</Option>
                  <Option value="number">number</Option>
                  {record.module === "datasource" && (
                    <Option value="date">date</Option>
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
                this.boundActionCreators.changeColumnVisibility(selectedId, {
                  columnIndex: row,
                  visible: e.target.checked
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
                this.boundActionCreators.changePinState(selectedId, {
                  columnIndex: row,
                  pinned: e.target.checked
                })
              }
            />
          )
        }
      ];

      const getOrder = (stepIndex, field) =>
        build.order.find(
          column => column.stepIndex === stepIndex && column.field === field
        );

      build.steps.forEach((step, stepIndex) => {
        if (step.type === "datasource") {
          const module = step.type;
          step = step.datasource;

          const datasource = datasources.find(
            datasource => datasource.id === step.id
          );

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
        } else if (["form", "computed"].includes(step.type)) {
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
      build.order.forEach(field => {
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

const mapStateToProps = state => {
  const { loading, error, build, datasources, selectedId } = state.dataLab;

  return {
    loading,
    error,
    build,
    datasources,
    selectedId
  };
};

export default connect(mapStateToProps)(Details);
