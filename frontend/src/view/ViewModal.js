import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Alert, Steps, Button, Select } from 'antd';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import * as ViewActionCreators from './ViewActions';

import './ViewModal.css';

import Primary from './steps/Primary';
import Fields from './steps/Fields';
import Preview from './steps/Preview';

import ResolveFieldNameModal from './resolve/ResolveFieldNameModal';
import ResolveMatchModal from './resolve/ResolveMatchModal';


const Step = Steps.Step;
const { Option, OptGroup } = Select;


class ViewModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.state = {
      current: 0,
      viewMode: 'details',
      resolveMatchVisible: false,
      resolveFieldNameVisible: false,
      newFields: null
    };

    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  }
  
  componentWillReceiveProps(nextProps) {
    const { fieldMatchResult } = nextProps;
    
    if (fieldMatchResult && fieldMatchResult.error) {

    } else if (fieldMatchResult && (fieldMatchResult.primary || fieldMatchResult.matching)) {
      this.setState({ resolveMatchVisible: true });
    };
  }

  componentWillUpdate(nextProps, nextState) {
    const { datasources, form, formState } = nextProps;
    const { viewMode } = nextState;

    const selectOptions = datasources && datasources.map((datasource, i) => {
      return (
        <OptGroup label={datasource.name} key={datasource.name}>
          {datasource.fields.map((field, j) => {
            // If this field has been given a label, then show it in parentheses next to the original field name
            let label;
            if (formState && formState.columns) {
              const columnEquivalent = formState.columns.find(
                column => column.datasource.value === datasource.id && column.field.value === field
              );
              if (columnEquivalent && columnEquivalent.label) label = columnEquivalent.label.value;
            }
            
            // Disable the primary key in the list of available fields
            const isDisabled = formState && formState.primary && formState.primary.value === `${i}_${j}`;

            return <Option value={`${i}_${j}`} key={`${i}_${j}`} disabled={isDisabled}>{field} {label && `(${label})`}</Option>
          })}
        </OptGroup>
      )
    });

    this.steps = [{
      title: 'Primary',
      content: <Primary 
        form={form}
        formState={formState}
        options={selectOptions}

        onChange={ (e) => this.boundActionCreators.changePrimary(e) }
      />
    }, {
      title: 'Fields',
      content: <Fields 
        form={form}
        formState={formState}
        datasources={datasources}
        options={selectOptions}

        onDuplicateField={this.onDuplicateField}
        onChangeFields={ (e) => this.boundActionCreators.changeFields(e) }
        onChangeDefaultMatchingField={ (matchingField, primaryKey) => { this.boundActionCreators.changeDefaultMatchingField(matchingField, primaryKey) }}
      />,
    }, {
      title: 'Preview',
      content: <Preview
        form={form}
        formState={formState}
        datasources={datasources}
        components={this.components}
        moveRow={this.boundActionCreators.changeColumnOrder}
        viewMode={viewMode}

        onChangeViewMode={this.handleViewChange}
      />
    }]
  }

  render() {
    const { current, resolveMatchVisible, resolveFieldNameVisible, newFields, formValues } = this.state;
    const { form, formState, visible, loading, error, view, fieldMatchResult, matchingField } = this.props;

    return (
      <Modal
        visible={visible}
        title='Views'
        onCancel={() => { form.resetFields(); this.setState({ current: 0 }); this.boundActionCreators.closeViewModal(); }}
        footer={
          <div>
            <Button onClick={() => { form.resetFields(); this.boundActionCreators.closeViewModal(); }}>Cancel</Button> 
            {  (current > 0) && 
              <Button onClick={() => { this.prev() }}>Previous</Button> 
            }
            { (this.steps && current < this.steps.length - 1) ?
              <Button type="primary" onClick={() => { this.handleNext() }}>Next</Button>
            :
              <Button type="primary" onClick={() => { form.validateFields((err, values) => { console.log({...formValues, ...values}) }) }}>{ view ? "Update" : "Create" }</Button>
            }
          </div>
        }
        confirmLoading={loading}
        className="views" 
      >
        <Form layout="horizontal">
          <Steps current={current}>
            {this.steps && this.steps.map(step => {
              return <Step key={step.title} title={step.title} />
            })}
          </Steps>

          <div className="steps-content">
            {this.steps && this.steps[current].content}
          </div>

          <ResolveMatchModal 
            form={form}
            formState={formState}
            visible={resolveMatchVisible}
            fieldMatchResult={fieldMatchResult}
            matchingField={matchingField}

            onCancel={() => { this.setState({ resolveMatchVisible: false }); this.boundActionCreators.cancelResolveFieldMatch(); }}
            onOk={this.handleResolveConflict}
          />

          <ResolveFieldNameModal 
            form={form}
            formState={formState}
            visible={resolveFieldNameVisible}
            newFields={newFields}

            onCancel={() => { this.setState({ resolveFieldNameVisible: false, newFields: null }); }}
            onOk={this.resolveDuplicateField}
          />
          
          { error && <Alert message={error} type="error"/>}
        </Form>
      </Modal>
    )
  }

  handleViewChange = (e) => {
    const { form } = this.props;
    // If we're changing to the data preview mode, then store the form values on the details mode first
    if (e === 'data') {
      form.validateFields((err, values) => {
        if (err) return;
        this.storeFormValues(values);
      });
    }
    this.setState({ viewMode: e });
  }

  storeFormValues(values) {
    const formValues = { ...this.state.formValues, ...values };
    this.setState({ formValues });
  }

  next(values) {
    const current = this.state.current + 1;
    this.setState({ current });
  }

  prev() {
    const current = this.state.current - 1;
    this.setState({ current, viewMode: 'details' });
  }

  handleNext() {
    const { form } = this.props;

    // Validates the form fields that are currently in the DOM
    // I.e. validates only the form fields that are in the current step, NOT all form fields
    form.validateFields((err, values) => {
      if (err) return;
      this.storeFormValues(values)
      this.next(values);
    });
  }

  handleResolveConflict = () => {
    const { form } = this.props;

    form.validateFields((err, values) => {
      if (err) return;
      this.storeFormValues(values)
      this.setState({ resolveMatchVisible: false }); 
      this.boundActionCreators.resolveMatchingField();
    });
  }

  onDuplicateField = (newFields) => {
    this.setState({
      resolveFieldNameVisible: true,
      newFields
    })
  }

  resolveDuplicateField = () => {
    const { form } = this.props;
    const { newFields } = this.state;

    form.validateFields(['label'], (err, result) => {
      if (err) return;
      
      this.boundActionCreators.changeFields(newFields, result.label);
      this.setState({
        resolveFieldNameVisible: false,
        newFields: null
      });
    });
  }
}

