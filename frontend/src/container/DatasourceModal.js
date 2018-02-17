import React from 'react';

import { Modal, Form, Input, Alert, Select, Button, Upload, Icon, message} from 'antd';

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};


const handleOk = (form, containerId, datasource, onCreate, onUpdate, uploadingFile) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    if (datasource) {
      values['dbType'] = values.connection.dbType;
      onUpdate(datasource.id, values, uploadingFile);
    } else {
      values['dbType'] = values.connection.dbType;
      if (uploadingFile===undefined && (values.connection.dbType==='csvTextFile' || values.connection.dbType==='xlsXlsxFile')) {
        message.error('Please add file');
      }else{
        onCreate(containerId, values, uploadingFile)
      }
    }
  });
}

const handleChange = (selectedId, onChange, form, datasources) => {
  form.resetFields();
  if(selectedId){
    const datasource = datasources.find(datasource => { return datasource.id === selectedId });
    if(datasource){
      if(datasource && datasource.connection.dbType==='csvTextFile'){
        onChange(datasource, true, true);
      }
      else if(datasource && datasource.connection.dbType==='xlsXlsxFile'){
        onChange(datasource, true, false);
      }
      else{
        onChange(datasource, false, false);
      }
    }
  }
  else{
    onChange(null, false, false);
  }

}

const handleDatasourceTypeSelction = (selected, onSelect) => {
  if(selected==='csvTextFile'){
    onSelect(true, true);
  }
  else if(selected==='xlsXlsxFile'){
    onSelect(true, false);
  }
  else{
    onSelect(false, false);
  }
}

//actions for interacting with datasource form uploading file list
const Dragger = Upload.Dragger;

const getExtension = (filename) => {
    let parts = filename.split('.');
    return parts[parts.length - 1];
}

const isValidFile = (filename) => {
    let ext = getExtension(filename);
    switch (ext.toLowerCase()) {
      case 'csv':
      case 'xlsx':
      case 'xls':
        return true;
      default:
        return false;
    }
}

const fileValidation = (file) => {
  if (!isValidFile(file.name)) {
    message.error('You can only upload csv/xlsx/xls file!');
  }
  const isLt2G = file.size / (1024*1024) < 2;
  if (!isLt2G) {
    message.error('File must smaller than 2GB!');
  }
  return isValidFile && isLt2G;
};

const handleDraggerChange = (info, addUploadingFile, getSheetnames) => {
  if (fileValidation(info.file)){
    if(getExtension(info.file.name)==='xlsx'||getExtension(info.file.name)==='xls'){
      getSheetnames(info.file)
    }
    addUploadingFile(info.file);
  }
};

const DatasourceModal = ({
  form, visible, loading, error, containerId, datasources,
  datasource, onChange, onCreate, onUpdate, onCancel, onDelete,
  uploadingFile, isExternalFile, isCsvTextFile, addUploadingFile, onSelect,
  getSheetnames, sheetnames
}) => (
  <Modal
    visible={visible}
    title='Datasources'
    okText={datasource ? 'Update' : 'Create'}
    onCancel={() => { form.resetFields(); onCancel(); }}
    onOk={() => { handleOk(form, containerId, datasource, onCreate, onUpdate, uploadingFile) }}
    confirmLoading={loading}
  >
      <Form layout="horizontal">
        <FormItem
          {...formItemLayout}
          label="Datasource"
        >
          <div style={{ display: 'inline-flex', width: '100%' }}>
            <Select value={datasource ? datasource.id : null} onChange={(selected) => { handleChange(selected, onChange, form, datasources) }} defaultValue={null}>
              <Option value={null} key={0}><i>Create new datasource</i></Option>
              { datasources ? datasources.map((datasource) => {
                return <Option value={datasource.id} key={datasource.name}>{datasource.name}</Option>
              }) : ''}
            </Select>
            <Button disabled={datasource ? false : true} onClick={() => { onDelete(datasource.id) }} type="danger" icon="delete" style={{ marginLeft: '10px' }}/>
          </div>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Datasource type"
        >
          {form.getFieldDecorator('connection.dbType', {
            initialValue: datasource ? datasource.connection.dbType : null,
            rules: [{ required: true, message: 'Datasource type is required' }]
          })(
            <Select onChange={(selected) => handleDatasourceTypeSelction(selected, onSelect)}>
              <Option value="mysql">MySQL</Option>
              <Option value="postgresql">PostgreSQL</Option>
              <Option value="csvTextFile">csv/text file</Option>
              <Option value="xlsXlsxFile">xls/xlsx file</Option>
              <Option value="sqlite" disabled>SQLite</Option>
              <Option value="mssql" disabled>MSSQL</Option>
            </Select>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Name"
        >
          {form.getFieldDecorator('name', {
            initialValue: datasource ? datasource.name : null,
            rules: [{ required: true, message: 'Name is required' }]
          })(
            <Input/>
          )}
        </FormItem>
      {isCsvTextFile ? 
        <div>
        <FormItem
          {...formItemLayout}
          label="Delimiter"
        >
          {form.getFieldDecorator('delimiter', {
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
        </div>
        :
        <div></div>
        }
      {isExternalFile?
      <div>
        <Dragger
          name = 'file'
          multiple = {false}
          action = ''
          onChange = {(info) => handleDraggerChange(info, addUploadingFile, getSheetnames)}
          beforeUpload = {() => {return false}}
        >
          <p className="ant-upload-drag-icon">
            <Icon type="inbox" />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">Support file format: csv/xls/xlsx.</p>
        </Dragger>
        {uploadingFile?
        <div>
          <span><Icon type='paper-clip'/>{uploadingFile.name}</span>
          {sheetnames &&
            <FormItem
              {...formItemLayout}
              label="Sheet name"
            >
              {form.getFieldDecorator('sheetname',{
                rules: [{ required: true, message: 'Sheet name is required' }]
              })(
                <Select>
                  {sheetnames.map(option => {
                    return(<Option value={option}>{option}</Option>)
                  })}
                </Select>
              )}
            </FormItem>
          }
          </div>
          :
          <div></div>
        }
      </div>
      :
      <div>
        <FormItem
          {...formItemLayout}
          label="Host"
        >
          {form.getFieldDecorator('connection.host', {
            initialValue: datasource ? datasource.connection.host : null,
            rules: [{ required: true, message: 'Host is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Database"
        >
          {form.getFieldDecorator('connection.database', {
            initialValue: datasource ? datasource.connection.database : null,
            rules: [{ required: true, message: 'Database is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="User"
        >
          {form.getFieldDecorator('connection.user', {
            initialValue: datasource ? datasource.connection.user : null,
            rules: [{ required: true, message: 'Database user is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Password"
        >
          {form.getFieldDecorator('connection.password', {
            rules: [{ required: datasource ? false : true, message: 'Database password is required' }]
          })(
            <Input type="password" placeholder={datasource ? 'Change password' : ''}/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Query"
        >
          {form.getFieldDecorator('connection.query', {
            initialValue: datasource ? datasource.connection.query : null,
            rules: [{ required: true, message: 'Database query is required' }]
          })(
            <TextArea rows={2}/>
          )}
        </FormItem>
      </div>
    }
    { error && <Alert message={error} type="error"/>}
    </Form>
    </Modal>
)

export default Form.create()(DatasourceModal)
