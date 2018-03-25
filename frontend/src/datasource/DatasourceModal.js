import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {Button, Modal, Form, Input, Alert, Select, Upload, Icon, Tooltip } from 'antd';

import * as DatasourceActionCreators from './DatasourceActions';

import formItemLayout from '../shared/FormItemLayout';

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;
const Dragger = Upload.Dragger;


class DatasourceModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(DatasourceActionCreators, dispatch)

    this.state = {
      file: null,
      error: null
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.visible) this.setState({
      file: null,
      error: null
    });

    // If we are opening the modal
    if (!this.props.visible && nextProps.visible && nextProps.selected) {
      // Set the state that indicates the file type, so that the view renders correctly
      // This is only relevant whenn editing an existing datasource
      this.setState({ fileType: nextProps.selected.connection.dbType });
    }
  }

  handleOk = () => {
    const { form, selected, containerId } = this.props;
    const { file, error } = this.state;
    
    form.validateFields((err, values) => {
      if (err || error) return;

      if (['xlsXlsxFile', 'csvTextFile'].includes(values.connection.dbType) && !file && !selected) {
        this.setState({ error: 'File is required' });
        return;
      }

      if (selected) {
        this.boundActionCreators.updateDatasource(selected.id, values, file);
      } else {
        this.boundActionCreators.createDatasource(containerId, values, file)
      }
    });
  }

  optionOnChange(type){
    if (type !== 'csvTextFile' || type !== 'xlsXlsxFile'){
      this.setState({ file: null, fileType: type});
    }
    else{
      this.setState({ fileType: type })
    }
  }

  handleFileDrop(e) {
    const file = e.file;
    const fileName = file.name.split('.');
    const extension = fileName[fileName.length - 1].toLowerCase();
    const fileSize = file.size / Math.pow(1024, 2); // File size in MB

    if (['xlsx', 'xls'].includes(extension)) {
      this.boundActionCreators.fetchSheetnames(file);
    };
    
    const error = this.validateFile(extension, fileSize);
    this.setState({
      error, // If there are errors, save them to the state so they can be shown in the interface
      file: error ? null : file // If there are no errors, then save the file in the state
    });
  }

  validateFile = (extension, fileSize, callback) => {
    // Validate file type
    if (!['txt', 'csv', 'xlsx', 'xls'].includes(extension)) return 'This file type is not supported.';

    // Validate file size
    if (fileSize > 2) return 'File must not be larger than 2MB';
  };
  
  copyToClipboard(){
    const AWSCredentials = `AWS_ACCESS_KEY_ID = ${process.env.REACT_APP_AWS_ACCESS_KEY_ID}\nAWS_SECRET_ACCESS_KEY = ${process.env.REACT_APP_AWS_SECRET_ACCESS_KEY}`;
    console.log(AWSCredentials);
    var textField = document.createElement('textarea');
    textField.innerText = AWSCredentials;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
  }

  render() {
    const { selected, visible, loading, error, form, sheetnames } = this.props;
    const { fileType, file, isS3Csv} = this.state
    const isFile = ['xlsXlsxFile', 'csvTextFile', 's3BucketFile'].includes(fileType);
    const isCSV = fileType === 'csvTextFile';
    const isLocalFile = ['xlsXlsxFile', 'csvTextFile'].includes(fileType);
    const isS3Bucket = fileType === 's3BucketFile';
    const text = "Informational text"; // TODO: add text here

    const checkS3FileType = () => {
      const fileName = form.getFieldValue('fileName').split('.');
      const extension = fileName[fileName.length - 1].toLowerCase();
      if(['xlsx', 'xls'].includes(extension)){
        this.boundActionCreators.fetchS3Sheetnames(form.getFieldValue('bucket'), form.getFieldValue('fileName'));
        this.setState({isS3Csv:false})
      }
      else if(['csv', 'txt'].includes(extension)){
        this.setState({isS3Csv:true});
      }
    }

    return (
      <Modal
        visible={visible}
        title='Datasources'
        okText={selected ? 'Update' : 'Create'}
        onCancel={() => { form.resetFields(); this.boundActionCreators.closeDatasourceModal(); }}
        onOk={this.handleOk}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          <FormItem {...formItemLayout} label="Name">
            {form.getFieldDecorator('name', {
              initialValue: selected ? selected.name : null,
              rules: [{ required: true, message: 'Name is required' }]
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Type">
            {form.getFieldDecorator('connection.dbType', {
              initialValue: selected ? selected.connection.dbType : null,
              rules: [{ required: true, message: 'Type is required' }]
            })(
              <Select onChange={(type) => {this.optionOnChange(type)}}>
                <Option value="mysql">MySQL</Option>
                <Option value="postgresql">PostgreSQL</Option>
                <Option value="csvTextFile">csv/text file</Option>
                <Option value="xlsXlsxFile">xls/xlsx file</Option>
                <Option value="s3BucketFile">S3 bucket file</Option>
                <Option value="sqlite" disabled>SQLite</Option>
                <Option value="mssql" disabled>MSSQL</Option>
              </Select>
            )}
          </FormItem>
          { isS3Bucket &&
              <div>
                <p>Please copy following policy to your bucket permission: 
                <Tooltip placement="right" title={text} >
                  <Icon type="question-circle-o" style={{ margin: 5, cursor: 'help'}}/>
                </Tooltip>
                </p>
                <code style={{ background: '#eeeeee', padding: '1em', margin: '0.5em 0', border: '1px dashed #cccccc', borderRadius: '5px', display: 'block' }}>
                  <Button shape="circle" icon="copy" size="small" style={{position: "relative", float: "right"}} onClick={this.copyToClipboard}/>
                  <div>AWS_ACCESS_KEY_ID = {process.env.REACT_APP_AWS_ACCESS_KEY_ID}</div>
                  <div>AWS_SECRET_ACCESS_KEY = {process.env.REACT_APP_AWS_SECRET_ACCESS_KEY}</div>
                </code>
                <FormItem {...formItemLayout} label="Bucket name">
                  {form.getFieldDecorator('bucket', {
                    initialValue: null,
                    rules: [{ required: isS3Bucket && true, message: 'Bucket name is required' }]
                  })(
                    <Input/>
                  )}
                </FormItem>
                <FormItem {...formItemLayout} label="File name">
                  {form.getFieldDecorator('fileName', {
                    initialValue: null,
                    rules: [{ required: isS3Bucket && true, message: 'File name is required' }]
                  })(
                    <Input onBlur={checkS3FileType}/>
                  )}
                </FormItem>
              </div>
          }
          { (isCSV || isS3Csv) &&
            <FormItem {...formItemLayout} label="Delimiter">
              { form.getFieldDecorator('delimiter', {
                initialValue: ',',
              })(
                <Select>
                  <Option value=",">Comma ,</Option>
                  <Option value=" ">Tabs "  "</Option>
                  <Option value=";">Semi-colons ;</Option>
                  <Option value="|">Pipes |</Option>
                  <Option value="^">Carets ^</Option>
                  <Option value="~">Tildes ~</Option>
                </Select>
              )}
            </FormItem>
          }
          { isLocalFile &&
            <Dragger
              name='file'
              multiple={false}
              onChange={(e) => this.handleFileDrop(e)}
              beforeUpload = {() => false} // Prevent immediate upload upon file drop
              action='' // The uploading URL (required) however we do not make use of 
            >
              <p className="ant-upload-drag-icon">
                <Icon type="inbox"/>
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Supported file formats: csv/xls/xlsx</p>
            </Dragger>
          }
          { file && 
            <div>
            <span><Icon type='paper-clip'/>{file.name}</span> 
            </div>
          }
          { sheetnames &&
            <FormItem {...formItemLayout} label="Sheet name">
              { form.getFieldDecorator('sheetname',{
                rules: [{ required: true, message: 'Sheet name is required' }]
              })(
                <Select>
                  { sheetnames.map((option, i) => (<Option key={i} value={option}>{option}</Option>)) }
                </Select>
              )}
            </FormItem>
          }
          { this.state.error && <Alert style={{ marginTop: 10 }} message={this.state.error} type="error"/> }
          { !isFile &&
            <div>
              <FormItem {...formItemLayout} label="Host">
                {form.getFieldDecorator('connection.host', {
                  initialValue: selected ? selected.connection.host : null,
                  rules: [{ required: !isFile && true, message: 'Host is required' }]
                })(
                  <Input/>
                )}
              </FormItem>
              <FormItem {...formItemLayout} label="Database">
                {form.getFieldDecorator('connection.database', {
                  initialValue: selected ? selected.connection.database : null,
                  rules: [{ required: !isFile && true, message: 'Database is required' }]
                })(
                  <Input/>
                )}
              </FormItem>
              <FormItem {...formItemLayout} label="User">
                {form.getFieldDecorator('connection.user', {
                  initialValue: selected ? selected.connection.user : null,
                  rules: [{ required: !isFile && true, message: 'Database user is required' }]
                })(
                  <Input/>
                )}
              </FormItem>
              <FormItem {...formItemLayout} label="Password">
                {form.getFieldDecorator('connection.password', {
                  rules: [{ required: (isFile || selected) ? false : true, message: 'Database password is required' }]
                })(
                  <Input type="password" placeholder={selected && 'Change password'}/>
                )}
              </FormItem>
              <FormItem {...formItemLayout} label="Query">
                {form.getFieldDecorator('connection.query', {
                  initialValue: selected ? selected.connection.query : null,
                  rules: [{ required: isFile && true, message: 'Database query is required' }]
                })(
                  <TextArea rows={2}/>
                )}
              </FormItem>
            </div>
          }
          { error && <Alert style={{ marginTop: 10 }} message={error} type="error"/>}
        </Form>
      </Modal>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    visible, loading, error, containerId, selected, sheetnames
  } = state.datasource;
  
  return {
    visible, loading, error, containerId, selected, sheetnames
  };
}

export default connect(mapStateToProps)(Form.create()(DatasourceModal))
