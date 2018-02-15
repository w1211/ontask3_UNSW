import React from 'react';
import { Modal, Form, Input, Alert, Select, Button, Row, Tree, Cascader, Icon } from 'antd';

import './QueryBuilder.css';

const TreeNode = Tree.TreeNode;
const FormItem = Form.Item;
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

const panelLayout = {
  padding: '20px 50px 20px 20px',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  maxWidth: '600px',
  marginBottom: '20px',
  position: 'relative'
};


const ConditionGroupModal = ({ 
  form, visible, loading, error, details, conditionGroup, formState,
  onCreate, onUpdate, onCancel,
  addCondition, addFormula, deleteCondition, deleteFormula, updateFormState
}) => {
  
  // Initialize the options for the field/operator cascader
  let options = [];
  if (details) {
    const fields = [details.primaryColumn, ...details.secondaryColumns];
    options = fields.map(column => {
      return {
        value: column.field,
        label: column.field,
        children: column.type === 'text' ?
          [
            { value: '==', label: 'equal' },
            { value: '!=', label: 'not equal' }
          ]
        :
        [
          { value: '==', label: 'equal' },
          { value: '!=', label: 'not equal' },
          { value: '<', label: 'less' },
          { value: '<=', label: 'less or equal' },
          { value: '>', label: 'greater' },
          { value: '>=', label: 'greater or equal' }
        ]
      }
    });
  }

  return (
    <Modal
      visible={visible}
      title={conditionGroup ? 'Update condition group' : 'Create condition group'}
      okText={conditionGroup ? 'Update' : 'Create'}
      onCancel={() => { form.resetFields(); onCancel(); }}
      onOk={() => { handleOk(form, conditionGroup, onCreate, onUpdate); }}
      confirmLoading={loading}
    >
      <Form layout="horizontal">
        <FormItem {...formItemLayout} label="Name">
          {form.getFieldDecorator('name', {
            rules: [{ required: true, message: 'Name is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        
        <QueryBuilder 
          form={form} options={options}
          addCondition={addCondition} addFormula={addFormula} deleteCondition={deleteCondition} deleteFormula={deleteFormula}
          formState={formState}
        />

        { error && <Alert message={error} type="error"/>}
        {/* { form.getFieldsError(['conditions']).conditions && form.getFieldsError(['conditions']).conditions.length > 0 &&
          <Alert message="All fields in the query builder must be filled." type="error"/>
        } */}
        
      </Form>
    </Modal>
  )
}

const QueryBuilder = ({ form, options, formState, addCondition, addFormula, deleteCondition, deleteFormula }) => {
  return (
    <div>
      <Button onClick={(e) => { e.stopPropagation(); addCondition(); }} style={{ textAlign: 'right', marginBottom: '5px' }}>
        <Icon type="plus"/>Add Condition
      </Button>

      <Row style={{ ...panelLayout }}>
        {formState && formState.conditions && formState.conditions.length > 0 ? 
          <Tree showLine defaultExpandAll={true} className="queryBuilder" expandedKeys={formState.conditions.map((_, i) => { return i.toString()})}>
            { formState.conditions.map((condition, i) => {
              const conditionCount = formState.conditions.length;
              const formulaCount = condition.formulas.length;
              return (
                <TreeNode title={<Condition form={form} conditionCount={conditionCount} formulaCount={formulaCount} addFormula={addFormula} deleteCondition={deleteCondition} index={i}/>} key={i}>
                  { condition.formulas && condition.formulas.map((formula, j) => (
                    <TreeNode title={<Field form={form} formula={formula} i={i} j={j} options={options} formulaCount={formulaCount} deleteFormula={deleteFormula}/>} key={`${i}_${j}`}/>
                  ))}
                </TreeNode>
              )
            })}
          </Tree>
        :
          <div>Get started by adding the first condition.</div>
        }
      </Row>
    </div>
  )
}

const Condition = ({ form, index, conditionCount, formulaCount, addFormula, deleteCondition }) => {
  return (
    <div style={{ display:'flex' }}> 
      {form.getFieldDecorator(`conditions[${index}].name`, {
        rules: [{ required: true, message: 'Name is required' }]
      })(
        <Input size="small" placeholder="Condition name"/>
      )}
      <ConditionControls form={form} index={index} conditionCount={conditionCount} formulaCount={formulaCount} addFormula={addFormula} deleteCondition={deleteCondition}/>
    </div>
  );
}

const ConditionControls = ({ form, type, index, conditionCount, formulaCount, addFormula, deleteCondition }) => {
  return (
    <div style={{ display:'flex' }}> 
      {/* 
      <Dropdown overlay={
        <Menu>
          <Menu.Item key="0">Add field</Menu.Item>
          <Menu.Item key="1">Add group</Menu.Item>
        </Menu>
      } trigger={['click']}>
        <Button size="small" icon="plus" shape="circle" style={{ marginLeft:'3px' }}/>
      </Dropdown>
      */}
      <Button onClick={(e) => {  e.stopPropagation(); addFormula(index) }} size="small" icon="plus" shape="circle" style={{ marginLeft:'3px' }}/>
      {formulaCount > 1 && form.getFieldDecorator(`conditions[${index}].type`, {
        rules: [{ required: true, message: 'Type is required' }],
        initialValue: "and"
      })(
        <Select size="small" style={{ marginLeft: '3px', width: '66px' }}>
          <Option value="and">AND</Option>
          <Option value="or">OR</Option>
        </Select>
      )}
      {conditionCount > 1 && (
        <Button onClick={(e) => { e.stopPropagation(); deleteCondition(index); }} disabled={conditionCount < 2} size="small" type="danger" icon="delete" shape="circle" style={{ marginLeft:'3px' }}/>
      )}
      </div>
  );
}

const Field = ({ form, options, formula, i, j, formulaCount, deleteFormula }) => {
  return (
    <div style={{ display:'flex' }}> 
      {form.getFieldDecorator(`conditions[${i}].formulas[${j}].fieldOperator`, {
        rules: [{ required: true, message: 'Formula is required' }]
      })(
        <Cascader size="small" options={options} placeholder="Formula"/>
      )}
      {form.getFieldDecorator(`conditions[${i}].formulas[${j}].comparator`, {
        rules: [{ required: true, message: 'Comparator is required' }]
      })(
        <Input size="small" placeholder="Comparator" style={{ marginLeft:'3px' }}/>
      )}
      {formulaCount > 1 && (
        <Button onClick={(e) => { e.stopPropagation(); deleteFormula(i, j); }} size="small" type="danger" icon="delete" shape="circle" style={{ marginLeft:'3px' }}/>
      )}
      </div>
  )
}

const handleOk = (form, conditionGroup, onCreate, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    if (conditionGroup) {
      onUpdate(conditionGroup, values);
    } else {
      onCreate(values)
    }
  });
}


export default Form.create({
  onFieldsChange(props, payload) {
    props.updateFormState(payload)
  },
  // Map the form object from Redux into a list of FormField objects, where the
  // key is the field name (nested fields included)
  mapPropsToFields(props) {
    let fields = {}
    
    fields.name = Form.createFormField(
      props.formState && props.formState.name ? {
        ...props.formState.name,
        value: props.formState.name.value
      } : {}
    );
    
    if (props.formState && props.formState.conditions) {
      props.formState.conditions.forEach((condition, i) => {

          fields[`conditions[${i}].name`] = Form.createFormField(
            props.formState.conditions[i].name ? {
              ...props.formState.conditions[i].name,
              value: props.formState.conditions[i].name.value
            } : {}
          );

          fields[`conditions[${i}].type`] = Form.createFormField(
            props.formState.conditions[i].type ? {
              ...props.formState.conditions[i].type,
              value: props.formState.conditions[i].type.value
            } : {}
          );

          if (condition.formulas) {
            condition.formulas.forEach((formula, j) => {
              
              fields[`conditions[${i}].formulas[${j}].fieldOperator`] = Form.createFormField(
                props.formState.conditions[i].formulas[j].fieldOperator ? {
                  ...props.formState.conditions[i].formulas[j].fieldOperator,
                  value: props.formState.conditions[i].formulas[j].fieldOperator.value
                } : {}
              );

              fields[`conditions[${i}].formulas[${j}].comparator`] = Form.createFormField(
                props.formState.conditions[i].formulas[j].comparator ? {
                  ...props.formState.conditions[i].formulas[j].comparator,
                  value: props.formState.conditions[i].formulas[j].comparator.value
                } : {}
              );
              
            })
          }

      })
    }

    return fields;
  }
})(ConditionGroupModal)
