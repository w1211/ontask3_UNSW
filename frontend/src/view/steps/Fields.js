import React from 'react';
import { Modal, Form, Alert, Select, Icon, Tooltip } from 'antd';

import formItemLayout from '../../shared/FormItemLayout';

const FormItem = Form.Item;
const confirm = Modal.confirm;
const { Option } = Select;


const Fields = ({ error, form, formState, datasources, options, onChangeFields, onDuplicateField, onChangeDefaultMatchingField }) => {
  if (!datasources || !formState) return null;

  let chosenDatasources = new Set([]);
  if (formState.fields.value.length > 0) {
    // Create an array of the datasources used by this view (based on fields chosen)
    // This will be used to ask for the default matching field of each datasource other than the primary key's datasource
    formState.fields.value.forEach(checkedField => { 
      const datasourceIndex = checkedField.split('_')[0];
      chosenDatasources.add(datasources[datasourceIndex]);
    });

    // Remove the datasource of the primary key
    // As it can be assumed that all fields in the datasource will use the primary key as their matching field
    const primaryDatasource = formState.primary.value.split('_')[0];
    chosenDatasources.delete(datasources[primaryDatasource]);

    // Convert the set to an array
    chosenDatasources = [...chosenDatasources];
  }

  const confirmMatchingFieldChange = (datasourceId, e) => {
    // If the matching field already has a value, then prompt the user if they want to change it
    // If changing an existing value, then all columns that use this datasource should have their matching field updated
    let currentMatchingField = form.getFieldValue(`defaultMatchingFields.${datasourceId}`);

    if (currentMatchingField) {
      // Present a confirmation dialog to the user
      confirm({
        title: 'Change matching field',
        content: 'Any custom matching fields configured for fields from this datasource will need to be re-entered if you change the default matching field. Are you sure you want to proceed?',
        onOk() {
          onChangeDefaultMatchingField(
            { datasource: datasourceId, field: e },
            { datasource: formState.columns[0].datasource.value, field: formState.columns[0].field.value,  }
          );
        }
      });
      // getValueFromEvent() doesn't support waiting for the result of the confirmation dialog, it expects a value immediately
      // So by default, we return the previous value of the primary field
      // If the user proceeds at the confirm dialog, then manually set the default matching field to the new value
      return currentMatchingField;
    // Primary key doesn't have a value yet, so no confirmation is needed
    } else {
      onChangeDefaultMatchingField(
        { datasource: datasourceId, field: e },
        { datasource: formState.columns[0].datasource.value, field: formState.columns[0].field.value,  }
      );
      return e;
    }
  };

  const handleFieldChange = (e) => {
    const fields = formState.columns.map(column => column.field.value);
  
    // If a field is being added
    if (e.length >= fields.length) {
      const [datasourceIndex, fieldIndex] = e[e.length - 1].split('_');
      const newField = datasources[datasourceIndex].fields[fieldIndex];
  
      if (fields.includes(newField)) {
        onDuplicateField(e);
        return e.slice(0, -1);
      } else {
        onChangeFields(e);
        return e;
      }
    // Otherwise, don't check for field duplicates, just return the new value and continue
    } else {
      onChangeFields(e);
      return e; 
    }
  };

  return (
    <div>
      <FormItem
        {...formItemLayout}
        label="Fields"
      >
        {form.getFieldDecorator('fields', {
          initialValue: formState && formState.fields ? formState.fields.value : undefined,
          // onChange should be placed within the form decorator and NOT as an attribute of the select component itself
          // Otherwise the form validation does not update correctly after changing values
          getValueFromEvent: handleFieldChange
        })(
          <Select mode="multiple">
            {options}
          </Select>
        )}
      </FormItem>
      {
        chosenDatasources.length > 0 &&
        <div>
          <h4 style={{ display: 'inline-block' }}>Matching fields</h4>
          <Tooltip title="prompt text">
            <Icon style={{ marginLeft: 5, cursor: 'help' }} type="question-circle-o" />
          </Tooltip>
          
          {chosenDatasources.map((datasource, i) => (
            <FormItem
              {...formItemLayout}
              label={datasource.name}
              key={i}
            >
              {form.getFieldDecorator(`defaultMatchingFields.${datasource.id}`, {
                rules: [{ required: true, message: 'Matching field is required' }],
                initialValue: formState && formState.defaultMatchingFields && formState.defaultMatchingFields[datasource.id] ? formState.defaultMatchingFields[datasource.id].value : undefined,
                getValueFromEvent: (e) => confirmMatchingFieldChange(datasource.id, e)
              })(
                <Select key={i}>
                  {datasource.fields.map(field => <Option value={field} key={`${i}_${field}`}>{field}</Option>)}
                </Select>
              )}
            </FormItem>
          ))}

        </div>
      }
      { !error && <Alert style={{ marginTop: 10 }} message="Informational Notes" type="info" showIcon/> }
    </div>
  )
};

export default Fields;
