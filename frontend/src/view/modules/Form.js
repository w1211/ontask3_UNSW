import React from 'react';
import { Card, Icon, Select, Input, Tooltip, Form, DatePicker, Divider } from 'antd';
import _ from 'lodash';

const FormItem = Form.Item;
const { Option } = Select;


class FormModule extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addField: { visible: false }
    };
  };

  render() {
    const { build, step, onChange, deleteStep, onAddField, onEditField, labelsUsed } = this.props;

    const currentStep = build.steps[step].form;
    const errors =  _.get(build, `errors.steps[${step}]`, {});
   
    // Initialize the array that will hold the datasource's actions
    let actions = [
      <Tooltip title="Add field"><Icon type="plus" onClick={() => onAddField(step)} /></Tooltip>
    ];
    // If this is the last step, show the delete button
    if (build.steps.length === step + 1) actions.push(<Tooltip title="Remove form"><Icon type="delete" onClick={deleteStep} /></Tooltip>);

    // Determine the labels used in all steps up until (and not including) this one
    const labels = labelsUsed(build.steps.slice(0, step));

    return (
      <Card
        className="form"
        style={{ width: 350, borderColor: '#D1C4E9' }}
        actions={actions}
        title={
          <div style={{ display: 'flex', alignItems: 'center', borderColor: '#D1C4E9' }}>
            <div className="stepIcon form">
              {step + 1}
            </div>
            <Icon type="form" style={{ color: '#D1C4E9', fontSize: '150%', marginRight: 5 }} />
            <FormItem validateStatus={errors && errors.name ? 'error' : null}>
              <Input
                placeholder="Form name" value={currentStep.name} style={{ flex: 1 }}
                onChange={(e) => onChange(step, 'name', e.target.value) }
              />
            </FormItem>
          </div>
        }
      >
        <FormItem validateStatus={errors && errors.activeFrom ? 'error' : null}>
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Active from"
            value={currentStep.activeFrom}
            onChange={(e) => onChange(step, 'activeFrom', e) }
            style={{ width: '100%', marginBottom: 10 }}
          />
        </FormItem>

        <FormItem validateStatus={errors && errors.activeTo ? 'error' : null}>
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Active to"
            value={currentStep.activeTo}
            onChange={(e) => onChange(step, 'activeTo', e) }
            style={{ width: '100%', marginBottom: 10 }}
          />
        </FormItem>
        { errors.activeTo && <p style={{ color: '#f5222d' }}>Active to cannot be before active from.</p>}

        <FormItem validateStatus={errors && errors.primary ? 'error' : null}>
          <Tooltip 
            title="You must specify which field from the DataLab should be used to identify the data collected from this form"
            placement="right"
          >
            <Select 
              placeholder="Primary key" value={currentStep.primary} style={{ width: '100%', marginTop: 10 }}
              onChange={(e) => onChange(step, 'primary', e) }
            >
              { labels.map((label, i) => (
                <Option value={label} key={label}>{label}</Option>
              ))}
            </Select>
          </Tooltip>
        </FormItem>
        
        <Divider style={{ fontSize: 14, margin: '8px 0' }}>Added fields</Divider>

        { 'fields' in currentStep && currentStep.fields.length === 0 ?
          errors.fields ?
            <p style={{ color: '#f5222d' }}>The form must have at least one field.</p>
          :
            <p>Add a field by clicking the button below.</p>
        :
          <Tooltip title="Edit a given field by clicking on its name">
            <Select
              disabled
              mode="tags" 
              style={{ width: '100%' }} 
              dropdownStyle={{ display: 'none' }} 
              labelInValue={true}
              className="fields"
              value={
                currentStep.fields.map((field, i) => ({ 
                  key: field.name, 
                  label: <span onClick={() => onEditField(step, field, i)}>{field.name}</span>,
                  title: 'test'
                }))
              }
            />
          </Tooltip>
        }
      </Card>
    );
  };
};

export default FormModule;
