import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Alert, Select, Input } from 'antd';

import * as ViewActionCreators from './ViewActions';

import formItemLayout from '../shared/FormItemLayout';
// Directly import the getType function as it returns a value
// Functions accessed through bound action creators must be plain objects and not return a value
import { getType } from './ViewActions'; 

const { Option, OptGroup } = Select;
const FormItem = Form.Item;


class ColumnModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    // State is used only when adding a new column
    // If editing an existing column, the field (and therefore the datasource) are immutable
    // The state is used to render the available matching fields for a given field/datasource
    this.state = {
      datasource: null,
      field: null
    }
  };

  handleSubmit = () => {
    const { form, view, column, index } = this.props;
    const { datasource, field } = this.state;

    form.validateFields(['label', 'type', 'matching'], (err, values) => {
      if (err) return;

      if (column) {
        const payload = {...column, ...values};
        view.columns[index] = payload;
        this.boundActionCreators.updateColumns(view.id, view.columns, false);
      } else {
        const payload = {...values, field, datasource: datasource.id};
        view.columns.push(payload);
        this.boundActionCreators.updateColumns(view.id, view.columns, true);
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
    }

    this.setState({ datasource, field });
  }

  render() {
    const { dispatch, form, visible, loading, error, view, column } = this.props;

    // If we are adding a new column, and not editing an existing one
    // Populate the available fields that can be added
    let options;
    if (view && !column) {
      options = view.datasources.map((datasource, i) => {
        return (
          <OptGroup label={datasource.name} key={datasource.name}>
            {datasource.fields.map((field, j) => {
              // Disable fields that have already been added to the view
              const isDisabled = view.columns.find(column => (column.field === field && column.datasource === datasource.id)) ? true : false;
              return <Option value={`${i}_${j}`} key={`${i}_${j}`} disabled={isDisabled}>{field}</Option>
            })}
          </OptGroup>
        )
      });
    }

    return (
      <Modal
        visible={visible}
        title={column ? 'Edit column' : 'Add column'}
        okText={column ? 'Update' : 'Add'}
        onCancel={() => { form.resetFields(); dispatch(this.boundActionCreators.closeColumnModal()); }}
        onOk={this.handleSubmit}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          {!column && 
            <FormItem {...formItemLayout} label="Field">
              {form.getFieldDecorator('field', {
                rules: [{ required: false, message: 'Field is required' }],
                onChange: this.handleChangeField
              })(
                <Select>
                  {options}
                </Select>
              )}
            </FormItem>
          }

          <FormItem {...formItemLayout} label="Label">
            {form.getFieldDecorator('label', {
              initialValue: column ? column.label ? column.label : column.field : null
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
              rules: [{ required: true, message: 'Matching field is required' }]
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

          { error && <Alert style={{ marginTop: 10 }} message={error} type="error"/>}
        </Form>
      </Modal>
    )
  }
}

const mapStateToProps = (state) => {
  const { 
    loading, visible, error, view, column, index
  } = state.view;
  
  return { 
    loading, visible, error, view, column, index
  }
}

export default connect(mapStateToProps)(Form.create()(ColumnModal))
