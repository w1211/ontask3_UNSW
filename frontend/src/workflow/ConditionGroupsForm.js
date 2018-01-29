import React from 'react';

import { Modal, Form, Input, Alert, Select, Button, Row, Tree, Cascader, Icon } from 'antd';

import './ConditionGroupsForm.css';

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

const ConditionGroupsForm = ({ 
  form, visible, loading, error,
  onChange, onCreate, onUpdate, onCancel, onDelete,
  matrix, groups, selected,
  addCondition, addFormula, deleteCondition, deleteFormula,
  updateConditionGroupForm, conditionGroupForm
}) => {
  
  // Initialize the options for the field/operator cascader
  const options = matrix ? matrix.secondaryColumns.map(secondaryColumn => {
    return {
      value: secondaryColumn.field,
      label: secondaryColumn.field,
      children: secondaryColumn.type === 'text' ?
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
  }) : [];

  return (
    <Modal
      visible={visible}
      title='Condition Groups'
      okText={selected ? 'Update' : 'Create'}
      onCancel={() => { form.resetFields(); onCancel(); }}
      onOk={() => { handleOk(form, selected, onCreate, onUpdate) }}
      confirmLoading={loading}
    >
      <Form layout="horizontal">
        <FormItem {...formItemLayout} label="Condition Group">
          <GroupPicker form={form} onChange={onChange} onDelete={onDelete} groups={groups} selected={selected}/>
        </FormItem>
        
        <FormItem {...formItemLayout} label="Name">
          {form.getFieldDecorator('name', {
            rules: [{ required: true, message: 'Name is required' }]
          })(
            <Input/>
          )}
        </FormItem>

        <Button onClick={(e) => { e.stopPropagation(); addCondition()}} style={{textAlign: 'right', marginBottom: '5px'}}>
          <Icon type="plus"/>Add Condition
        </Button>
        
        <QueryBuilder 
          form={form} options={options}
          addFormula={addFormula} deleteCondition={deleteCondition} deleteFormula={deleteFormula}
          conditionGroupForm={conditionGroupForm} 
        />

        { error && <Alert message={error} type="error"/>}
        {/* { form.getFieldsError(['conditions']).conditions && form.getFieldsError(['conditions']).conditions.length > 0 &&
          <Alert message="All fields in the query builder must be filled." type="error"/>
        } */}
        
      </Form>
    </Modal>
  )
}

const GroupPicker = ({ form, onChange, onDelete, groups, selected }) => {
  return (
    <div style={{display: 'inline-flex', width: '100%'}}>
      <Select value={selected ? selected.name : null} onChange={(value) => { handleChange(form, onChange, groups, value) }}>
        <Option value={null} key={null}><i>Create new condition group</i></Option>
        { groups && groups.map((group, index) => (
          <Option value={group.name} key={index}>{group.name}</Option>
        ))}
      </Select>
      <Button disabled={selected ? false : true} onClick={() => { onDelete(groups.findIndex(group => group.name === selected.name)) }} type="danger" icon="delete" style={{marginLeft: '10px'}}/>
    </div>
  )
}

const handleChange = (form, onChange, groups, value) => {
  form.resetFields();
  let selected = groups.find(group => { return group.name === value });
  onChange(selected);
}

const QueryBuilder = ({ 
  form, options,
  addFormula, deleteCondition, deleteFormula,
  conditionGroupForm
}) => {
  return (
    
    <Row style={{...panelLayout}}>
      {conditionGroupForm && conditionGroupForm.conditions && conditionGroupForm.conditions.length > 0 ? 
        <Tree showLine defaultExpandAll={true} className="queryBuilder" expandedKeys={conditionGroupForm.conditions.map((_, i) => { return i.toString()})}>
          { conditionGroupForm.conditions.map((condition, i) => {
            const conditionCount = conditionGroupForm.conditions.length;
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
  )
}

const Condition = ({ form, index, conditionCount, formulaCount, addFormula, deleteCondition }) => {
  return (
    <div style={{display:'flex'}}> 
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
    <div style={{display:'flex'}}> 
      {/* 
      <Dropdown overlay={
        <Menu>
          <Menu.Item key="0">Add field</Menu.Item>
          <Menu.Item key="1">Add group</Menu.Item>
        </Menu>
      } trigger={['click']}>
        <Button size="small" icon="plus" shape="circle" style={{marginLeft:'3px'}}/>
      </Dropdown>
      */}
      <Button onClick={(e) => {  e.stopPropagation(); addFormula(index) }} size="small" icon="plus" shape="circle" style={{marginLeft:'3px'}}/>
      {formulaCount > 1 && form.getFieldDecorator(`conditions[${index}].type`, {
        rules: [{ required: true, message: 'Type is required' }],
        initialValue: "and"
      })(
        <Select size="small" style={{marginLeft: '3px', width: '66px'}}>
          <Option value="and">AND</Option>
          <Option value="or">OR</Option>
        </Select>
      )}
      {conditionCount > 1 && (
        <Button onClick={(e) => {  e.stopPropagation(); deleteCondition(index) }} disabled={conditionCount < 2} size="small" type="danger" icon="delete" shape="circle" style={{marginLeft:'3px'}}/>
      )}
      </div>
  );
}

const Field = ({ form, options, formula, i, j, formulaCount, deleteFormula }) => {
  return (
    <div style={{display:'flex'}}> 
      {form.getFieldDecorator(`conditions[${i}].formulas[${j}].fieldOperator`, {
        rules: [{ required: true, message: 'Formula is required' }]
      })(
        <Cascader size="small" options={options} placeholder="Formula"/>
      )}
      {form.getFieldDecorator(`conditions[${i}].formulas[${j}].comparator`, {
        rules: [{ required: true, message: 'Comparator is required' }]
      })(
        <Input size="small" placeholder="Comparator" style={{marginLeft:'3px'}}/>
      )}
      {formulaCount > 1 && (
        <Button onClick={(e) => {  e.stopPropagation(); deleteFormula(i, j) }} size="small" type="danger" icon="delete" shape="circle" style={{marginLeft:'3px'}}/>
      )}
      </div>
  )
}

const handleOk = (form, selected, onCreate, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    if (selected) {
      onUpdate(selected, values);
    } else {
      onCreate(values)
    }
  });
}


export default Form.create({
  onFieldsChange(props, payload) {
    props.updateConditionGroupForm(payload)
  },
  // Map the form object from Redux into a list of FormField objects, where the
  // key is the field name (nested fields included)
  mapPropsToFields(props) {
    let fields = {}
    
    fields.name = Form.createFormField(
      props.conditionGroupForm && props.conditionGroupForm.name ? {
        ...props.conditionGroupForm.name,
        value: props.conditionGroupForm.name.value
      } : {}
    );
    
    if (props.conditionGroupForm && props.conditionGroupForm.conditions) {
      props.conditionGroupForm.conditions.forEach((condition, i) => {

          fields[`conditions[${i}].name`] = Form.createFormField(
            props.conditionGroupForm.conditions[i].name ? {
              ...props.conditionGroupForm.conditions[i].name,
              value: props.conditionGroupForm.conditions[i].name.value
            } : {}
          );

          fields[`conditions[${i}].type`] = Form.createFormField(
            props.conditionGroupForm.conditions[i].type ? {
              ...props.conditionGroupForm.conditions[i].type,
              value: props.conditionGroupForm.conditions[i].type.value
            } : {}
          );

          if (condition.formulas) {
            condition.formulas.forEach((formula, j) => {
              
              fields[`conditions[${i}].formulas[${j}].fieldOperator`] = Form.createFormField(
                props.conditionGroupForm.conditions[i].formulas[j].fieldOperator ? {
                  ...props.conditionGroupForm.conditions[i].formulas[j].fieldOperator,
                  value: props.conditionGroupForm.conditions[i].formulas[j].fieldOperator.value
                } : {}
              );

              fields[`conditions[${i}].formulas[${j}].comparator`] = Form.createFormField(
                props.conditionGroupForm.conditions[i].formulas[j].comparator ? {
                  ...props.conditionGroupForm.conditions[i].formulas[j].comparator,
                  value: props.conditionGroupForm.conditions[i].formulas[j].comparator.value
                } : {}
              );
              
            })
          }

      })
    }

    return fields;
  }
})(ConditionGroupsForm)
