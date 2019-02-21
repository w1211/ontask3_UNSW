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
            ...Object.keys(form.data[0]),
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
    if (form.layout === "table") {
      return columnNames.map((column, columnIndex) => ({
        title: column,
        dataIndex: column,
        key: columnIndex,
        render: (text, record) => {
          const field =
            form.editable_records.includes(_.get(record, form.primary)) &&
            form.fields.find(field => field.name === column);

          return (
            <Field
              readOnly={!field}
              field={field}
              value={column in record ? text : null}
              onSave={value =>
                this.handleSubmit(record[form.primary], field.name, value)
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
          render: (text, record) => {
            const primary = _.get(record.item, form.primary);

            const field =
              form.editable_records.includes(primary) &&
              form.fields.find(field => field.name === record.column);

            return (
              <Field
                primaryKey={primary}
                readOnly={!field}
                field={field}
                value={text}
                onSave={value => this.handleSubmit(primary, field.name, value)}
              />
            );
          }
        }
      ];
    }
  };

  handleSubmit = (primary, field, value) => {
    const { match } = this.props;
    const { saved } = this.state;

    apiRequest(`/form/${match.params.id}/access/`, {
      method: "PATCH",
      payload: { primary, field, value },
      onSuccess: form => {
        const value = _.get(saved, primary, {});
        value[field] = true;
        this.setState({ form, saved: { ...saved, [primary]: value } }, () => {
          this.updateSuccess = setTimeout(() => {
            value[field] = false;
            this.setState({ saved: { ...saved, [primary]: value } });
          }, 1500);
        });
      },
      onError: () =>
        notification["error"]({
          message: "Failed to update form"
        })
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
      saved
    } = this.state;

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
                              {form.data.map((record, index) => (
                                <Select.Option key={index}>
                                  {record[form.primary]}
                                </Select.Option>
                              ))}
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
                      <Table
                        columns={tableColumns}
                        dataSource={form.data}
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
