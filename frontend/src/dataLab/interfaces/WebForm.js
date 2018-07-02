import React from "react";
import { Button, Form, Input, Spin, Table, Alert } from "antd";
import _ from "lodash";
import moment from "moment";

import * as DataLabActions from "../DataLabActions";

import EditableField from "../data-manipulation/EditableField";

const FormItem = Form.Item;

class WebForm extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.state = {
      isFetching: true
    };
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

  generateColumns = form => {
    const columns = form.columns.map(column => ({
      title: column,
      dataIndex: column,
      render: (text, record, index) => {
        const field = form.editable_fields.find(field => field.name === column);
        if (field) {
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
            this.generateText(field, text, record)
          );
        } else {
          return text;
        }
      }
    }));
    return columns;
  };

  componentDidMount() {
    const { match, location, dataLabId } = this.props;
    const { moduleIndex } = match.params;

    DataLabActions.fetchForm({
      dataLabId,
      moduleIndex,
      onFinish: form => {
        if ("error" in form) {
          this.setState({ isFetching: false, error: form.error });
        } else {
          const columns = form.layout === "table" && this.generateColumns(form);
          this.setState({ isFetching: false, form, columns });
        }
      }
    });
  }

  DataTable = () => {
    const { match, dataLabId } = this.props;
    const { columns, form, loading } = this.state;
    const { moduleIndex } = match.params;

    return (
      <div>
        <Table
          columns={columns}
          dataSource={form.data}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50", "100"]
          }}
        />

        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={() => {
            this.setState({ loading: true });

            DataLabActions.updateDataTableForm({
              dataLabId,
              payload: { moduleIndex, data: form.data },
              onFinish: form => {
                this.setState({ loading: false, form });
              }
            });
          }}
        >
          Save form
        </Button>
      </div>
    );
  };

  SingleRecord = () => {
    return <div>single record</div>;
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
