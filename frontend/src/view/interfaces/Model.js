import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button, Form, Input } from 'antd';

import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import * as ViewActionCreators from '../ViewActions';

import Module from '../draggable/Module';
import Add from '../draggable/Add';

import DatasourceModule from '../modules/Datasource';
import FormModule from '../modules/Form';

import DiscrepenciesModal from '../modals/DiscrepenciesModal';
import FormFieldModal from '../modals/FormFieldModal';


const FormItem = Form.Item;


class Model extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    this.state = {
      formField: { visible: false, stepIndex: null, field: null, fieldIndex: null }
    };
  };

  labelsUsed = (steps) => {
    const { formField } = this.state;

    // Identify the fields already used in the build
    let labels = [];
    steps.forEach((step, i) => {
      if (step.type === 'datasource') labels = [...labels, ...Object.values(step.datasource.labels)];

      if (step.type === 'form') {
        const fields = [...step.form.fields];
        // stepIndex & fieldIndex is set in the state when editing a field in a form module
        // The index will be used to remove that particular field from the list of fields in the given module
        // So that the field label is not compared against itself (and thus avoiding a false-positive duplicate label)
        if ('stepIndex' in formField && 'fieldIndex' in formField && (i === formField.stepIndex)) {
          fields.splice(formField.fieldIndex, 1); 
        };

        labels = [...labels, ...fields.map(field => field.name)];
      };
    });

    return labels;
  };

  hasDependency = (step, field) => {
    const { build } = this.props;

    const currentStep = build.steps[step];

    if (currentStep.type === 'datasource') field = currentStep.datasource.labels[field];
    
    // If this field is used as a matching field for any modules
    let relatedSteps = build.steps.slice(step + 1);

    relatedSteps = relatedSteps.filter(step => {
      if (step.type === 'datasource') return 'matching' in step.datasource && step.datasource.matching === field;
      if (step.type === 'form') return 'primary' in step.form && step.form.primary === field;
      return false;
    });

    return (relatedSteps.length > 0);
  };

  checkDuplicateLabel = (field) => {
    const { build } = this.props;

    const labels = this.labelsUsed(build.steps);

    return [labels.includes(field), labels];
  };

  render() {
    const { location, history, form, selectedId, build, datasources, discrepencies } = this.props;

    const containerId = location.state && location.state.containerId;

    return (
      <div style={{ paddingRight: 160 }}>
        <h2>Details</h2>
        <div style={{ marginBottom: 20, maxWidth: 350 }}>
          <FormItem label="Name" validateStatus={build && build.errors.name ? 'error' : null}>
            <Input value={build && build.name} onChange={(e) => this.boundActionCreators.updateBuild(null, 'name', e.target.value)}/>
          </FormItem>
        </div>

        <h2 style={{ marginBottom: '1em' }}>Data Model</h2>
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
          { build && build.steps.map((step, index) => (
            <div style={{ marginRight: 25, marginBottom: 25, position: 'relative' }} key={index}>
              { 
                step.type === 'datasource' && 
                <DatasourceModule
                  datasources={datasources} build={build} step={index}
                  onChange={this.boundActionCreators.updateBuild}
                  checkForDiscrepencies={this.boundActionCreators.checkForDiscrepencies}
                  deleteStep={this.boundActionCreators.deleteStep}
                  labelsUsed={this.labelsUsed}
                  hasDependency={this.hasDependency}
                  checkDuplicateLabel={this.checkDuplicateLabel}
                /> 
              }
              { 
                step.type === 'form' && 
                <FormModule
                  build={build} step={index}
                  onChange={this.boundActionCreators.updateBuild}
                  deleteStep={this.boundActionCreators.deleteStep}
                  onAddField={(stepIndex) => { this.setState({ formField: { visible: true, stepIndex } }) }}
                  onEditField={(stepIndex, field, fieldIndex) => { this.setState({ formField: { visible: true, stepIndex, field, fieldIndex } }) }}
                  labelsUsed={this.labelsUsed}
                /> 
              }
            </div>
          ))}
          <Add/>
        </div>

        <DiscrepenciesModal
          visible={discrepencies && ('primary' in discrepencies || 'matching' in discrepencies)}
          discrepencies={discrepencies}
          form={form}
          onResolve={this.boundActionCreators.resolveDiscrepencies}
        />

        <FormFieldModal
          visible={this.state.formField.visible}
          form={form}
          stepIndex={this.state.formField.stepIndex}
          field={this.state.formField.field}
          fieldIndex={this.state.formField.fieldIndex}
          onChange={(field, value, isNotField) => this.boundActionCreators.updateBuild(this.state.formField.stepIndex, field, value, isNotField)}
          onClose={() => this.setState({ formField: { visible: false, stepIndex: null, field: null, fieldIndex: null } })}
          checkDuplicateLabel={this.checkDuplicateLabel}
          hasDependency={this.hasDependency}
        />

        <div style={{ marginBottom: 40 }}>
          <Button size="large" type="primary" onClick={() => this.boundActionCreators.saveBuild(history, containerId, selectedId)}>Save</Button>
        </div>
          
        <div className="modules">
          <div className="wrapper">
            <h2>Components</h2>
            <Module type="datasource" icon="database" label="Datasource"/>
            <Module type="form" icon="form" label="Form"/>
            <Module type="computed" icon="calculator" label="Computed Fields"/>
          </div>
        </div>

      </div>
    );
  };

};




const mapStateToProps = (state) => {
  const {
    loading, error, selectedId, build, datasources, discrepencies
  } = state.view;
  
  return {
    loading, error, selectedId, build, datasources, discrepencies
  };
};
 
export default connect(mapStateToProps)(Form.create()(DragDropContext(HTML5Backend)(Model)));
