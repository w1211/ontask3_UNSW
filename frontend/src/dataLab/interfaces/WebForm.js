import React from "react";
import { Button, Spin, Table, Select, Divider } from "antd";
import moment from "moment";

import * as DataLabActions from "../DataLabActions";

import EditableField from "../data-manipulation/EditableField";

const Option = Select.Option;

class WebForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true
    };
  }

  componentDidMount() {
    const { match, dataLabId } = this.props;
    const { moduleIndex } = match.params;

    DataLabActions.fetchForm({
      dataLabId,
      moduleIndex,
      onFinish: form => {
        if ("error" in form) {
          this.setState({ isFetching: false, error: form.error });
        } else {
          const columns =
            form.layout === "table" && this.generateDataTableColumns(form);
          this.setState({ isFetching: false, form, columns });
        }
      }
    });
  }

  handleSubmit = data => {
    const { match, dataLabId } = this.props;
    const { moduleIndex } = match.params;

    this.setState({ loading: true });

    DataLabActions.updateDataTableForm({
      dataLabId,
      payload: { moduleIndex, data },
      onFinish: form => {
        this.setState({ loading: false, form });
      }
    });
  };

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

  generateDataTableColumns = form => {
    const columns = form.columns.map(column => ({
      title: column,
      dataIndex: column,
      render: (text, record, index) => {
        const field = form.editable_fields.find(field => field.name === column);

        if (field) {
          text = this.generateText(field, text, record);

          return form.editable_records.includes(record[form.primary_key]) ? (
            <EditableField
              field={field}
              value={text}
              isColumnEdit={true}
              onChange={e => {
                form.data[index][column] = e;
                this.setState({ form });
              }}
            />
          ) : (
            text
          );
        } else {
          return text;
        }
      }
    }));
    return columns;
  };

  generateSingleRecordColumns = (singleRecordIndex, hasPermission) => {
    const { form } = this.state;

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

          return editableField && hasPermission ? (
            <EditableField
              field={editableField}
              value={form.data[singleRecordIndex][record.field]}
              isColumnEdit={true}
              onChange={e => {
                form.data[singleRecordIndex][record.field] = e;
                this.setState({ form });
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

  DataTable = () => {
    const { columns, form, loading } = this.state;

    return (
      <div>
        <Table
          columns={columns}
          dataSource={form.data.map((record, i) => ({ ...record, key: i }))}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50", "100"]
          }}
        />

        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={() => this.handleSubmit(form.data)}
        >
          Save form
        </Button>
      </div>
    );
  };

  changeActiveRecord = singleRecordIndex => {
    const { form } = this.state;

    if (singleRecordIndex === undefined) {
      this.setState({
        singleRecordIndex,
        hasPermission: null,
        data: null,
        columns: null
      });
      return;
    }

    const hasPermission = form.editable_records.includes(
      form.data[singleRecordIndex][form.primary_key]
    );

    const data = Object.keys(form.data[singleRecordIndex]).map((field, i) => ({
      field,
      value: form.data[singleRecordIndex][field],
      key: i
    }));

    const columns = this.generateSingleRecordColumns(
      singleRecordIndex,
      hasPermission
    );

    this.setState({ singleRecordIndex, hasPermission, data, columns });
  };

  SingleRecord = () => {
    const { form, singleRecordIndex, columns, data, loading } = this.state;

    return (
      <div className="single_record">
        <Select
          showSearch
          allowClear
          placeholder="Choose a record"
          onChange={this.changeActiveRecord}
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
          <div>
            <Table
              bordered
              columns={columns}
              dataSource={data}
              pagination={false}
            />

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={() => this.handleSubmit([form.data[singleRecordIndex]])}
            >
              Save form
            </Button>
          </div>
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

export default WebForm;
