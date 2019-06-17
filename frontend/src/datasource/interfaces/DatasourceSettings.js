import React from "react";
import apiRequest from "../../shared/apiRequest";
import {
  Button,
  Form,
  Input,
  Alert,
  Select,
  Upload,
  Icon,
  Tooltip,
  message,
  notification
} from "antd";
import _ from "lodash";
import memoize from "memoize-one";

import formItemLayout from "../../shared/FormItemLayout";

import "../Datasource.css";

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;
const Dragger = Upload.Dragger;

class File extends React.Component {
  state = {};

  fetchSheetnames = () => {
    const { form, bucket, i, file } = this.props;
    const { sheetnames } = this.state;

    if (sheetnames) return;

    let data;
    if (file) {
      data = new FormData();
      data.append("file", file, file.name);
    } else {
      data = {
        bucket,
        name: form.getFieldValue(`connection.files[${i}].name`)
      };
    }

    this.setState({ loading: true });

    const parameters = {
      method: "POST",
      onError: error => {
        this.setState({ loading: false });
        notification["error"]({ message: error });
      },
      onSuccess: response => {
        const { sheetnames } = response;
        this.setState({ loading: false, sheetnames });
      },
      payload: data,
      isJSON: !file
    };

    apiRequest(`/datasource/get_sheetnames/`, parameters);
  };

  render() {
    const {
      form,
      datasource,
      i,
      canDelete,
      onDeleteField,
      allowMultiple,
      isUpload,
      file
    } = this.props;
    const { loading, sheetnames } = this.state;
    const { getFieldValue, getFieldDecorator } = form;

    const index = !allowMultiple ? 0 : i;

    return (
      <div className="file">
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <FormItem
            style={{ marginBottom: 0, flex: 1 }}
            {...(isUpload ? formItemLayout : {})}
            label={isUpload && "File name"}
          >
            {getFieldDecorator(`connection.files[${index}].name`, {
              rules: [{ required: true, message: "File name is required" }],
              initialValue:
                form.getFieldValue(`connection.files[${index}].name`) ||
                _.get(datasource, `connection.files[${index}].name`) ||
                (file && file.name)
            })(<Input disabled={isUpload} />)}
          </FormItem>

          {allowMultiple && (
            <div style={{ lineHeight: "40px" }}>
              <Tooltip title="Remove file">
                <Button
                  style={{ marginLeft: 5 }}
                  type="danger"
                  icon="delete"
                  disabled={!canDelete}
                  onClick={onDeleteField}
                />
              </Tooltip>
            </div>
          )}
        </div>

        {getFieldValue(`connection.files[${index}].name`) &&
          ["csv", "txt"].includes(
            getFieldValue(`connection.files[${index}].name`)
              .split(".")
              .pop()
              .toLowerCase()
          ) && (
            <FormItem
              {...formItemLayout}
              label="Delimiter"
              style={{ marginBottom: 0 }}
            >
              {getFieldDecorator(`connection.files[${index}].delimiter`, {
                initialValue:
                  _.get(
                    datasource,
                    `connection.files[${index}].delimiter`,
                    ","
                  ) || ",",
                rules: [{ required: true, message: "Delimiter is required" }]
              })(
                <Select>
                  <Option value=",">Comma ,</Option>
                  <Option value=" ">Tabs " "</Option>
                  <Option value=";">Semi-colons ;</Option>
                  <Option value="|">Pipes |</Option>
                  <Option value="^">Carets ^</Option>
                  <Option value="~">Tildes ~</Option>
                </Select>
              )}
            </FormItem>
          )}

        {getFieldValue(`connection.files[${index}].name`) &&
          ["xlsx", "xls"].includes(
            getFieldValue(`connection.files[${index}].name`)
              .split(".")
              .pop()
              .toLowerCase()
          ) && (
            <FormItem
              {...formItemLayout}
              label="Sheet name"
              style={{ marginBottom: 0 }}
            >
              {getFieldDecorator(`connection.files[${index}].sheetname`, {
                initialValue: _.get(
                  datasource,
                  `connection.files[${i}].sheetname`
                ),
                rules: [{ required: true, message: "Sheet name is required" }]
              })(
                <Select
                  notFoundContent={
                    loading ? (
                      <>
                        <Icon type="loading" style={{ margin: "0 10px" }} />
                        Fetching sheet names...
                      </>
                    ) : null
                  }
                  onFocus={this.fetchSheetnames}
                >
                  {sheetnames &&
                    sheetnames.map(option => (
                      <Option key={option}>{option}</Option>
                    ))}
                </Select>
              )}
            </FormItem>
          )}
      </div>
    );
  }
}

