import React from 'react';

import { Modal, Form, Input, Alert, Select, Button } from 'antd';

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

const handleOk = (form, container, datasource, onCreate, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    if (datasource) {
      onUpdate(container, datasource, values);
    } else {
      onCreate(container, values)
    }
  });
}

const handleChange = (selected, onChange, form, datasources) => {
  form.resetFields();
  selected = datasources.find(datasource => {return datasource._id['$oid'] === selected});
  onChange(selected);
}

const DatasourceForm = ({ form, container, datasource, visible, loading, onChange, onCancel, onCreate, onUpdate, onDelete, error }) => (
  <Modal
    visible={visible}
    title='Datasources'
    okText={datasource ? 'Update' : 'Create'}
    onCancel={onCancel}
    onOk={() => {handleOk(form, container, datasource, onCreate, onUpdate)}}
    confirmLoading={loading}
  >
    <Form layout="horizontal">
      <FormItem
        {...formItemLayout}
        label="Datasource"
      >
        <div style={{display: 'inline-flex', width: '100%'}}>
          <Select value={datasource ? datasource._id['$oid'] : null} onChange={(selected) => {handleChange(selected, onChange, form, container.datasources)}} defaultValue={null}>
            <Option value={null} key={0}><i>Create new datasource</i></Option>
            { container ? container.datasources.map((datasource) => {
              return <Option value={datasource._id['$oid']} key={datasource.name}>{datasource.name}</Option>
            }) : ''}
          </Select>
          <Button disabled={datasource ? false : true} onClick={() => {onDelete(datasource)}} type="danger" icon="delete" style={{marginLeft: '10px'}}/>
        </div>
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
      <FormItem
        {...formItemLayout}
        label="Database type"
      >
        {form.getFieldDecorator('connection.dbType', {
          initialValue: datasource ? datasource.connection.dbType : null,
          rules: [{ required: true, message: 'Database type is required' }]
        })(
          <Select>
            <Option value="mysql">MySQL</Option>
            <Option value="postgresql">PostgreSQL</Option>
            <Option value="sqlite" disabled>SQLite</Option>
            <Option value="mssql" disabled>MSSQL</Option>
          </Select>
        )}
      </FormItem>
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
      { error && <Alert message={error} type="error"/>}
    </Form>
  </Modal>
)

export default Form.create()(DatasourceForm)
