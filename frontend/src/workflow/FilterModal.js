import React from 'react';
import { Modal, Form, Input, Alert, Select, Button, Row, Tree, Cascader } from 'antd';

import './QueryBuilder.css';

const TreeNode = Tree.TreeNode;
const Option = Select.Option;

const panelLayout = {
  padding: '20px 50px 20px 20px',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  maxWidth: '600px',
  marginBottom: '20px',
  position: 'relative'
};


const FilterModal = ({ 
  form, visible, loading, error, details, conditionGroup, formState,
  onCreate, onUpdate, onCancel,
  addCondition, addFormula, deleteFormula, updateFormState
}) => {
  
  // Initialize the options for the field/operator cascader
  const options = details ? details.secondaryColumns.map(secondaryColumn => {
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
      title='Update filter'
      okText='Update'
      onCancel={() => { form.resetFields(); onCancel(); }}
      onOk={() => { handleOk(form, onUpdate); }}
      confirmLoading={loading}
    >
      <Form layout="horizontal">

        <QueryBuilder 
          form={form} options={options}
          addFormula={addFormula} deleteFormula={deleteFormula}
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

const QueryBuilder = ({ form, options, formState, addFormula, deleteFormula }) => {
  const formulaCount = formState ? formState.formulas.length : 0;
  return (
    <div>
      <Row style={{ ...panelLayout }}>
        <Tree showLine defaultExpandAll={true} className="queryBuilder">
          <TreeNode title={<ConditionControls form={form} formulaCount={formulaCount} addFormula={addFormula}/>}>
            { formState && formState.formulas.map((formula, i) => {
              return <TreeNode title={<Field form={form} formula={formula} i={i} options={options} formulaCount={formulaCount} deleteFormula={deleteFormula}/>} key={i}/>
            })}
          </TreeNode>
        </Tree>
      </Row>
    </div>
  )
}

const ConditionControls = ({ form, type, index, formulaCount, addFormula }) => {
  return (
    <div style={{ display:'flex' }}> 
      <Button onClick={(e) => {  e.stopPropagation(); addFormula(index) }} size="small" icon="plus" style={{ marginLeft:'3px' }}>Add formula</Button>
      {formulaCount > 1 && form.getFieldDecorator(`type`, {
        rules: [{ required: true, message: 'Type is required' }],
        initialValue: "and"
      })(
        <Select size="small" style={{ marginLeft: '3px', width: '66px' }}>
          <Option value="and">AND</Option>
          <Option value="or">OR</Option>
        </Select>
      )}
      </div>
  );
}

const Field = ({ form, options, formula, i, formulaCount, deleteFormula }) => {
  return (
    <div style={{ display:'flex' }}> 
      {form.getFieldDecorator(`formulas[${i}].fieldOperator`, {
        rules: [{ required: true, message: 'Formula is required' }]
      })(
        <Cascader size="small" options={options} placeholder="Formula"/>
      )}
      {form.getFieldDecorator(`formulas[${i}].comparator`, {
        rules: [{ required: true, message: 'Comparator is required' }]
      })(
        <Input size="small" placeholder="Comparator" style={{ marginLeft:'3px' }}/>
      )}
      <Button onClick={(e) => { e.stopPropagation(); deleteFormula(i); }} size="small" type="danger" icon="delete" shape="circle" style={{ marginLeft:'3px' }}/>
      </div>
  )
}

const handleOk = (form, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) return;
    onUpdate(values);
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
    
    if (props.formState) {

      fields[`type`] = Form.createFormField(
        props.formState.type ? {
          ...props.formState.type,
          value: props.formState.type.value
        } : {}
      );
      
      props.formState.formulas.forEach((formula, j) => {
        fields[`formulas[${j}].fieldOperator`] = Form.createFormField(
          props.formState.formulas[j].fieldOperator ? {
            ...props.formState.formulas[j].fieldOperator,
            value: props.formState.formulas[j].fieldOperator.value
          } : {}
        );

        fields[`formulas[${j}].comparator`] = Form.createFormField(
          props.formState.formulas[j].comparator ? {
            ...props.formState.formulas[j].comparator,
            value: props.formState.formulas[j].comparator.value
          } : {}
        );
      })

    }

    return fields;
  }
})(FilterModal)
