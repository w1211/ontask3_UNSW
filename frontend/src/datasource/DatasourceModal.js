import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {Button, Modal, Form, Input, Alert, Select, Upload, Icon, Tooltip, message } from 'antd';

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

  handleFileDrop = (e) => {
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

  checkS3FileType = () => {
    const { form } = this.props;

    let fileName = form.getFieldValue('connection.fileName');
    if (!fileName) return;

    fileName = fileName.split('.');
    const extension = fileName[fileName.length - 1].toLowerCase();

    if(['xlsx', 'xls'].includes(extension)){
      this.boundActionCreators.fetchSheetnames(null, {
        'bucket': form.getFieldValue('connection.bucket'), 
        'fileName': form.getFieldValue('connection.fileName')
      });
      this.setState({isS3Csv:false});
    }
    else if(['csv', 'txt'].includes(extension)){
      this.setState({isS3Csv:true});
    }
    else {
      this.setState({isS3Csv:false});
    }
  }

  render() {
    const { selected, visible, loading, error, form, sheetnames } = this.props;
    const { fileType, file, isS3Csv} = this.state
    const isFile = ['xlsXlsxFile', 'csvTextFile', 's3BucketFile'].includes(fileType);
    const isCSV = fileType === 'csvTextFile';
    const isLocalFile = ['xlsXlsxFile', 'csvTextFile'].includes(fileType);
    const isS3Bucket = fileType === 's3BucketFile';
    
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

          { isS3Bucket && <S3Bucket form={form} checkS3FileType={this.checkS3FileType} selected={selected}/> }

          { (isCSV || isS3Csv) && <Delimiter form={form} selected={selected}/> }

          { isLocalFile && <LocalFile form={form} onChange={this.handleFileDrop} selected={selected}/> }
          
          { file && 
            <div>
              <span><Icon type='paper-clip'/>{file.name}</span> 
            </div>
          }

          { sheetnames && <SheetNames form={form} sheetnames={sheetnames} selected={selected}/> }
          
          { !isFile && <ConnectionSettings form={form} selected={selected} isFile={isFile}/> }

          { this.state.error && <Alert style={{ marginTop: 10 }} message={this.state.error} type="error"/> }
          { error && <Alert style={{ marginTop: 10 }} message={error} type="error"/>}
        </Form>
      </Modal>
    );
  };  

};

const S3Bucket = ({ form, checkS3FileType, selected }) => {
  const bucketName = form.getFieldValue('connection.bucket') ? form.getFieldValue('connection.bucket') : (selected && selected.connection.bucket) ? selected.connection.bucket : 'YOUR_BUCKET_NAME'; 
  const fileName =  form.getFieldValue('connection.fileName') ? form.getFieldValue('connection.fileName') : (selected && selected.connection.fileName) ? selected.connection.fileName : 'YOUR_FILE_NAME'; 

  const permission = {
    'Version': '2012-10-17',
    'Statement': [{
      'Sid': 'Ontask access permission',
      'Effect': 'Allow',
      'Principal': {
        'AWS': [ process.env.REACT_APP_AWS_ID ]
      },
      'Action': [
        's3:GetObject'
      ],
      'Resource': [
        `arn:aws:s3:::${bucketName}/${fileName}`
      ]
    }]
  };

  const copyToClipboard = () => {
    var textField = document.createElement('textarea');
    textField.innerHTML = JSON.stringify(permission, null, 2);
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
    message.success('Copied bucket policy to clipboard');
  }

  return (
    <div>
      <FormItem {...formItemLayout} label="Bucket name">
        {form.getFieldDecorator('connection.bucket', {
          initialValue: selected ? selected.connection.bucket : null,
          rules: [{ required: true, message: 'Bucket name is required' }]
        })(
          <Input/>
        )}
      </FormItem>
                  
      <FormItem {...formItemLayout} label="File name">
        {form.getFieldDecorator('connection.fileName', {
          initialValue: selected ? selected.connection.fileName : null,
          rules: [{ required: true, message: 'File name is required' }]
        })(
          <Input onBlur={checkS3FileType}/>
        )}
      </FormItem>

      <p>
        Please copy following policy to your bucket permission: 
        <Tooltip placement="right" title="Adding this policy to your bucket permission is neccessary in order to provide OnTask with access to your file." >
          <Icon type="question-circle-o" style={{ margin: 5, cursor: 'help'}}/>
        </Tooltip>
      </p>
      <code style={{ background: '#eeeeee', padding: '1em', margin: '0.5em 0', border: '1px dashed #cccccc', borderRadius: '5px', display: 'block' }}>
        <Button shape="circle" icon="copy" size="small" style={{position: "relative", float: "right"}} onClick={copyToClipboard}/>
        <pre style={{ fontSize: '0.75em', margin: 0 }}>
          { JSON.stringify(permission, null, 2) }
        </pre>
      </code>
    </div>
  )
};

