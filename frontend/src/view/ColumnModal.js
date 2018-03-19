import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Alert, Select, Input, Tooltip, Icon } from 'antd';

import * as ViewActionCreators from './ViewActions';

import formItemLayout from '../shared/FormItemLayout';
// Directly import the getType function as it returns a value
// Functions accessed through bound action creators must be plain objects and not return a value
import { getType } from './ViewActions'; 
import ResolveMatchModal from './resolve/ResolveMatchModal';

const { Option, OptGroup } = Select;
const FormItem = Form.Item;


class ColumnModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    // 'datasource' and 'field' properties in the state is used only when adding a new column
    // If editing an existing column, the field (and therefore the datasource) are immutable
    // The state is used to render the available matching fields for a given field/datasource
    this.state = {
      datasource: null,
      field: null,
      labelRequired: false, // If the field chosen has a duplicate name
      resolveMatchVisible: false,
      dropDiscrepencies: null
    };
  };
  
  componentWillReceiveProps(nextProps) {
    const { fieldMatchResult } = nextProps;
    
    if (fieldMatchResult && (fieldMatchResult.primary || fieldMatchResult.matching)) {
      this.setState({ resolveMatchVisible: true });
    };
  }

  handleSubmit = () => {
    const { form, view, column, index } = this.props;
    const { datasource, field, dropDiscrepencies } = this.state;

    let fields = ['label', 'type', 'matching']
    if (!column) fields.push('field');

    form.validateFields(fields, (err, values) => {
      if (err) return;

      if (column) {
        if (!values.label) values.label = column.field;
        const payload = {...column, ...values};
        view.columns[index] = payload;
        if (dropDiscrepencies) view.dropDiscrepencies.push(...dropDiscrepencies);
        this.boundActionCreators.updateColumns(view.id, view.columns, false);
      } else {
        if (!values.label) values.label = field;
        const payload = {...values, field, datasource: datasource.id};
        view.columns.push(payload);
        if (dropDiscrepencies) view.dropDiscrepencies.push(...dropDiscrepencies);
        this.boundActionCreators.updateColumns(view.id, view.columns, view.dropDiscrepencies, true);
      };
    });
  };

  handleChangeField = (e) => {
    const { form, view } = this.props;

    const [datasourceIndex, fieldIndex] = e.split('_');
    const datasource = view.datasources[datasourceIndex];
    const field = datasource.fields[fieldIndex];

    // Guess the field's type from the first row of the data in the field's datasource
    const guessedType = getType(datasource.data[0][field]);
    form.setFieldsValue({ 'type': guessedType });

    // If the field belongs to the same datasource as the primary key, then use the primary key as the default matching field
    const primaryKey = view.columns[0]
    if (primaryKey.datasource === datasource.id) {
      form.setFieldsValue({ 'matching': primaryKey.field });
    // Otherwise, if a default matching field for this datasource has been set, then pre-populate it in the form
    } else {
      const defaultMatchingField = view.defaultMatchingFields.find(matchingField => matchingField.datasource === datasource.id);
      if (defaultMatchingField) form.setFieldsValue({ 'matching': defaultMatchingField.matching });
    };

    // If the field chosen has a duplicate name, then require that the user enters a label
    const fields = view.columns.map(column => column.label ? column.label : column.field);
    const labelRequired = fields.includes(field);

    this.setState({ datasource, field, labelRequired });
  };

  handleChangeMatchingField = (e) => {
    const { view, column, dispatch } = this.props;
    let { datasource } = this.state;
    
    datasource = column ? column.datasource : datasource.id;
    const dropDiscrepencies = view.dropDiscrepencies && view.dropDiscrepencies.find(discrepency => discrepency.datasource === datasource && discrepency.matching === e);

    // If the user has already specified how to deal with conflicts for this matching field, then skip this step
    if (dropDiscrepencies) {
      dispatch(this.boundActionCreators.resolveMatchingField());
      return;
    }

    // Otherwise, detect whether there are any conflicts and prompt the user on how to resolve them (if any)
    const matchingField = { datasource, field: e };
    const primaryKey = { datasource: view.columns[0].datasource, field: view.columns[0].field };
    this.boundActionCreators.checkMatchingfield(matchingField, primaryKey);
  };

  checkFields = (rule, value, callback) => {
    const { view, column } = this.props;
    const fields = view.columns.map(column => column.label ? column.label : column.field);

    // If we are editing an existing column, only validate if the name is different than the original column name
    if (column && (column.label ? column.label : column.field) === value) {
      callback(); 
      return;
    };

    // If the provided label is already in the list of fields for this view, then show an error
    if (fields.includes(value)) {
      callback('Field name is already being used');
    };

    // Otherwise return no errors
    callback();
    return;
  };

  handleResolveConflict = () => {
    const { form, dispatch } = this.props;

    form.validateFields((err, values) => {
      if (err) return;

      let dropDiscrepencies = [];
      Object.entries(values.dropDiscrepencies).forEach(([datasource, fields]) => {
        Object.entries(fields).forEach(([field, value]) => {
          dropDiscrepencies.push({
            datasource: datasource, 
            matching: field, 
            dropMatching: value.matching,
            dropPrimary: value.primary
          })
        });
      });

      this.setState({ 
        resolveMatchVisible: false, 
        dropDiscrepencies
      });

      dispatch(this.boundActionCreators.resolveMatchingField());
    });
  };

  cancelResolveConflict = () => {
    const { form, dispatch } = this.props;

    this.setState({ resolveMatchVisible: false }); 
    form.resetFields(['matching']);
    dispatch(this.boundActionCreators.resolveMatchingField());
  };

  render() {
    const { dispatch, form, visible, loading, error, view, column, fieldMatchResult, matchingField } = this.props;
    const { resolveMatchVisible } = this.state;

    // If we are adding a new column, and not editing an existing one
    // Populate the available fields that can be added
    let options;
    if (view && !column) {
      options = view.datasources.map((datasource, i) => (
        <OptGroup label={datasource.name} key={datasource.name}>
          {datasource.fields.map((field, j) => {
            // Disable fields that have already been added to the view
            const isDisabled = view.columns.find(column => (column.field === field && column.datasource === datasource.id)) ? true : false;
            return <Option value={`${i}_${j}`} key={`${i}_${j}`} disabled={isDisabled}>{field}</Option>
          })}
        </OptGroup>
      ));
    };

    return (
      <Modal
        visible={visible}
        title={column ? 'Edit imported column' : 'Add imported column'}
        okText={column ? 'Update' : 'Add'}
        onCancel={() => { form.resetFields(); dispatch(this.boundActionCreators.closeColumnModal()); }}
        onOk={this.handleSubmit}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          {!column && 
            <FormItem {...formItemLayout} label="Field">
              {form.getFieldDecorator('field', {
                rules: [{ required: true, message: 'Field is required' }],
                onChange: this.handleChangeField
              })(
                <Select>
                  {options}
                </Select>
              )}
            </FormItem>
          }

          <FormItem {...formItemLayout} label={
            <span>Label {this.state.labelRequired && 
              <Tooltip title="A label is required because a field already exists with this name in the view.">
                <Icon style={{ cursor: 'help' }} type="question-circle-o" />
              </Tooltip>
            }</span>
          }>
            {form.getFieldDecorator('label', {
              initialValue: column ? column.label ? column.label : column.field : null,
              rules: [
                { required: this.state.labelRequired, message: 'Label is required' },
                { validator: this.checkFields } // Custom validator to ensure that the label is not a duplicate field name
              ]
            })(
              <Input/>
            )}
          </FormItem>

          <FormItem {...formItemLayout} label="Type">
            {form.getFieldDecorator('type', {
              initialValue: column ? column.type : null,
              rules: [{ required: true, message: 'Type is required' }]
            })(
              <Select>
                <Option value='number' key='number'>number</Option>
                <Option value='text' key='text'>text</Option>
                <Option value='date' key='date'>date</Option>
              </Select>
            )}
          </FormItem>

          <FormItem {...formItemLayout} label="Matching field">
            {form.getFieldDecorator('matching', {
              initialValue: column ? column.matching : null,
              rules: [{ required: true, message: 'Matching field is required' }],
              onChange: this.handleChangeMatchingField
            })(
              <Select disabled={(this.state.field || column) ? false : true}>
                {this.state.datasource && this.state.datasource.fields.map(field => {
                  if (field === this.state.field) return null;
                  return <Option value={field} key={field}>{field}</Option>
                })}
                {column && view.datasources.find(datasource => datasource.id === column.datasource).fields.map(field => {
                  if (field === column.field) return null;
                  return <Option value={field} key={field}>{field}</Option>
                })}
              </Select>
            )}
          </FormItem>

          <ResolveMatchModal 
            form={form}
            visible={resolveMatchVisible}
            fieldMatchResult={fieldMatchResult}
            matchingField={matchingField}

            onCancel={this.cancelResolveConflict}
            onOk={this.handleResolveConflict}
          />

          { error && <Alert style={{ marginTop: 10 }} message={error} type="error"/>}
        </Form>
      </Modal>
    );
  };
};

const mapStateToProps = (state) => {
  const { 
    loading, visible, error, view, column, index, fieldMatchResult, matchingField
  } = state.view;
  
  return { 
    loading, visible, error, view, column, index, fieldMatchResult, matchingField
  };
};

export default connect(mapStateToProps)(Form.create()(ColumnModal));
