import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Spin, Table, Select, Divider } from "antd";
import moment from "moment";
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
      edit: {},
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
          this.setState({ isFetching: false, form });
          if (form.is_owner_or_shared) showBreadcrumbs();
        }
      }
    });
  }

  generateText = (field, text, record) => {
    let label;

    if (
      field.type === "number" &&
      field.numberDisplay === "range" &&
      text instanceof Array
    ) {
      label = text[0] ? text[0] : 0;
      if (text[1]) label += ` - ${text[1]}`;
    }

    if (field.textDisplay === "list" || field.numberDisplay === "list") {
      if (text instanceof Array) {
        if (field.name in record)
          record[field.name].forEach((value, i) => {
            const option = field.options.find(option => option.value === value);
            if (option) {
              if (i === 0) label = option.label;
              if (i > 0) label += `, ${option.label}`;
            }
          });
      } else {
        const option = field.options.find(option => option.value === text);
        if (option) label = option.label;
      }
    } else if (field.type === "date") {
      if (text) text = moment(text).format("YYYY-MM-DD");
    } else if (field.type === "checkbox") {
      text = text ? "True" : "False";
    }

    return label ? label : text;
  };

  generateDataTableColumns = () => {
    const { form, edit } = this.state;

    const columns = form.columns.map(column => ({
      title: column,
      dataIndex: column,
      render: (text, record) => {
        const field = form.editable_fields.find(field => field.name === column);

        if (field) {
          text = this.generateText(field, text, record);

          const primary = record[form.primary_key];
          const value = _.get(edit, `${primary}[${field.name}]`, text);

          return (
            <EditableField
              field={field}
              value={value}
              onChange={e => {
                this.onChange(e, primary, field.name);
              }}
              onOk={() => {
                if (value === text) return;
                this.onOk(primary, field.name, value);
              }}
            />
          );
        } else {
          return text;
        }
      }
    }));
    return columns;
  };

  generateSingleRecordColumns = () => {
    const { form, edit, singleRecordIndex } = this.state;

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
          const value = _.get(edit, `${primary}[${record.field}]`, text);

          return editableField ? (
            <EditableField
              field={editableField}
              value={value}
              onChange={e => {
                this.onChange(e, primary, record.field);
              }}
              onOk={() => {
                if (value === text) return;
                this.onOk(primary, record.field, value);
              }}
            />
          ) : (
            text
          );
        }
      }
    ];

    return columns;
  };

  onChange = (e, primary, field) => {
    const { edit } = this.state;

    const value = _.get(edit, primary, {});
    value[field] = e;
    this.setState({
      edit: { ...edit, [primary]: value }
    });
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

    return (
      <Table
        columns={this.generateDataTableColumns()}
        dataSource={form.data.map((record, i) => ({ ...record, key: i }))}
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
        <Select
          showSearch
          allowClear
          placeholder="Choose a record"
          onChange={singleRecordIndex => this.setState({ singleRecordIndex })}
          filterOption={(input, option) =>
            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >=
            0
          }
        >
          {form.data.map((record, index) => (
            <Option key={index}>{record[form.primary_key]}</Option>
          ))}
        </Select>

        <Divider />

        {singleRecordIndex ? (
          <Table
            bordered
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