const Delimiter = ({ form, selected }) => (
  <FormItem {...formItemLayout} label="Delimiter">
    { form.getFieldDecorator('connection.delimiter', {
      initialValue: selected ? selected.connection.delimiter : ',',
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
);

const LocalFile = ({ form, onChange }) => (
  <Dragger
    name='file'
    multiple={false}
    onChange={onChange}
    beforeUpload = {() => false} // Prevent immediate upload upon file drop
    action='' // The uploading URL (required) however we do not make use of 
  >
    <p className="ant-upload-drag-icon">
      <Icon type="inbox"/>
    </p>
    <p className="ant-upload-text">Click or drag file to this area to upload</p>
    <p className="ant-upload-hint">Supported file formats: csv/xls/xlsx</p>
  </Dragger>
);

const SheetNames = ({ form, sheetnames, selected }) => (
  <FormItem {...formItemLayout} label="Sheet name">
    { form.getFieldDecorator('connection.sheetname',{
      rules: [{ required: true, message: 'Sheet name is required' }],
      initialValue: selected ? selected.connection.sheetname : null,
    })(
      <Select>
        { sheetnames.map((option, i) => (<Option key={i} value={option}>{option}</Option>)) }
      </Select>
    )}
  </FormItem>
);

const ConnectionSettings = ({ form, selected }) => (
  <div>
    <FormItem {...formItemLayout} label="Host">
      {form.getFieldDecorator('connection.host', {
        initialValue: selected ? selected.connection.host : null,
        rules: [{ required: true, message: 'Host is required' }]
      })(
        <Input/>
      )}
    </FormItem>

    <FormItem {...formItemLayout} label="Database">
      {form.getFieldDecorator('connection.database', {
        initialValue: selected ? selected.connection.database : null,
        rules: [{ required: true, message: 'Database is required' }]
      })(
        <Input/>
      )}
    </FormItem>

    <FormItem {...formItemLayout} label="User">
      {form.getFieldDecorator('connection.user', {
        initialValue: selected ? selected.connection.user : null,
        rules: [{ required: true, message: 'Database user is required' }]
      })(
        <Input/>
      )}
    </FormItem>

    <FormItem {...formItemLayout} label="Password">
      {form.getFieldDecorator('connection.password', {
        rules: [{ required: !selected, message: 'Database password is required' }]
      })(
        <Input type="password" placeholder={selected && 'Change password'}/>
      )}
    </FormItem>

    <FormItem {...formItemLayout} label="Query">
      {form.getFieldDecorator('connection.query', {
        initialValue: selected ? selected.connection.query : null,
        rules: [{ required: true, message: 'Database query is required' }]
      })(
        <TextArea rows={2}/>
      )}
    </FormItem>
  </div>
);
  

const mapStateToProps = (state) => {
  const {
    visible, loading, error, containerId, selected, sheetnames
  } = state.datasource;
  
  return {
    visible, loading, error, containerId, selected, sheetnames
  };
}

export default connect(mapStateToProps)(Form.create()(DatasourceModal))
