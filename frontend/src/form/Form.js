import React from "react";
import { Link } from "react-router-dom";
import { Layout, Icon, Spin, Table, Divider, Select, notification } from "antd";
import _ from "lodash";

import apiRequest from "../shared/apiRequest";
import Field from "../shared/Field";

import "./Form.css";

const { Content } = Layout;

class Form extends React.Component {
  state = { fetching: true, singleRecordIndex: 0, saved: {} };

  componentDidMount() {
    const { match, history } = this.props;

    apiRequest(`/form/${match.params.id}/access/`, {
      method: "GET",
      onSuccess: form => {
        const columnNames = [
          ...new Set([
            form.primary,
            ...form.visibleFields,
            ...form.fields.map(field => field.name)
          ])
        ];

        this.setState({
          fetching: false,
          form,
          columnNames,
          tableColumns: this.generateColumns(form, columnNames)
        });
      },
      onError: (error, status) => {
        if (status === 403) {
          history.replace("/forbidden");
          return;
        }

        this.setState({
          fetching: false,
          error: error.detail
        });
      }
    });
  }

  generateColumns = (form, columnNames) => {
    const { singleRecordIndex } = this.state;

    if (form.layout === "table") {
      return columnNames.map((column, columnIndex) => ({
        title: column,
        dataIndex: column,
        key: columnIndex,
        sorter: (a, b) => (a[column] || "").localeCompare(b[column] || ""),
        render: (value, record, index) => {
          const field = form.fields.find(field => field.name === column);
          const editable =
            form.is_active &&
            form.editable_records.includes(_.get(record, form.primary)) &&
            field;

          if (field && field.type === "checkbox-group")
            value = _.pick(record, field.columns);

          return (
            <Field
              readOnly={!editable}
              field={field}
              value={value}
              onSave={(value, column) =>
                this.handleSubmit(
                  record[form.primary],
                  column ? column : field.name,
                  value,
                  index,
                  field.name
                )
              }
            />
          );
        }
      }));
    } else if (form.layout === "vertical") {
      return [
        {
          title: "Field",
          dataIndex: "column"
        },
        {
          title: "Value",
          dataIndex: "value",
          render: (value, record) => {
            const primary = _.get(record.item, form.primary);

            const field = form.fields.find(
              field => field.name === record.column
            );
            const editable =
              form.is_active &&
              form.editable_records.includes(primary) &&
              field;

            if (field && field.type === "checkbox-group")
              value = _.pick(record.item, field.columns);

            return (
              <Field
                primaryKey={primary}
                readOnly={!editable}
                field={field}
                value={value}
                onSave={(value, column) =>
                  this.handleSubmit(
                    primary,
                    column ? column : field.name,
                    value,
                    singleRecordIndex,
                    field.name
                  )
                }
              />
            );
          }
        }
      ];
    }
  };

  handleSubmit = (primary, field, value, index, loadingKey) => {
    const { match } = this.props;
    const { saved, form } = this.state;

    const data = form.data;
    data.forEach(item => {
      if (item[form.primary] === primary) item[field] = value;
    });
    this.setState({ form: { ...form, data } });

    apiRequest(`/form/${match.params.id}/access/`, {
      method: "PATCH",
      payload: { primary, field, value },
      onSuccess: () => {
        const savedRecord = _.get(saved, primary, {});
        savedRecord[loadingKey] = true;
        this.setState({ saved: { ...saved, [primary]: savedRecord } }, () => {
          this.updateSuccess = setTimeout(() => {
            savedRecord[loadingKey] = false;
            this.setState({ saved: { ...saved, [primary]: savedRecord } });
          }, 1500);
        });
      },
      onError: () => {
        notification["error"]({
          message: "Failed to update form"
        });
        // Revert the form data using the original form state
        // (const is instantiated at the start of handleSubmit, before the setState)
        this.setState({ form });
      }
    });
  };

  componentWillUnmount() {
    clearTimeout(this.updateSuccess);
  }

