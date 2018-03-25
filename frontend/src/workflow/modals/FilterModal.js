import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Alert, Row, Tree, Select, Button, Input, Cascader } from 'antd';

import * as WorkflowActionCreators from '../WorkflowActions';

import panelLayout from '../../shared/panelLayout';
import './QueryBuilder.css';

const TreeNode = Tree.TreeNode;
const Option = Select.Option;


class FilterModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch);
  }

  handleOk = () => {
    const { form, workflow } = this.props;
    form.validateFields((err, values) => {
      if (err) return;
      this.boundActionCreators.updateFilter(workflow.id, values);
    })
  }

  render() {
    const { filterModalVisible, form, formState, modalLoading, modalError, workflow } = this.props;

    if (!workflow) return null;
    
    const options = workflow.view.columns.map(column => {
      const field = column.label ? column.label : column.field;
      return {
        value: field,
        label: field,
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
      };
    });

    let hasError; // Flag used to show an error that formulas must not be incomplete
    let formErrors = form.getFieldsError();
    if ('formulas' in formErrors) {
      // If an error is not present in a particular field, Ant Design stores the error value as undefined
      // We can easily remove these undefined errors by using JSON.parse(JSON.stringify(obj))
      formErrors = JSON.parse(JSON.stringify(formErrors.formulas));
      // Therefore, if there are actually keys present in the object, then there must be an error
      formErrors.forEach(field => { if (Object.keys(field).length > 0) hasError = true });
    }
    
    return (
      <Modal
        visible={filterModalVisible}
        title='Update filter'
        okText='Update'
        onCancel={this.boundActionCreators.closeFilterModal}
        onOk={this.handleOk}
        confirmLoading={modalLoading}
      >
        <Form layout="horizontal">
          <QueryBuilder
            form={form}
            options={options}
            formState={formState}
            addFormula={this.boundActionCreators.addFormulaToFilter}
            deleteFormula={this.boundActionCreators.deleteFormulaFromFilter}
          />

          { modalError && <Alert message={modalError} type="error"/> }
          { hasError && <Alert message="Formulas cannot be incomplete" type="error"/> }
    
        </Form>
      </Modal>
    )
  }
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

const ConditionControls = ({ form, type, formulaCount, addFormula }) => {
  return (
    <div style={{ display:'flex' }}> 
      <Button 
        type="primary" size="small" icon="plus" style={{ marginLeft:'3px' }}
        onClick={(e) => {  e.stopPropagation(); addFormula(); }} 
      >
          Add formula
      </Button>

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
      <Button 
        disabled={formulaCount < 2} size="small" type="danger" icon="delete" shape="circle" style={{ marginLeft:'3px' }}
        onClick={(e) => { e.stopPropagation(); deleteFormula(i); }} 
      />
    </div>
  )
}

const mapStateToProps = (state) => {
  const { 
    filterModalVisible, workflow, formState, modalLoading, modalError
  } = state.workflow;
  
  return { 
    filterModalVisible, workflow, formState, modalLoading, modalError
  }
}

export default connect(mapStateToProps)(
  Form.create({
    onFieldsChange(props, payload) {
      const { dispatch } = props;
      dispatch(WorkflowActionCreators.updateFormState(payload));
    },
    mapPropsToFields(props) {
      const { formState } = props;
      let fields = {}

      // These are fields that may have their values in the form state directly edited while they are still visible in the DOM
      // Therefore, when receiving a new prop (formState) mapPropsToFields updates the form values for us properly
      if (formState) {
        fields['type'] = formState.type && Form.createFormField(formState.type);

        formState.formulas && formState.formulas.forEach((formula, i) => {
          fields[`formulas[${i}].fieldOperator`] = Form.createFormField(
            formState.formulas[i].fieldOperator ? formState.formulas[i].fieldOperator : {}
          );
          
          fields[`formulas[${i}].comparator`] = Form.createFormField(
            formState.formulas[i].comparator ? formState.formulas[i].comparator : {}
          );
        });
        
      }
      return fields;
    }
  })(FilterModal));
