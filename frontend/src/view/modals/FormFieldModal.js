import React from 'react';
import { Modal, Input, InputNumber, Form, Select, Checkbox, Icon, Tooltip, Button, Alert, message, Radio } from 'antd';

import FormItemLayout from '../../shared/FormItemLayout';

const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;


class FormFieldModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = { options: [], error: null };
  };

  componentWillReceiveProps(nextProps) {
    const field = nextProps.field;
    if (field && 'options' in field && this.state.options.length === 0) this.setState({ options: field.options });
  };

  handleOk = () => {
    const { form, field, fieldIndex, onChange } = this.props;
    const { options } = this.state;

    let didError = false;

    form.validateFields((err, values) => {
      if (form.getFieldValue('textDisplay') === 'list' || (!form.getFieldValue('textDisplay') && field && field.textDisplay === 'list')) {
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
    const { stepIndex, fieldIndex, field, onChange, hasDependency } = this.props;
    
    if (hasDependency(stepIndex, field.name)) {
      message.error(`'${field.name}' cannot be removed as it is being used as a matching field.`);
    } else {
      confirm({
        title: 'Confirm field deletion',
        content: 'Are you sure you want to delete this field from the form? Any data entered in the form for this field will be lost.',
        onOk: () => {
          onChange('delete', fieldIndex, true);
          this.handleClose();
        }
      });
    };
  };

  render() {
    const { visible, form, field, checkDuplicateLabel } = this.props;
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
          <div>
            <FormItem {...FormItemLayout} label="Display">
              { form.getFieldDecorator('textDisplay', {
                initialValue: field && field.textDisplay ? field.textDisplay : 'input'
              })(
                <RadioGroup>
                  <RadioButton value="input">Input</RadioButton>
                  <RadioButton value="list">List</RadioButton>
                </RadioGroup>
              )}
            </FormItem>

            { (form.getFieldValue('textDisplay') === 'input' || (!form.getFieldValue('textDisplay') && field && field.textDisplay === 'input')) ?
              <div>
                <FormItem {...FormItemLayout} label="Multi-line input">
                  { form.getFieldDecorator('textArea', {
                    initialValue: field ? field.textArea : false,
                    valuePropName: 'checked'
                  })(
                    <Checkbox/>
                  )}
                </FormItem>

                <FormItem {...FormItemLayout} label="Max characters">
                  { form.getFieldDecorator('maxLength', {
                    initialValue: field && field.maxLength
                  })(
                    <InputNumber style={{ width: '100%' }} min={1}/>
                  )}
                </FormItem>
              </div>
            :
              <div>
                <FormItem {...FormItemLayout} label="List style" style={{ marginBottom: 14 }}>
                  { form.getFieldDecorator('listStyle', {
                    initialValue: field ? field.listStyle : 'dropdown',
                  })(
                    <RadioGroup>
                      <RadioButton value="dropdown">Dropdown</RadioButton>
                      <RadioButton value="radio">Radio boxes</RadioButton>
                    </RadioGroup>
                  )}
                </FormItem>

                { (form.getFieldValue('listStyle') === 'radio' || (!form.getFieldValue('listStyle') && field && field.listStyle === 'radio')) &&
                  <FormItem {...FormItemLayout} label="Alignment" style={{ marginBottom: 14 }}>
                    { form.getFieldDecorator('alignment', {
                      initialValue: field ? field.alignment : 'horizontal',
                    })(
                      <RadioGroup>
                        <RadioButton value="horizontal">Horizontal</RadioButton>
                        <RadioButton value="vertical">Vertical</RadioButton>
                      </RadioGroup>
                    )}
                  </FormItem>
                }

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
              </div>
            }
          </div>
        }

        { (form.getFieldValue('type') === 'number' || (!form.getFieldValue('type') && field && field.type === 'number')) &&
          <div>
            <FormItem {...FormItemLayout} label="Display">
              { form.getFieldDecorator('numberDisplay', {
                initialValue: field && field.numberDisplay ? field.numberDisplay : 'input'
              })(
                <RadioGroup>
                  <RadioButton value="input">Input</RadioButton>
                  <RadioButton value="range">Range</RadioButton>
                  <RadioButton value="list">List</RadioButton>
                </RadioGroup>
              )}
            </FormItem>

            <FormItem {...FormItemLayout} label="Interval">
              { form.getFieldDecorator('interval', {
                initialValue: field && field.interval,
                rules: [{ required: form.getFieldValue('numberDisplay') !== 'input', message: 'Interval is required' }]
              })(
                <InputNumber style={{ width: '100%' }} min={0}/>
              )}
            </FormItem>

            <FormItem {...FormItemLayout} label="Minimum">
              { form.getFieldDecorator('minimum', {
                initialValue: field && field.minimum,
                rules: [{ required: form.getFieldValue('numberDisplay') !== 'input', message: 'Minimum is required' }]
              })(
                <InputNumber style={{ width: '100%' }} step={form.getFieldValue('interval')}/>
              )}
            </FormItem>

            <FormItem {...FormItemLayout} label="Maximum">
              { form.getFieldDecorator('maximum', {
                initialValue: field && field.maximum,
                rules: [
                  { required: form.getFieldValue('numberDisplay') !== 'input', message: 'Maximum is required' },
                  { message: 'Maximum must be greater than minimum',
                    validator: (rule, value, cb) => {
                      form.getFieldValue('minimum') && form.getFieldValue('maximum') <= form.getFieldValue('minimum') ? cb(true) : cb()
                    }
                  }
                ]
              })(
                <InputNumber style={{ width: '100%' }} step={form.getFieldValue('interval')}/>
              )}
            </FormItem>
      
            { (form.getFieldValue('numberDisplay') === 'input' || (!form.getFieldValue('numberDisplay') && field && field.numberDisplay === 'input')) &&
              <FormItem {...FormItemLayout} label="Decimal places">
                { form.getFieldDecorator('precision', {
                  initialValue: field && field.precision
                })(
                  <InputNumber style={{ width: '100%' }} min={0}/>
                )}
              </FormItem>
            }
          </div>
        }

        <div>
          { this.state.error && <Alert style={{ marginTop: 10 }} message={this.state.error} type="error"/>}
        </div>
      </Modal>
    )
  };
};

export default FormFieldModal;
