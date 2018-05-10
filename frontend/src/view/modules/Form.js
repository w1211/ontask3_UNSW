import React from 'react';
import { Card, Icon, Select, Input, Tooltip, Form, DatePicker, Divider } from 'antd';
import _ from 'lodash';

const FormItem = Form.Item;

class FormModule extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addField: { visible: false }
    };
  };

  render() {
    const { build, step, onChange, deleteStep, onAddField, onEditField } = this.props;

    const currentStep = build.steps[step].form;
    const errors =  _.get(build, `errors.steps[${step}]`);
   
    // Initialize the array that will hold the datasource's actions
    let actions = [
      <Tooltip title="Add field"><Icon type="plus" onClick={() => onAddField(step)} /></Tooltip>
    ];
    // If this is the last step, show the delete button
    if (build.steps.length === step + 1) actions.push(<Tooltip title="Remove form"><Icon type="delete" onClick={deleteStep} /></Tooltip>);

    return (
      <Card
        className="form"
        style={{ width: 250, borderColor: '#D1C4E9' }}
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
            format="DD/MM/YYYY HH:mm:ss"
            placeholder="Active to"
            onChange={(e) => onChange(step, 'activeTo', e) }
            style={{ width: '100%', marginBottom: 10 }}
          />
        </FormItem>

        <Divider style={{ fontSize: 12, margin: '8px 0' }}>Added fields</Divider>

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
