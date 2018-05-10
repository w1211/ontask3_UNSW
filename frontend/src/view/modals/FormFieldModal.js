import React from 'react';
import { Modal, Input, Form, Select, Checkbox, Icon, Tooltip, Button, Alert } from 'antd';

import FormItemLayout from '../../shared/FormItemLayout';

const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;


class FormFieldModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = { options: [], error: null };
  };

  componentWillReceiveProps(nextProps) {
    const field = nextProps.field;
    if (field && 'options' in field) this.setState({ options: field.options });
  };

  handleOk = () => {
    const { form, field, fieldIndex, onChange } = this.props;
    const { options } = this.state;

    let didError = false;

    form.validateFields((err, values) => {
      if (form.getFieldValue('type') === 'dropdown' || (!form.getFieldValue('type') && field && field.type === 'dropdown')) {
        if (options.length === 0) { 
          this.setState({ error: 'At least one option must be added' }); 
          didError = true;
        };
  
        options && options.forEach(option => {
          if ((!option.label || !option.value) && !didError) {
            this.setState({ error: 'All options must have a label and value' });
            didError = true;
          };
        });

        values = { ...values, options };
      };

      if (err || didError) return;
      
      if (field) {
        onChange(`fields[${fieldIndex}]`, values);
      } else {
        onChange('add', values, true);
      };
      
      this.handleClose();
    });
  };

  handleClose = () => {
    const { form, onClose } = this.props;

    this.setState({ options: [], error: null })
    form.resetFields();
    onClose();
  };

  handleDelete = () => {
    const { fieldIndex, onChange } = this.props;
    
    confirm({
      title: 'Confirm field deletion',
      content: 'Are you sure you want to delete this field from the form? Any data entered in the form for this field will be lost.',
      onOk: () => {
        onChange('delete', fieldIndex, true);
        this.handleClose();
      }
    });
  };

  render() {
    const { visible, form, field, fieldIndex, checkDuplicateLabel } = this.props;
    const { options } = this.state;

    if (!visible) return null;
    
    return (
      <Modal
        visible={visible}
        title={`${field ? 'Edit' : 'Add'} field`}
        onCancel={this.handleClose}
        footer={
          <div>
            <Button onClick={this.handleClose}>Cancel</Button>
            { field && <Button type="danger" onClick={this.handleDelete}>Delete</Button> }
            <Button type="primary" onClick={this.handleOk}>{field ? 'Update' : 'Add'}</Button>
          </div>
        }
      >
        <FormItem {...FormItemLayout} label={
          <div style={{ display: 'inline' }}>
            Field name 
            <Tooltip title="The name for this field in the DataLab">
              <Icon type="question-circle-o" style={{ marginLeft: 5 }}/>
            </Tooltip>
          </div>
        }>
          { form.getFieldDecorator('name', {
            rules: [
              { required: true, message: 'Field name is required' },
              { message: 'Field name is already being used in the DataLab',
                 validator: (rule, value, cb) => {
                   checkDuplicateLabel(value)[0] ? cb(true) : cb()
                 }
              }
            ],
            initialValue: field && field.name
          })(
            <Input/>
          )}
        </FormItem>

        <FormItem {...FormItemLayout} label="Field type">
          { form.getFieldDecorator('type', {
            rules: [{ required: true, message: 'Field type is required' }],
            initialValue: field && field.type,
            onChange: () => this.setState({ error: null })
          })(
            <Select style={{ width: '100%' }}>
              <Option value="text">Text</Option> 
              <Option value="number">Number</Option>
              <Option value="date">Date</Option>
              <Option value="checkbox">Checkbox</Option>
              <Option value="dropdown">Dropdown</Option>
            </Select>
          )}
        </FormItem>

        { (form.getFieldValue('type') === 'text' || (!form.getFieldValue('type') && field && field.type === 'text')) &&
          <FormItem {...FormItemLayout} label="Multi-line input">
            { form.getFieldDecorator('textArea', {
              initialValue: field ? field.textArea : false,
              valuePropName: 'checked'
            })(
              <Checkbox/>
            )}
          </FormItem>
        }

        { (form.getFieldValue('type') === 'dropdown' || (!form.getFieldValue('type') && field && field.type === 'dropdown')) &&
          <div style={{ marginTop: -10 }}>
            <FormItem {...FormItemLayout} label="Multi-select" style={{ marginBottom: 8 }}>
              { form.getFieldDecorator('multiSelect', {
                initialValue: field ? field.multiSelect : false,
                valuePropName: 'checked'
              })(
                <Checkbox/>
              )}
            </FormItem>

            <FormItem {...FormItemLayout} label="Options" validateStatus="success">
              <Button 
                size="small" 
                type="primary" 
                onClick={() => this.setState({ options: [...options, {}], error: null })}
              >
                Add option
              </Button>
              
              { this.state.options.map((option, i) => (
                <div key={i} style={{ display: 'flex', marginBottom: 5 }}>
                  <Input 
                    placeholder="Label" 
                    style={{ flex: '1', marginRight: 5 }} 
                    value={this.state.options[i].label}
                    onChange={(e) => {
                      const options = this.state.options;
                      options[i].label = e.target.value;
                      this.setState({ options, error: null });
                    }}
                  />

                  <Input 
                    placeholder="Value" 
                    style={{ flex: '1', marginRight: 5 }} 
                    value={this.state.options[i].value}
                    onChange={(e) => {
                      const options = this.state.options;
                      options[i].value = e.target.value;
                      this.setState({ options, error: null });
                    }}
                  />

                  <Button type="danger" icon="delete" onClick={
                    () => { this.setState({ options: options.filter(optionItem => optionItem !== option) })}
                  }/>
                </div>
              ))}
            </FormItem>

            { this.state.error && <Alert style={{ marginTop: 10 }} message={this.state.error} type="error"/>}
          </div>
        }
      </Modal>
    )
  };
};

export default FormFieldModal;
