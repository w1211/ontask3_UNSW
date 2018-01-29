import React from 'react';
import { Form, Alert, Cascader, Row, Select, Divider, Button, Modal } from 'antd';

import './Details.css';

const confirm = Modal.confirm;
const FormItem = Form.Item;
const Option = Select.Option;

const formItemLayout = {
  style: { marginBottom: '10px' },
  labelCol: {
    xs: { span: 24 },
    sm: { span: 3 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 21 }
  },
};

const panelLayout = {
  padding: '20px 50px 20px 20px',
  background: '#fbfbfb',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  maxWidth: '600px',
  marginBottom: '20px',
  position: 'relative'
};

const secondaryColumnRender = (labels, selectedOptions) => labels.map((label, i) => {
  const option = selectedOptions[i];
  if (i === labels.length - 1) {
    return <span key={option.value}>({label})</span>;
  } else if (i === labels.length - 2) {
    return <span key={option.value}>{label} </span>;
  }
  return <span key={option.value}>{label} / </span>;
});


const handleUpdate = (form, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    // Map the cascader values to the API's expected input
    let details = {
      primaryColumn: {
        datasource: values.primaryColumn.field[0],
        field: values.primaryColumn.field[1],
        type: values.primaryColumn.type
      },
      secondaryColumns: values.secondaryColumns ? values.secondaryColumns.map(secondaryColumn => {
        return {
          datasource: secondaryColumn.field[0],
          field: secondaryColumn.field[1],
          matchesWith: secondaryColumn.field[2],
          type: secondaryColumn.type
        }
      }) : []
    } 
    onUpdate(details);
  });
}

const handleClear = (form) => {
  confirm({
    title: 'Confirm form reset',
    content: 'All changes made will be lost.',
    okText: 'Reset',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk() {
      form.resetFields();
    }
  });
}

const Details = ({ 
  form, loading, error,
  datasources, details,
  addSecondaryColumn, deleteSecondaryColumn, onUpdate
}) => (
  <Form layout="horizontal">
    <h3>Primary column</h3>
    <Row style={{ ...panelLayout }}>
      <FormItem
        {...formItemLayout}
        label="Field"
      >
        {form.getFieldDecorator('primaryColumn.field', {
          initialValue: details ? [details.primaryColumn.datasource, details.primaryColumn.field] : [],
          rules: [{ required: true, message: 'Field is required' }]
        })(
          <Cascader placeholder='' options={[
            { value: 'Datasource', label: 'Datasource', disabled: true },
            ...datasources.map((datasource) => {
              return { 
                value: datasource.id, 
                label: datasource.name, 
                children: [
                  { value: 'field', label: 'Field', disabled: true },
                  ...datasource.fields.map(field => { return { value: field, label: field } } )
                ]
              }
            })
            ]}>
          </Cascader>
        )}
      </FormItem>
      <FormItem
        {...formItemLayout}
        label="Type"
      >
        {form.getFieldDecorator('primaryColumn.type', {
          initialValue: details ? details.primaryColumn.type: null,
          rules: [{ required: true, message: 'Type is required' }]
        })(
          <Select>
            <Option value="number">Number</Option>
            <Option value="text">Text</Option>
          </Select>
        )}
      </FormItem>
    </Row>

    <Divider dashed />

    <h3>
      Secondary columns
      <Button onClick={() => addSecondaryColumn()} style={{ marginLeft: '10px' }} shape="circle" icon="plus" />
    </h3>
    { details && details.secondaryColumns.length > 0 ?
      details.secondaryColumns.map((secondaryColumn, i) => {
        return <Row style={{ ...panelLayout, marginTop:'10px' }} key={i}>
          <FormItem
            {...formItemLayout}
            label="Field"
          >
            {form.getFieldDecorator(`secondaryColumns[${i}].field`, {
              initialValue: secondaryColumn.datasource && secondaryColumn.field ? [secondaryColumn.datasource, secondaryColumn.field, secondaryColumn.matchesWith] : [],
              rules: [{ required: true, message: 'Field is required' }]
            })(
              <Cascader displayRender={secondaryColumnRender} placeholder='' options={[
                { value: 'datasource', label: 'Datasource', disabled: true },
                ...datasources.map((datasource) => {
                  let children = datasource.fields.map(field => { return { 
                    value: field, 
                    label: field
                  }});
                  return {
                    value: datasource.id, 
                    label: datasource.name,
                    children: [
                      { value: 'field', label: 'Field', disabled: true },
                      ...children.map(child => {
                        return {
                          ...child, 
                          children: [
                            { value: 'match', label: 'Matches With', disabled: true },
                            ...children.filter(innerChild => innerChild.value !== child.value)
                          ]
                        }
                      })
                    ]
                  }
                })
              ]}>
              </Cascader>
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="Type"
          >
            {form.getFieldDecorator(`secondaryColumns[${i}].type`, {
              initialValue: secondaryColumn.type,
              rules: [{ required: true, message: 'Type is required' }]
            })(
              <Select>
                <Option value="number">Number</Option>
                <Option value="text">Text</Option>
                <Option value="date">Date</Option>
              </Select>
            )}
          </FormItem>
          <Button onClick={() => deleteSecondaryColumn(i)} shape="circle" icon="delete" type="danger" style={{ position: 'absolute', top: 10, right: 10 }}/>
        </Row>
      })
    : 
      <p style={{ margin: '1em 0' }}>Get started by adding the first secondary column.</p>
    }

    <Divider dashed />

    { error && <Alert message={error} type="error"/>}
    <Button style={{ marginRight: '10px' }} size="large" onClick={() => handleClear(form)}>Clear Changes</Button>
    <Button loading={loading} type="primary" size="large" onClick={() => handleUpdate(form, onUpdate)}>Update Details</Button>
  </Form>
)

export default Form.create()(Details)
