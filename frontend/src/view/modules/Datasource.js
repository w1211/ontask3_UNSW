import React from 'react';
import { Card, Icon, Select, Input, Tooltip, message, Form } from 'antd';

const { Option, OptGroup } = Select;
const FormItem = Form.Item;


class DatasourceModule extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editing: { },
      editMode: false
    };   
  };

  handleOutsideClick = (e) => {
    // If the click was not outside, then do nothing
    if (this.dropdown.contains(e.target)) return;

    document.removeEventListener('click', this.handleOutsideClick, false);
    this.setState({ editMode: false, editing: { } });
    this.select.focus();
    this.select.blur();
  };

  labelsUsed = (steps) => {
    // Identify the fields already used in the build
    let labels = [];
    steps.forEach(step => {
      if (step.type === 'datasource') labels = [...labels, ...Object.values(step.datasource.labels)];
    });

    return labels;
  };

  checkDuplicateLabel = (field) => {
    const { build, step } = this.props;

    const labels = this.labelsUsed(build.steps);

    return [labels.includes(field), labels];
  };

  generateLabel = (fields, field) => {    
    let suffix = 1;
    while (fields.includes(`${field}_${suffix}`)) {
      suffix += 1;
    }
    return `${field}_${suffix}`;
  };

  hasDependency = (field) => {
    const { build, step } = this.props;

    const currentStep = build.steps[step].datasource;
    const label = currentStep.labels[field];

    // If this field is used as a matching field for any datasources
    let relatedSteps = build.steps.slice(step + 1);

    relatedSteps = relatedSteps.filter(step => 
      step.type === 'datasource' && 'matching' in step.datasource && step.datasource.matching === label
    );

    return (relatedSteps.length > 0);
  };

  changeFields = (e) => {
    const { build, step, onChange } = this.props;
  
    const currentStep = build.steps[step].datasource;

    const fields = currentStep['fields'];

    // If a field was added
    if (e.length > fields.length) {
      // Identify the field added
      const field = e.filter(field => !fields.includes(field))[0];
      
      const [isDuplicate, labels] = this.checkDuplicateLabel(field);

      // If this field name is a duplicate of an existing label in the build
      if (isDuplicate) {
        // Generate a label for this field
        // Show the edit input field for the label
        this.onEdit(null, field, this.generateLabel(labels, field), true);
        return;
      } else {
        // Not a duplicate, therefore use the field name as-is
        onChange(step, 'labels', { ...currentStep.labels, [field]: field });
        onChange(step, 'fields', e);
      };
    // If a field was removed
    } else if (e.length < fields.length) {
      // Identify the field removed
      const field = fields.filter(field => !e.includes(field))[0];
      if (this.hasDependency(field)) {
        message.error('This field cannot be removed as it is being used as a matching field.');
      } else {
        onChange(step, 'remove', field, true);
      };
    };    
  };
  
  changeMatchingField = (e) => {
    const { build, step, onChange, checkForDiscrepencies } = this.props;

    onChange(step, 'matching', e);

    // Check if there are discrepencies
    checkForDiscrepencies(build.steps.slice(0, step), build.steps[step], false);
  };

  onEdit = (e, field, label, isRequired) => {
    const { build, step, onChange } = this.props;

    if (e) e.stopPropagation();

    if (this.hasDependency(field)) {
      message.error('This field cannot be renamed as it is being used as a matching field.');
      return;
    };
    
    const currentStep = build.steps[step].datasource;

    if (currentStep.labels[field]) {
      label = currentStep.labels[field];
    }

    this.setState({ editMode: true, editing: { step, field, label, isRequired } }); 
    onChange(step, 'edit', field, true);
    document.addEventListener('click', this.handleOutsideClick, false);
  };

  cancelEdit = () => {
    document.removeEventListener('click', this.handleOutsideClick, false);
    this.setState(
      () => { return ({ editMode: false, editing: { } }) },
      () => { this.select.focus(); }
    );
  };

  confirmEdit = () => {
    const { build, step, onChange } = this.props;
    const { editing } = this.state;

    const currentStep = build.steps[step].datasource;
  
    if (!editing.label) {
      message.error('Label cannot be empty.');
      return;
    };

    const [isDuplicate, labels] = this.checkDuplicateLabel(editing.label);

    if (isDuplicate) {
      message.error('This label is already being used.');
    } else {
      this.cancelEdit();
      onChange(step, 'labels', { ...currentStep.labels, [editing.field]: editing.label });
      onChange(step, 'fields', [...currentStep.fields, editing.field]);
      document.removeEventListener('click', this.handleOutsideClick, false);
    };
  };

  onFocusEdit = (e) => {
    // On focus, move the cursor to the end of the input
    const temp_value = e.target.value;
    e.target.value = '';
    e.target.value = temp_value;
  };

  render() {
    const { form, datasources, build, step, onChange, deleteStep, checkForDiscrepencies } = this.props;
    const { editing } = this.state;

    if (!datasources) return null;

    const currentStep = build.steps[step].datasource;
    const errors = 'errors' in build && build.errors.steps[step];
    const discrepencies = build.steps[step].discrepencies;

    // Identify which datasources have been used in the build
    const usedDatasources = build.steps.filter(step => step.type === 'datasource').map(step => step.datasource.id);
    // Find the datasource object representing this datasource (if chosen)
    const datasource = 'id' in currentStep && datasources.find(datasource => datasource.id === currentStep.id);
    // Determine the labels used in all steps up until (and not including) this one
    const labelsUsed = this.labelsUsed(build.steps.slice(0, step));
    
    // Initialize the array that will hold the datasource's actions
    let actions = [];
    // If this datasource has discrepencies, show the discrepencies button
    if (discrepencies && currentStep.matching) actions.push(<Tooltip title="Manage discrepencies"><Icon type="disconnect" onClick={() => checkForDiscrepencies(build.steps.slice(0, step), build.steps[step], true)}/></Tooltip>)
    // If this is the last step, show the delete button
    if (build.steps.length === step+1) actions.push(<Tooltip title="Remove datasource"><Icon type="delete" onClick={deleteStep}/></Tooltip>);
    
    return (
      <Card 
        style={{ width: 250, minHeight: 250, borderColor: '#BBDEFB' }} 
        actions={actions}
        title={
          <div style={{ display: 'flex', alignItems: 'center', borderColor: '#BBDEFB' }}>
            <div className="stepIcon datasource">
              {step + 1}
            </div>
            <Icon type="database" style={{ color: '#BBDEFB', fontSize: '150%', marginRight: 5 }}/>
            <FormItem validateStatus={errors && errors.id ? 'error' : null}>
              <Select 
                placeholder="Choose datasource" value={currentStep.id} style={{ flex: 1 }} 
                onChange={(e) => { onChange(step, 'id', e); }}
              >
                { datasources.map((datasource, i) => (
                  <Option value={datasource.id} key={i} disabled={usedDatasources.includes(datasource.id)}>
                    {datasource.name}
                  </Option>
                ))}
              </Select>
            </FormItem>
          </div>
        }
      >
        <FormItem validateStatus={errors && errors.primary ? 'error' : null}>
          <Tooltip 
            title={
              !datasource ? 
                'A datasource must be chosen first' 
              : 
                'The field from this datasource which uniquely identifies each of the records'
              }
            placement="right"
          >
            <Select 
              placeholder="Primary key" value={currentStep.primary} style={{ width: '100%' }} 
              onChange={(e) => onChange(step, 'primary', e)} disabled={!datasource}
            >
              { datasource && datasource.fields.map((field, i) => (
                <Option value={field} key={i}>{field}</Option>
              ))}
            </Select>
          </Tooltip>
        </FormItem>

        { step > 0 &&
          <FormItem validateStatus={errors && errors.matching ? 'error' : null}>
            <Tooltip 
              title={
                !datasource ? 
                  'A datasource must be chosen first' 
                : 
                  'The field added to the DataLab thus far that should be matched against the uniquely identifying field of this datasource (above), in order to join the data together'
                }
              placement="right"
            >
              <Select 
                placeholder="Matching field" value={currentStep.matching} style={{ width: '100%', marginTop: 10 }}
                onChange={this.changeMatchingField} disabled={!datasource}
              >
                { labelsUsed.map((label, i) => (
                  <Option value={label} key={label}>{label}</Option>
                ))}
              </Select>
            </Tooltip>
          </FormItem>
        }

        <div style={{ position: 'relative' }} id={`dropdown_${step}`} ref={(dropdown) => this.dropdown = dropdown}></div>
        
        <FormItem validateStatus={errors && errors.fields ? 'error' : null}>
          <Tooltip 
            title={
              !datasource ? 
                'A datasource must be chosen first' 
              : 
                'The fields from this datasource that should be added to the DataLab'
              }
            placement="right"
          >
            <Select
              mode="multiple" className="fields-select" placeholder="Fields" value={currentStep.fields} dropdownClassName="dataLab-fields"
              style={{ width: '100%', marginTop: 10 }} onChange={this.changeFields} disabled={this.state.editMode || !datasource}
              ref={(select) => { this.select = select; }}
              getPopupContainer={() => document.getElementById(`dropdown_${step}`)}
            >
              { datasource && datasource.fields.map((field, i) => {
                const isEditing = editing.step === step && editing.field === field;
                return (
                  <Option disabled={this.state.editMode} value={field} key={i} title={field} className={isEditing && 'editing-field'}>
                    { isEditing ?
                      <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                        <Tooltip 
                          title={editing.isRequired && `A label is required, as a field with name '${field}' already exists in the DataLab`} 
                          placement="bottom"
                        >
                          <Input 
                            ref={(input) => { this.labelInput = input; input && input.focus(); }}
                            size="small" value={editing.label} onFocus={this.onFocusEdit}
                            onChange={(e) => { this.setState({ editing: { ...editing, label: e.target.value } }); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') this.confirmEdit(); if (e.key === 'Escape') this.cancelEdit(); }}
                          />
                        </Tooltip>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <Icon type="close" onClick={this.cancelEdit}/>
                          <Icon type="save" onClick={this.confirmEdit}/>
                        </div>
                      </div>
                    :
                      <div className="normal-field">
                        {field in currentStep.labels ? currentStep.labels[field] : field}
                        {!this.state.editMode && <Icon type="edit" onClick={(e) => this.onEdit(e, field)}/>}
                      </div>
                    }
                  </Option>
                )
              })}
            </Select>
          </Tooltip>
        </FormItem>
      </Card>
    );
  };
};

export default DatasourceModule;