  render() {
    const {
      fetching,
      form,
      tableColumns,
      columnNames,
      singleRecordIndex,
      saved,
      grouping
    } = this.state;

    const groups =
      form && form.groupBy
        ? new Set(form.data.map(item => item[form.groupBy]))
        : [];

    return (
      <div className="form">
        <Content className="wrapper">
          <Layout className="layout">
            <Content className="content">
              <Layout className="content_body">
                {fetching ? (
                  <div style={{ textAlign: "left" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <div>
                    <Link
                      to="/dashboard"
                      style={{ display: "inline-block", marginBottom: 20 }}
                    >
                      <Icon type="arrow-left" style={{ marginRight: 5 }} />
                      <span>Back to dashboard</span>
                    </Link>

                    <h1>{form.name}</h1>

                    <p>{form.description}</p>

                    {form.layout === "vertical" ? (
                      <div>
                        {form.data.length > 1 && (
                          <div>
                            {form.groupBy && [
                              <div style={{ marginBottom: 5 }} key="text">
                                Group by:
                              </div>,
                              <Select
                                key="groups"
                                style={{
                                  width: "100%",
                                  maxWidth: 350,
                                  marginBottom: 10
                                }}
                                allowClear
                                onChange={grouping =>
                                  this.setState({
                                    grouping,
                                    singleRecordIndex: form.data.findIndex(
                                      item =>
                                        (_.get(item, form.groupBy) ||
                                          "null") === grouping || 0
                                    )
                                  })
                                }
                              >
                                {[...groups].map(group => (
                                  <Select.Option key={group}>
                                    {group ? group : <i>No value</i>}
                                  </Select.Option>
                                ))}
                              </Select>
                            ]}

                            <div style={{ marginBottom: 5 }}>
                              Choose a record:
                            </div>

                            <Select
                              showSearch
                              allowClear
                              style={{ width: "100%", maxWidth: 350 }}
                              onChange={singleRecordIndex =>
                                this.setState({ singleRecordIndex })
                              }
                              filterOption={(input, option) =>
                                option.props.children
                                  .toLowerCase()
                                  .indexOf(input.toLowerCase()) >= 0
                              }
                              value={_.get(
                                form.data,
                                `${singleRecordIndex}.${form.primary}`
                              )}
                            >
                              {form.data.map((record, index) =>
                                !grouping ||
                                (_.get(record, form.groupBy) || "null") ===
                                  grouping ? (
                                  <Select.Option key={index}>
                                    {record[form.primary]}
                                  </Select.Option>
                                ) : null
                              )}
                            </Select>

                            <Divider />
                          </div>
                        )}

                        <Table
                          bordered
                          columns={tableColumns}
                          dataSource={columnNames.map((column, i) => ({
                            column,
                            value: _.get(
                              form.data,
                              `${singleRecordIndex}.${column}`
                            ),
                            item: _.get(form.data, singleRecordIndex),
                            key: i
                          }))}
                          pagination={false}
                          rowClassName={record => {
                            const primary =
                              form.data[singleRecordIndex][form.primary];
                            return _.get(saved, `${primary}[${record.column}]`)
                              ? "saved"
                              : "";
                          }}
                        />
                      </div>
                    ) : (
                      <div>
                        {form.groupBy && [
                          <div style={{ marginBottom: 5 }} key="text">
                            Group by:
                          </div>,
                          <Select
                            style={{ width: "100%", maxWidth: 350 }}
                            key="groups"
                            allowClear
                            onChange={grouping => this.setState({ grouping })}
                          >
                            {[...groups].map(group => (
                              <Select.Option key={group}>
                                {group ? group : <i>No value</i>}
                              </Select.Option>
                            ))}
                          </Select>,
                          <Divider key="divider" />
                        ]}

                        <Table
                          columns={tableColumns}
                          dataSource={
                            grouping
                              ? form.data.filter(
                                  item =>
                                    (_.get(item, form.groupBy) || "null") ===
                                    grouping
                                )
                              : form.data
                          }
                          scroll={{ x: (tableColumns.length - 1) * 175 }}
                          pagination={{
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "25", "50", "100"]
                          }}
                          rowKey={(record, i) => i}
                          rowClassName={record => {
                            const primary = record[form.primary];
                            return primary in saved &&
                              Object.values(saved[primary]).includes(true)
                              ? "saved"
                              : "";
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Layout>
            </Content>
          </Layout>
        </Content>
      </div>
    );
  }
}

export default Form;
