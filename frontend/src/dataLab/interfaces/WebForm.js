import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Spin, Table, Select, Divider } from "antd";
import _ from "lodash";

import * as DataLabActionCreators from "../DataLabActions";

import EditableField from "../data-manipulation/EditableField";

const Option = Select.Option;

class WebForm extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = {
      isFetching: true,
      saved: {}
    };
  }

  componentDidMount() {
    const { match, dataLabId, showBreadcrumbs } = this.props;
    const { moduleIndex } = match.params;

    this.boundActionCreators.fetchForm({
      payload: { dataLabId, moduleIndex },
      onFinish: form => {
        if ("error" in form) {
          this.setState({ isFetching: false, error: form.error });
        } else {
          this.setState({
            isFetching: false,
            form,
            // If there is only one record in the form data, then
            // hide the primary key drop-down and simply show the form
            // for this record. The most likely scenario is that this web
            // form is for students, and each student only has access
            // to their own record (based on the email they logged in with).
            singleRecordIndex: form.data.length === 1 ? 0 : null
          });
          if (form.is_owner_or_shared) showBreadcrumbs();
        }
      }
    });
  }

  generateDataTableColumns = () => {
    const { form } = this.state;

    const columns = form.columns.map(column => ({
      title: column,
      dataIndex: column,
      render: (text, record) => {
        const field = form.editable_fields.find(field => field.name === column);

        const primary = record[form.primary_key];

        return (
          <EditableField
            field={field}
            editMode={!!field}
            originalValue={text ? text : null}
            onSave={value => this.onOk(primary, field.name, value)}
          />
        );
      }
    }));
    return columns;
  };

  generateSingleRecordColumns = () => {
    const { form, singleRecordIndex } = this.state;

    const columns = [
      {
        title: "Field",
        dataIndex: "field"
      },
      {
        title: "Value",
        dataIndex: "value",
        render: (text, record) => {
          const editableField = form.editable_fields.find(
            field => field.name === record.field
          );

          const primary = form.data[singleRecordIndex][form.primary_key];

          return (
            <EditableField
              field={editableField}
              editMode={!!editableField}
              originalValue={text}
              onSave={value => this.onOk(primary, record.field, value)}
            />
          );
        }
      }
    ];

    return columns;
  };

  onOk = (primary, field, value) => {
    const { dataLabId, match } = this.props;
    const { saved } = this.state;
    const { moduleIndex } = match.params;

    const payload = {
      dataLabId,
      stepIndex: moduleIndex,
      primary,
      field,
      value
    };

    this.boundActionCreators.updateWebForm({
      payload,
      onFinish: form => {
        const value = _.get(saved, primary, {});
        value[field] = true;
        this.setState({ form, saved: { ...saved, [primary]: value } }, () => {
          setTimeout(() => {
            value[field] = false;
            this.setState({ saved: { ...saved, [primary]: value } });
          }, 1500);
        });
      }
    });
  };

  DataTable = () => {
    const { form, saved } = this.state;
    const columns = this.generateDataTableColumns();

    return (
      <Table
        columns={columns}
        dataSource={form.data.map((record, i) => ({ ...record, key: i }))}
        scroll={{ x: (columns.length - 1) * 175 }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: ["10", "25", "50", "100"]
        }}
        rowClassName={record => {
          const primary = record[form.primary_key];
          return primary in saved &&
            Object.values(saved[primary]).includes(true)
            ? "saved"
            : "";
        }}
      />
    );
  };

  SingleRecord = () => {
    const { form, saved, singleRecordIndex } = this.state;

    return (
      <div className="single_record">
        {form.data.length > 1 && (
          <div>
            <Select
              showSearch
              allowClear
              placeholder="Choose a record"
              onChange={singleRecordIndex =>
                this.setState({ singleRecordIndex })
              }
              filterOption={(input, option) =>
                option.props.children
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
            >
              {form.data.map((record, index) => (
                <Option key={index}>{record[form.primary_key]}</Option>
              ))}
            </Select>

            <Divider />
          </div>
        )}

        {singleRecordIndex !== null && singleRecordIndex !== undefined ? (
          <Table
            bordered
            showHeader={form.data.length > 1}
            columns={this.generateSingleRecordColumns()}
            dataSource={Object.keys(form.data[singleRecordIndex]).map(
              (field, i) => ({
                field,
                value: form.data[singleRecordIndex][field],
                key: i
              })
            )}
            pagination={false}
            rowClassName={record => {
              const primary = form.data[singleRecordIndex][form.primary_key];
              return _.get(saved, `${primary}[${record.field}]`) ? "saved" : "";
            }}
          />
        ) : (
          <div>Get started by choosing a record to edit.</div>
        )}
      </div>
    );
  };

  render() {
    const { isFetching, form, error } = this.state;

    return (
      <div className="web_form">
        {isFetching ? (
          <Spin size="large" />
        ) : error ? (
          <div className="error">
            <h1>Access denied</h1>
            <h2>{error}</h2>
          </div>
        ) : (
          <div>
            <h1>{form.name}</h1>
            {form.layout === "table" && this.DataTable()}
            {form.layout === "vertical" && this.SingleRecord()}
          </div>
        )}
      </div>
    );
  }
}

export default connect()(WebForm);
