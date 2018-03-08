import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Input, Alert, Select, Button, Upload, Icon} from 'antd';

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
  }

  handleOk = () => {
    const { form, selected, containerId } = this.props;
    const { file, error } = this.state;
    
    form.validateFields((err, values) => {
      if (err || error) return;

      if (values.connection.dbType === 'file' && !file && !selected) {
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

  handleFileDrop(e) {
    const file = e.file;

    const error = this.validateFile(file);
    this.setState({
      error, // If there are errors, save them to the state so they can be shown in the interface
      file: error ? null : file // If there are no errors, then save the file in the state
    });
  }

  validateFile = (file, callback) => {
    // Validate file type
    const fileName = file.name.split('.');
    const extension = fileName[fileName.length - 1].toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(extension)) return 'Only csv, xls and xlsx file types supported';

    // Validate file size
    const fileSize = file.size / Math.pow(1024, 2); // File size in MB
    const sizeLimit = 2; // Size limit in MB

    if (fileSize > 2) return 'File must not be larger than 2MB';
  };

  render() {
    const { dispatch, selected, visible, loading, error, form } = this.props;

    const isFile = form.getFieldValue('connection.dbType') === 'file';

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

          <FormItem {...formItemLayout} label="Datasource type">
            {form.getFieldDecorator('connection.dbType', {
              initialValue: selected ? selected.connection.dbType : null,
              rules: [{ required: true, message: 'Datasource type is required' }]
            })(
              <Select onChange={(type) => { if (type !== 'file') this.setState({ file: null }); }}>
                <Option value="mysql">MySQL</Option>
                <Option value="postgresql">PostgreSQL</Option>
                <Option value="file">External file</Option>
                <Option value="sqlite" disabled>SQLite</Option>
                <Option value="mssql" disabled>MSSQL</Option>
              </Select>
            )}
          </FormItem>
          
          { isFile ?
            <div>
              <FormItem {...formItemLayout} label="Delimiter">
                {form.getFieldDecorator('delimiter', {
                  initialValue: ','
                })(
                  <Input placeholder="Default delimiter ','"/>
                )}
              </FormItem>

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

              { this.state.error && <Alert style={{ marginTop: 10 }} message={this.state.error} type="error"/> }

              { this.state.file && <span><Icon type='paper-clip'/>{this.state.file.name}</span> }
            </div>
          :
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
          { error && <Alert message={error} type="error"/>}
        </Form>
      </Modal>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    visible, loading, error, containerId, selected
  } = state.datasource;
  
  return {
    visible, loading, error, containerId, selected
  };
}

export default connect(mapStateToProps)(Form.create()(DatasourceModal))
