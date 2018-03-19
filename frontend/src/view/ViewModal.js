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
const confirm = Modal.confirm;


class ViewModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    this.state = {
      current: 0,
      viewMode: 'details',
      resolveMatchVisible: false,
      resolveFieldNameVisible: false,
      newFields: null
    };
  }
  
  componentWillReceiveProps(nextProps) {
    const { fieldMatchResult } = nextProps;
    
    if (fieldMatchResult && (fieldMatchResult.primary || fieldMatchResult.matching)) {
      this.setState({ resolveMatchVisible: true });
    };
  }

  componentWillUpdate(nextProps, nextState) {
    const { error, datasources, form, formState, dataLoading, dataPreview } = nextProps;
    const { viewMode } = nextState;

    const selectOptions = datasources && datasources.map((datasource, i) => {
      return (
        <OptGroup label={datasource.name} key={datasource.name}>
          {datasource.fields.map((field, j) => {
            // If this field has been given a label, then show it in parentheses next to the original field name
            // But only if the label is actually different than the field name
            let label;
            if (formState && formState.columns) {
              const columnEquivalent = formState.columns.find(
                column => column.datasource.value === datasource.id && column.field.value === field
              );
              if (columnEquivalent && columnEquivalent.label && columnEquivalent.label.value !== columnEquivalent.field.value) {
                label = columnEquivalent.label.value;
              };
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
        error={error}
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
        moveRow={this.boundActionCreators.changeColumnOrder}
        viewMode={viewMode}
        loading={dataLoading}
        data={dataPreview}

        onChangeViewMode={this.handleViewChange}
      />
    }]
  }

  componentWillUnmount() {
    this.performClose();
  }

  mergeDiscrepencies = () => {
    // If we are editing a view, then ensure that the dropDiscrepency values are included in the payload
    // It is necessary to manually ensure this, because the dropDiscrepency form fields are only shown in the DOM
    // when a default matching field triggers onChange and a discrepency for that specific field is identified
    // Therefore we iterate over all dropDiscrepency values in the formState and manually merge them
    const { formState } = this.props;

    let values;

    if ('dropDiscrepencies' in formState) {
      Object.entries(formState.dropDiscrepencies).forEach(([datasource, fields]) => {
        Object.entries(fields).forEach(([field, discrepency]) => {
          
          values = Object.assign({}, values, {
            dropDiscrepencies: {
              [datasource]: {
                [field]: {
                  primary: discrepency.primary.value,
                  matching: discrepency.matching.value
                }
              }
            }
          });
  
        });
      });
    }

    return values;
  }

  handleSubmit = () => {
    const { containerId, form, selectedId, history } = this.props;
    const { formValues } = this.state;

    form.validateFields((err, values) => {
      if (err) return;

      values = {...formValues, ...values};

      if (selectedId) {
        values = {...values, ...this.mergeDiscrepencies()};
        this.boundActionCreators.updateView(containerId, selectedId, values, history);
      } else {
        this.boundActionCreators.createView(containerId, values, history);
      }
    });
  }

  performClose = () => {
    const { form } = this.props;

    form.resetFields(); 
    this.setState({ current: 0, viewMode: 'details' }); 
    this.boundActionCreators.closeViewModal(); 
  }

  handleClose = () => {
    const { form } = this.props;

    if (form.isFieldsTouched()) {
      confirm({
        title: 'Discard changes',
        content: 'You have not saved your work. If you continue, any changes made will be discarded.',
        okText: 'Discard',
        onOk() {
          this.performClose();
        }
      });
    } else {
      this.performClose();
    }
  }

  render() {
    const { current, resolveMatchVisible, resolveFieldNameVisible, newFields } = this.state;
    const { form, formState, visible, loading, error, selectedId, fieldMatchResult, matchingField } = this.props;

    return (
      <Modal
        visible={visible}
        title='Views'
        onCancel={this.handleClose}
        footer={
          <div>
            <Button onClick={() => { form.resetFields(); this.boundActionCreators.closeViewModal(); }}>Cancel</Button> 
            {  (current > 0) && 
              <Button onClick={() => { this.prev() }}>Previous</Button> 
            }
            { (this.steps && current < this.steps.length - 1) ?
              <Button type="primary" onClick={() => { this.handleNext() }}>Next</Button>
            :
              <Button type="primary" loading={loading} onClick={this.handleSubmit}>{ selectedId ? "Update" : "Create" }</Button>
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
          
          { error && <Alert style={{ marginTop: 10 }} message={error} type="error"/>}
        </Form>
      </Modal>
    )
  }

  handleViewChange = (e) => {
    const { form } = this.props;
    const { formValues } = this.state;

    // If we're changing to the data preview mode, then store the form values on the details mode first
    if (e === 'data') {
      form.validateFields((err, values) => {
        if (err) return;
        this.storeFormValues(values);
        this.boundActionCreators.previewData({...formValues, ...values, ...this.mergeDiscrepencies()});
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
    containerId, datasources, loading, visible, dataLoading, dataPreview, error, formState, fieldMatchResult, matchingField, selectedId
  } = state.view;
  
  return { 
    containerId, datasources, loading, visible, dataLoading, dataPreview, error, formState, fieldMatchResult, matchingField, selectedId
  }
}

export default connect(mapStateToProps)(
  Form.create({
    onFieldsChange(props, payload) {
      const { dispatch } = props;
      dispatch(ViewActionCreators.updateViewFormState(payload));
    },
    mapPropsToFields(props) {
      const { formState } = props;
      let fields = {}

      // These are fields that may have their values in the form state directly edited while they are still visible in the DOM
      // Therefore, when receiving a new prop (formState) mapPropsToFields updates the form values for us properly
      if (formState) {
        fields['primary'] = formState.primary && Form.createFormField(formState.primary);

        fields['fields'] = formState.fields && Form.createFormField(formState.fields);

        formState.defaultMatchingFields && Object.entries(formState.defaultMatchingFields).forEach(([key, value]) => {
          fields[`defaultMatchingFields.${key}`] = Form.createFormField(formState.defaultMatchingFields[key]);
        });

        formState.columns && formState.columns.forEach((column, i) => {
          Object.entries(column).forEach(([key, value]) => {
            fields[`columns[${i}].${key}`] = Form.createFormField(formState.columns[i][key]);
          });
        });
        
      }
      return fields;
    }
  })(DragDropContext(HTML5Backend)(ViewModal)))
