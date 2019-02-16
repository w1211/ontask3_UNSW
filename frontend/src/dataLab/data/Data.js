import React from "react";
import {
  Table,
  Icon,
  Menu,
  Dropdown,
  Popover,
  Tooltip,
  Button,
  Input,
  notification,
  Radio
} from "antd";
import memoize from "memoize-one";

import Visualisation from "./Visualisation";
import Details from "../details/Details";

import apiRequest from "../../shared/apiRequest";
import Field from "../../shared/Field";

const Search = Input.Search;

class Data extends React.Component {
  state = {
    sort: {},
    editable: {},
    edit: { field: null, primary: null },
    saved: {},
    searchTerm: "",
    visualisation: false,
    view: "data"
  };

  initialiseData = memoize((data, searchTerm) => {
    if (!data) return [];

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
  });

  initialiseColumns = () => {
    const { steps, order } = this.props;

    if (!steps) return [];

    // Initialise the columns of the data table
    const columns = [];
    steps.forEach((step, stepIndex) => {
      if (step.type === "datasource")
        columns.push(...this.DatasourceColumns(stepIndex));

      if (step.type === "form") columns.push(...this.FormColumns(stepIndex));

      if (step.type === "computed")
        columns.push(...this.ComputedColumns(stepIndex));
    });

    // Order the columns
    const unPinnedColumns = [];
    const pinnedColumns = [];
    order.forEach(orderItem => {
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

    return orderedColumns;
  };

  TruncatedLabel = label =>
    label.length > 15 ? (
      <Popover content={label}>{`${label.slice(0, 15)}...`}</Popover>
    ) : (
      label
    );

  DatasourceColumns = stepIndex => {
    const { steps } = this.props;
    const { sort } = this.state;

    const step = steps[stepIndex]["datasource"];
    const columns = [];

    step.fields.forEach(field => {
      const label = step.labels[field];
      const truncatedLabel = this.TruncatedLabel(label);

      columns.push({
        className: "column",
        stepIndex,
        field,
        dataIndex: label,
        key: label,
        sorter: (a, b) => {
          a = label in a && a[label] !== null ? a[label] : "";
          b = label in b && b[label] !== null ? b[label] : "";
          return a.toString().localeCompare(b.toString());
        },
        sortOrder: sort && sort.field === label && sort.order,
        title: (
          <span className="column_header datasource">{truncatedLabel}</span>
        ),
        render: text => (
          <Field readOnly field={{ type: step.types[field] }} value={text} />
        )
      });
    });

    return columns;
  };

  FormColumns = stepIndex => {
    const { steps, forms } = this.props;
    // const { sort, edit } = this.state;
    const { edit } = this.state;

    const formId = steps[stepIndex]["form"];
    const columns = [];

    const form = forms.find(form => form.id === formId);

    form.fields.forEach(field => {
      const label = field.name;
      const truncatedLabel = this.TruncatedLabel(label);

      const title = (
        <div className="column_header">
          <Dropdown
            trigger={["click"]}
            overlay={
              <Menu
                onClick={e => {
                  if (e.key === "visualise")
                    this.setState({
                      visualisation: { visible: true, column: field.name }
                    });
                  else if (e.key === "edit")
                    this.setState({
                      edit: { field: field.name, primary: form.primary }
                    });
                }}
              >
                <Menu.Item key="edit">
                  <Icon type="edit" style={{ marginRight: 5 }} />
                  Enter data
                </Menu.Item>
              </Menu>
            }
          >
            <span style={{ cursor: "pointer" }} className="column_header form">
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
        // a = label in a ? a[label] : "";
        // b = label in b ? b[label] : "";
        // return a.toString().localeCompare(b.toString());
        // },
        // sortOrder: sort && sort.field === label && sort.order,
        render: (text, record, index) =>
          this.renderFormField(field, text, record[form.primary], formId, index)
      });
    });

    return columns;
  };

  ComputedColumns = stepIndex => {
    const { steps } = this.props;
    const { sort } = this.state;

    const step = steps[stepIndex]["computed"];
    const columns = [];

    step.fields.forEach(field => {
      const label = field.name;
      const truncatedLabel = this.TruncatedLabel(label);

      columns.push({
        className: "column",
        stepIndex,
        field: label,
        title: <span className="column_header computed">{truncatedLabel}</span>,
        dataIndex: label,
        key: label,
        sorter: (a, b) => {
          a = label in a && a[label] !== null ? a[label] : "";
          b = label in b && b[label] !== null ? b[label] : "";
          return a.toString().localeCompare(b.toString());
        },
        sortOrder: sort && sort.field === label && sort.order,
        render: text => {
          return <Field readOnly field={field} value={text} />;
        }
      });
    });

    return columns;
  };

  renderFormField = (field, text, primary, formId, index) => {
    const { edit } = this.state;

    return (
      <div className="editable-field">
        <Field
          field={field}
          value={text}
          readOnly={edit.field !== field.name}
          onSave={value => {
            const payload = {
              field: field.name,
              primary,
              value
            };
            this.handleFormUpdate(formId, payload, index);
          }}
        />
      </div>
    );
  };

  handleFormUpdate = (formId, payload, index) => {
    const { updateData } = this.props;
    const { saved } = this.state;

    apiRequest(`/form/${formId}/access/`, {
      method: "PATCH",
      payload,
      onSuccess: () => {
        this.setState({ saved: { ...saved, [payload.primary]: true } }, () => {
          this.updateSuccess = setTimeout(
            () =>
              this.setState({ saved: { ...saved, [payload.primary]: false } }),
            1500
          );
        });
        updateData(index, payload.field, payload.value);
      },
      onError: () =>
        notification["error"]({
          message: "Failed to update form"
        })
    });
  };

  handleChange = (pagination, filter, sort) => {
    this.setState({ filter, sort });
  };

  componentWillUnmount() {
    clearTimeout(this.updateSuccess);
  }

  render() {
    const {
      data,
      order,
      steps,
      forms,
      datasources,
      updateDatalab,
      selectedId
    } = this.props;
    const { visualisation, edit, saved, searchTerm, view } = this.state;

    const totalDataAmount = data ? data.length : 0;

    // Similarly, the table data is initialised on every render, so that
    // changes to values in form columns can be reflected
    const tableData = this.initialiseData(data, searchTerm);

    const tableDataAmount = tableData.length;

    // Columns are initialised on every render, so that changes to the sort
    // in local state can be reflected in the table columns. Otherwise the
    // columns would ideally only be initialised when receiving the build
    // for the first time
    const orderedColumns = this.initialiseColumns();

    return (
      <div className="data" style={{ marginTop: 25 }}>
        <div className="filter">
          <Button
            size="large"
            onClick={() => this.setState({ visualisation: true })}
            type="primary"
          >
            <Icon type="area-chart" size="large" />
            Visualise
          </Button>

          <Radio.Group
            size="large"
            style={{ marginLeft: 10 }}
            value={view}
            onChange={e => this.setState({ view: e.target.value })}
          >
            <Radio.Button value="data">Data</Radio.Button>
            <Radio.Button value="details">Details</Radio.Button>
          </Radio.Group>

          <Search
            className="searchbar"
            size="large"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => this.setState({ searchTerm: e.target.value })}
          />

          <div>
            {tableDataAmount} records selected out of {totalDataAmount} (
            {totalDataAmount - tableDataAmount} filtered out)
          </div>
        </div>

        <div className="data_manipulation">
          <Visualisation
            visible={visualisation}
            steps={steps}
            order={order}
            data={data}
            fields={orderedColumns.map(item => ({
              label: item.dataIndex,
              stepIndex: item.stepIndex,
              field: item.field
            }))}
            closeModal={() => this.setState({ visualisation: false })}
            forms={forms}
          />

          {view === "data" && (
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
          )}

          {view === "details" && (
            <Details
              datasources={datasources}
              selectedId={selectedId}
              steps={steps}
              order={order}
              updateDatalab={updateDatalab}
              forms={forms}
            />
          )}
        </div>
      </div>
    );
  }
}

export default Data;
