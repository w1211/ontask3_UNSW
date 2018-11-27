import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import {
  Table,
  Icon,
  Menu,
  Dropdown,
  Popover,
  Tooltip,
  Button,
  Input
} from "antd";
import moment from "moment";

import * as DataLabActionCreators from "../DataLabActions";

import VisualisationModal from "../visualisation/VisualisationModal";

import EditableField from "../data-manipulation/EditableField";

const Search = Input.Search;

class Data extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = {
      sort: {},
      editable: {},
      edit: { field: null, primary: null },
      saved: {},
      searchTerm: ""
    };
  }

  initialiseData = () => {
    const { data, build } = this.props;
    const { searchTerm } = this.state;

    if (!data || !build) return [];

    const term = searchTerm.trim().toLowerCase();

    const tableData =
      term === ""
        ? data
        : data.filter(row =>
            String(Object.values(row))
              .toLowerCase()
              .includes(term)
          );

    return tableData;
  };

  initialiseColumns = () => {
    const { build } = this.props;

    if (!build) return [];

    // Initialise the columns of the data table
    const columns = [];
    build.steps.forEach((step, stepIndex) => {
      if (step.type === "datasource")
        columns.push(...this.DatasourceColumns(stepIndex));

      if (step.type === "form") columns.push(...this.FormColumns(stepIndex));

      if (step.type === "computed")
        columns.push(...this.ComputedColumns(stepIndex));
    });

    // Order the columns
    const unPinnedColumns = [];
    const pinnedColumns = [];
    build.order.forEach(orderItem => {
      const column = columns.find(
        column =>
          column.stepIndex === orderItem.stepIndex &&
          column.field === orderItem.field
      );
      if (column && orderItem.visible) {
        if (!orderItem.pinned) unPinnedColumns.push(column);
        if (orderItem.pinned) pinnedColumns.push({ ...column, fixed: "left" });
      }
    });

    const orderedColumns = pinnedColumns.concat(unPinnedColumns);

    // Identify the first non-primary field
    const firstNonPrimaryField = orderedColumns.find(column => {
      const step = build.steps[column.stepIndex];
      return column.field !== step[step.type].primary;
    });

    // Only show the row-wise visualisations column if we have at
    // least one non-primary field in the dataset
    if (firstNonPrimaryField) {
      const defaultVisualisation = {
        stepIndex: firstNonPrimaryField.stepIndex,
        field: firstNonPrimaryField.field
      };

      orderedColumns.unshift({
        className: "column",
        title: "Action",
        fixed: "left",
        dataIndex: 0,
        key: 0,
        render: (index, value) => (
          <Button
            style={{ border: 0 }}
            icon="area-chart"
            onClick={() =>
              this.boundActionCreators.openVisualisationModal(
                defaultVisualisation,
                true,
                value
              )
            }
          />
        )
      });
    }

    return orderedColumns;
  };

  handleHeaderClick = (e, stepIndex, field, primary) => {
    switch (e.key) {
      case "visualise":
        this.boundActionCreators.openVisualisationModal({ stepIndex, field });
        break;

      case "edit":
        this.setState({ edit: { field: field.name, primary } });
        break;

      default:
        break;
    }
  };

  TruncatedLabel = label =>
    label.length > 15 ? (
      <Popover content={label}>{`${label.slice(0, 15)}...`}</Popover>
    ) : (
      label
    );

  DatasourceColumns = stepIndex => {
    const { build } = this.props;
    // const { sort } = this.state;

    const step = build.steps[stepIndex]["datasource"];
    const columns = [];

    step.fields.forEach(field => {
      const label = step.labels[field];
      const truncatedLabel = this.TruncatedLabel(label);

      const isPrimaryOrMatching = [step.matching, step.primary].includes(field);

      const title = isPrimaryOrMatching ? (
        truncatedLabel
      ) : (
        <div className="column_header">
          <Dropdown
            trigger={["click"]}
            overlay={
              <Menu onClick={e => this.handleHeaderClick(e, stepIndex, field)}>
                <Menu.Item key="visualise">
                  <Icon type="area-chart" style={{ marginRight: 5 }} />
                  Visualise
                </Menu.Item>
              </Menu>
            }
          >
            <span style={{ cursor: "pointer" }} className="datasource">
              {label}
            </span>
          </Dropdown>
        </div>
      );

      columns.push({
        className: "column",
        stepIndex,
        field,
        dataIndex: label,
        key: label,
        // sorter: (a, b) => {
        //   a = label in a && a[label];
        //   b = label in b && b[label];
        //   return a.localeCompare(b);
        // },
        // sortOrder: sort && sort.field === label && sort.order,
        title,
        render: text => text
      });
    });

    return columns;
  };

  FormColumns = stepIndex => {
    const { build } = this.props;
    // const { sort, edit } = this.state;
    const { edit } = this.state;

    const step = build.steps[stepIndex]["form"];
    const columns = [];

    let isActive = true;
    if (step.activeFrom && !moment().isAfter(step.activeFrom)) isActive = false;
    if (step.activeTo && !moment().isBefore(step.activeTo)) isActive = false;

    step.fields.forEach(field => {
      const label = field.name;
      const truncatedLabel = this.TruncatedLabel(label);

      const title = (
        <div className="column_header">
          <Dropdown
            trigger={["click"]}
            overlay={
              <Menu
                onClick={e =>
                  this.handleHeaderClick(e, stepIndex, field, step.primary)
                }
              >
                <Menu.Item key="edit" disabled={!isActive}>
                  <Tooltip
                    title={
                      !isActive &&
                      "This column cannot be edited as it belongs to a form that is no longer active"
                    }
                  >
                    <Icon type="edit" style={{ marginRight: 5 }} />
                    Enter data
                  </Tooltip>
                </Menu.Item>

                {/* <Menu.Item key="visualise">
                  <Icon type="area-chart" style={{ marginRight: 5 }} />
                  Visualise
                </Menu.Item> */}
              </Menu>
            }
          >
            <span style={{ cursor: "pointer" }} className="form">
              {truncatedLabel}
            </span>
          </Dropdown>

          {edit.field === field.name && (
            <Tooltip title="Finish editing">
              <Button
                shape="circle"
                className="button"
                size="small"
                icon="check"
                style={{ marginLeft: 5 }}
                onClick={() =>
                  this.setState({ edit: { field: null, primary: null } })
                }
              />
            </Tooltip>
          )}
        </div>
      );

      columns.push({
        className: "column",
        stepIndex,
        field: label,
        title,
        dataIndex: label,
        key: label,
        // sorter: (a, b) => {
        //   a = label in a ? a[label] : "";
        //   b = label in b ? b[label] : "";
        //   if (typeof a === "number" && typeof b === "number")
        //     return a < b
        //   return a.toString().localeCompare(b.toString());
        // },
        // sortOrder: sort && sort.field === label && sort.order,
        render: (text, record) =>
          this.renderFormField(stepIndex, field, text, record[step.primary])
      });
    });

    return columns;
  };

  ComputedColumns = stepIndex => {
    const { build } = this.props;
    // const { sort } = this.state;

    const step = build.steps[stepIndex]["computed"];
    const columns = [];

    step.fields.forEach(field => {
      const label = field.name;
      const truncatedLabel = this.TruncatedLabel(label);

      const title = (
        <div className="column_header">
          {/* <Dropdown
            trigger={["click"]}
            overlay={
              <Menu onClick={e => this.handleHeaderClick(e, stepIndex, field)}>
                <Menu.Item key="visualise">
                  <Icon type="area-chart" style={{ marginRight: 5 }} />
                  Visualise
                </Menu.Item>
              </Menu>
            }
          > */}
          <span className="computed">{truncatedLabel}</span>
          {/* </Dropdown> */}
        </div>
      );

      columns.push({
        className: "column",
        stepIndex,
        field: label,
        title,
        dataIndex: label,
        key: label,
        // sorter: (a, b) => {
        //   a = label in a ? a[label] : "";
        //   b = label in b ? b[label] : "";
        //   if (typeof a === "number" && typeof b === "number")
        //     return a < b
        //   return a.toString().localeCompare(b.toString());
        // },
        // sortOrder: sort && sort.field === label && sort.order,
        render: text => {
          if (Array.isArray(text)) return text.join(", ");
          return text;
        }
      });
    });

    return columns;
  };

  renderFormField = (stepIndex, field, text, primary) => {
    const { edit } = this.state;

    return (
      <div className="editable-field">
        <EditableField
          field={field}
          originalValue={text ? text : null}
          editMode={edit.field === field.name}
          onSave={value => {
            const payload = { stepIndex, field: field.name, primary, value };
            this.handleFormUpdate(payload);
          }}
        />
      </div>
    );
  };

  handleFormUpdate = payload => {
    const { selectedId } = this.props;
    const { saved } = this.state;

    this.boundActionCreators.updateDataLabForm({
      dataLabId: selectedId,
      payload,
      onFinish: () => {
        this.setState({ saved: { ...saved, [payload.primary]: true } }, () => {
          setTimeout(
            () =>
              this.setState({ saved: { ...saved, [payload.primary]: false } }),
            1500
          );
        });
      }
    });
  };

  handleChange = (pagination, filter, sort) => {
    this.setState({ filter, sort });
  };

  render() {
    const { visualisation, edit, saved, searchTerm } = this.state;
    const { data } = this.props;

    const totalDataAmount = data ? data.length : 0;

    // Similarly, the table data is initialised on every render, so that
    // changes to values in form columns can be reflected
    const tableData = this.initialiseData();

    const tableDataAmount = tableData.length;

    // Columns are initialised on every render, so that changes to the sort
    // in local state can be reflected in the table columns. Otherwise the
    // columns would ideally only be initialised when receiving the build
    // for the first time
    const orderedColumns = this.initialiseColumns();

    return (
      <div className="data">
        <div className="filter">
          <div>
            {tableDataAmount} records selected out of {totalDataAmount} (
            {totalDataAmount - tableDataAmount} filtered out)
          </div>
          <Search
            className="searchbar"
            size="large"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => this.setState({ searchTerm: e.target.value })}
          />
        </div>
        <div className="data_manipulation">
          <VisualisationModal
            {...visualisation}
            closeModal={() =>
              this.setState({ visualisation: { visible: false } })
            }
          />

          <Table
            rowKey={(record, index) => index}
            columns={orderedColumns}
            dataSource={orderedColumns.length > 0 ? tableData : []}
            scroll={{ x: (orderedColumns.length - 1) * 175 }}
            onChange={this.handleChange}
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["10", "25", "50", "100"]
            }}
            rowClassName={record =>
              edit.primary in record && saved[record[edit.primary]]
                ? "saved"
                : ""
            }
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { build, data, selectedId } = state.dataLab;

  return {
    build,
    data,
    selectedId
  };
};

export default connect(mapStateToProps)(Data);