class DatasourceSettings extends React.Component {
  constructor(props) {
    super(props);
    const { datasource } = props;
    this.state = {
      file: null,
      fileError: null,
      loading: false,
      error: null,
      sheetnames: [],
      fileKeys: (_.get(datasource, "connection.files", []).length > 1
        ? datasource.connection.files
        : [null]
      ).map(() => _.uniqueId())
    };
  }

  permission = memoize((bucket, files) =>
    JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Ontask access permission",
            Effect: "Allow",
            Principal: {
              AWS: [process.env.REACT_APP_AWS_ID]
            },
            Action: ["s3:GetObject"],
            Resource: files.map(
              file =>
                `arn:aws:s3:::${bucket || "YOUR_BUCKET_NAME"}/${
                  file.name ? file.name : "YOUR_FILE_NAME"
                }`
            )
          }
        ]
      },
      null,
      2
    )
  );

  Policy = () => {
    const { form } = this.props;
    const { getFieldValue } = form;

    const bucket = getFieldValue("connection.bucket");
    const files = getFieldValue("connection.files");

    return <pre>{this.permission(bucket, files)}</pre>;
  };

  handleOk = () => {
    const {
      form,
      datasource,
      containerId,
      history,
      updateDatasource
    } = this.props;
    const { file, fileError } = this.state;

    form.validateFields((err, values) => {
      if (err || fileError) return;

      if (
        ["xlsXlsxFile", "csvTextFile"].includes(values.connection.dbType) &&
        !file &&
        !datasource
      ) {
        this.setState({ fileError: "File is required" });
        return;
      }

      this.setState({ loading: true });

      let payload = new FormData();
      if (file) {
        payload = new FormData();
        payload.append("file", file, file.name);
        payload.append("name", values.name);
        payload.append("payload", JSON.stringify(values));
      } else {
        payload = values;
      }

      let url = "/datasource/";
      if (datasource) {
        url += `${datasource.id}/`;
      } else {
        if (file) {
          payload.append("container", containerId);
        } else {
          payload.container = containerId;
        }
      }

      apiRequest(url, {
        method: datasource ? "PATCH" : "POST",
        payload,
        isJSON: !file,
        onSuccess: updatedDatasource => {
          this.setState({ loading: false, error: null });
          updateDatasource(updatedDatasource);
          notification["success"]({
            message: `Datasource ${datasource ? "updated" : "added"}`,
            description: `The datasource was successfully ${
              datasource ? "updated" : "added"
            }.`
          });
          if (!datasource)
            history.push(`/datasource/${updatedDatasource.id}/settings`);
        },
        onError: error => this.setState({ loading: false, error })
      });
    });
  };

  handleFileDrop = e => {
    const { form } = this.props;

    const file = e.file;
    const fileName = file.name.split(".");
    const extension = fileName[fileName.length - 1].toLowerCase();
    const fileSize = file.size / Math.pow(1024, 2); // File size in MB

    const fileError = this.validateFile(extension, fileSize);
    this.setState({
      fileError, // If there are errors, save them to the state so they can be shown in the interface
      file: fileError ? null : file // If there are no errors, then save the file in the state
    });

    form.getFieldDecorator(`connection.files[0].name`, {
      initialValue: file.name
    });

    if (file && !form.getFieldValue("name"))
      form.setFieldsValue({
        name: file.name.substring(0, file.name.lastIndexOf("."))
      });
  };

  validateFile = (extension, fileSize) => {
    // Validate file type
    if (!["txt", "csv", "xlsx", "xls"].includes(extension))
      return "This file type is not supported.";

    // Validate file size
    if (fileSize > 2) return "File must not be larger than 2MB";
  };

  copyToClipboard = () => {
    const { form } = this.props;
    const { getFieldValue } = form;
    var textField = document.createElement("textarea");
    textField.innerHTML = this.permission(
      getFieldValue("connection.bucket"),
      getFieldValue("connection.files")
    );
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();
    message.success("Copied bucket policy to clipboard");
  };

  S3Bucket = () => {
    const { form, datasource } = this.props;
    const { getFieldValue, getFieldDecorator, setFieldsValue } = form;
    const { fileKeys } = this.state;

    const bucketName = getFieldValue("connection.bucket")
      ? getFieldValue("connection.bucket")
      : _.get(datasource, "connection.bucket", "YOUR_BUCKET_NAME");

    return (
      <div>
        <FormItem {...formItemLayout} label="Bucket name">
          {getFieldDecorator("connection.bucket", {
            initialValue: _.get(datasource, "connection.bucket"),
            rules: [{ required: true, message: "Bucket name is required" }]
          })(<Input />)}
        </FormItem>

        <FormItem {...formItemLayout} label="File(s)">
          <Button
            size="small"
            type="primary"
            onClick={() => {
              this.setState({
                fileKeys: [...fileKeys, _.uniqueId()]
              });
            }}
          >
            Add file
          </Button>

          {fileKeys.map((key, i) => (
            <File
              key={i}
              bucket={bucketName}
              datasource={datasource}
              form={form}
              i={i}
              canDelete={fileKeys.length !== 1}
              onDeleteField={() => {
                const files = getFieldValue("connection.files");

                fileKeys.splice(i, 1);
                files.splice(i, 1);

                this.setState({ fileKeys });
                setFieldsValue({ "connection.files": files });
              }}
              allowMultiple={true}
            />
          ))}
        </FormItem>

        <Alert
          className="info"
          message="If your file is inside a folder, add the folder to 
          the file name (e.g. 2018s1/class.csv)"
          type="info"
          showIcon
        />

        <p>
          Please copy following policy to your bucket permission:
          <Tooltip
            placement="right"
            title="Adding this policy to your bucket permission is neccessary 
            in order to provide OnTask with access to your file."
          >
            <Icon type="question-circle-o" className="info_tooltip" />
          </Tooltip>
        </p>

        <code className="bucket_policy">
          <Button
            shape="circle"
            icon="copy"
            size="small"
            onClick={this.copyToClipboard}
          />
          <this.Policy bucket={bucketName} form={form} />
        </code>
      </div>
    );
  };

  LocalFile = fileType => (
    <Dragger
      name="file"
      multiple={false}
      onChange={this.handleFileDrop}
      beforeUpload={() => false} // Prevent immediate upload upon file drop
      action="" // The uploading URL (required) however we do not make use of
      showUploadList={false}
      accept={fileType === "xlsXlsxFile" ? ".xls,.xlsx" : ".csv,.txt"}
    >
      <p className="ant-upload-drag-icon">
        <Icon type="inbox" />
      </p>
      <p className="ant-upload-text">
        Click or drag file to this area to upload
      </p>
      <p className="ant-upload-hint">
        <span>Supported file formats: </span>
        {fileType === "xlsXlsxFile" ? "xls/xlsx" : "csv/txt"}
      </p>
    </Dragger>
  );

  ConnectionSettings = () => {
    const { form, datasource } = this.props;
    const { getFieldDecorator } = form;

    return (
      <div>
        <FormItem {...formItemLayout} label="Host">
          {getFieldDecorator("connection.host", {
            initialValue: _.get(datasource, "connection.host"),
            rules: [{ required: true, message: "Host is required" }]
          })(<Input />)}
        </FormItem>

        <FormItem {...formItemLayout} label="Database">
          {getFieldDecorator("connection.database", {
            initialValue: _.get(datasource, "connection.database"),
            rules: [{ required: true, message: "Database is required" }]
          })(<Input />)}
        </FormItem>

        <FormItem {...formItemLayout} label="User">
          {getFieldDecorator("connection.user", {
            initialValue: _.get(datasource, "connection.user"),
            rules: [{ required: true, message: "Database user is required" }]
          })(<Input />)}
        </FormItem>

        <FormItem {...formItemLayout} label="Password">
          {getFieldDecorator("connection.password", {
            rules: [
              {
                required: !datasource,
                message: "Database password is required"
              }
            ]
          })(
            <Input
              type="password"
              placeholder={datasource && "Change password"}
            />
          )}
        </FormItem>

        <FormItem {...formItemLayout} label="Query">
          {getFieldDecorator("connection.query", {
            initialValue: _.get(datasource, "connection.query"),
            rules: [{ required: true, message: "Database query is required" }]
          })(<TextArea rows={2} />)}
        </FormItem>
      </div>
    );
  };

  render() {
    const { datasource, form, history } = this.props;
    const { loading, error, file, fileError } = this.state;

    const { getFieldValue, getFieldDecorator } = form;

    const fileType = getFieldValue("connection.dbType")
      ? getFieldValue("connection.dbType")
      : _.get(datasource, "connection.dbType") || "csvTextFile";

    const requiresUpload = ["xlsXlsxFile", "csvTextFile"].includes(fileType);
    const requiresConnection = [
      "mysql",
      "postgresql",
      "sqlite",
      "mssql"
    ].includes(fileType);

    return (
      <Form
        layout="horizontal"
        className="datasource"
        style={{ maxWidth: 500, overflow: "hidden" }}
      >
        <FormItem {...formItemLayout} label="Type">
          {getFieldDecorator("connection.dbType", {
            initialValue: _.get(datasource, "connection.dbType"),
            rules: [{ required: true, message: "Type is required" }],
            onChange: () => this.setState({ sheetnames: null, file: null })
          })(
            <Select>
              <Option value="mysql">MySQL</Option>
              <Option value="postgresql">PostgreSQL</Option>
              <Option value="csvTextFile">csv/text file</Option>
              <Option value="xlsXlsxFile">xls/xlsx file</Option>
              <Option value="s3BucketFile">S3 bucket file</Option>
              <Option value="sqlite" disabled>
                SQLite
              </Option>
              <Option value="mssql" disabled>
                MSSQL
              </Option>
            </Select>
          )}
        </FormItem>

        <FormItem {...formItemLayout} label="Datasource name">
          {getFieldDecorator("name", {
            initialValue: _.get(datasource, "name"),
            rules: [{ required: true, message: "Name is required" }]
          })(<Input />)}
        </FormItem>

        {fileType === "s3BucketFile" && this.S3Bucket()}

        {requiresUpload && (
          <>
            {this.LocalFile(fileType)}
            {file && (
              <div style={{ marginTop: 15 }}>
                <File
                  file={file}
                  allowMultiple={false}
                  datasource={datasource}
                  form={form}
                  isUpload={true}
                />
              </div>
            )}
          </>
        )}

        {requiresConnection && this.ConnectionSettings()}

        {fileError && (
          <Alert className="error" message={fileError} type="error" />
        )}
        {error && <Alert className="error" message={error} type="error" />}

        {datasource && (
          <Button
            style={{ marginRight: 15 }}
            icon="plus"
            onClick={() =>
              history.push({
                pathname: "/datasource",
                state: { containerId: datasource.container }
              })
            }
          >
            Add Another Datasource
          </Button>
        )}

        <Button
          loading={loading}
          type="primary"
          onClick={this.handleOk}
          style={{ marginTop: 20 }}
        >
          {datasource ? "Save" : "Submit"}
        </Button>
      </Form>
    );
  }
}

export default Form.create()(DatasourceSettings);