const mapStateToProps = (state) => {
  const { 
    datasources, visible, loading, error, view, views, formState, fieldMatchResult, matchingField 
  } = state.view;
  
  return { 
    datasources, visible, loading, error, view, views, formState, fieldMatchResult, matchingField
  }
}

export default connect(mapStateToProps)(
  Form.create({
    onFieldsChange(props, payload) {
      ViewActionCreators.updateViewFormState(payload);
    },
    mapPropsToFields(props) {
      const formState = props.formState;
      let fields = {}

      // These are fields that may have their values in the form state directly edited while they are still visible in the DOM
      // Therefore, when receiving a new prop (formState) mapPropsToFields updates the form values for us properly
      if (formState) {
        fields['primary'] = formState.primary && Form.createFormField(formState.primary);

        fields['fields'] = formState.fields && Form.createFormField({
          ...formState.fields,
          value: formState.fields.value
        });

        formState.defaultMatchingFields && Object.entries(formState.defaultMatchingFields).forEach(([key, value]) => {
          fields[`defaultMatchingFields.${key}`] = Form.createFormField({
            ...formState.defaultMatchingFields[key],
            value: formState.defaultMatchingFields[key].value
          });
        })
      }
      return fields;
    }
  })(DragDropContext(HTML5Backend)(ViewModal)))
