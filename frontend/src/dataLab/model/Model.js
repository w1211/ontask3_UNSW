import React from "react";
import { Button, Form, Input, message, Alert, notification } from "antd";
import _ from "lodash";

import Module from "./Module";
import Add from "./Add";

import DatasourceModule from "./datasource/Datasource";
import FormModule from "./form/Form";
import ComputedModule from "./computed/Computed";

import ModelContext from "./ModelContext";

import memoize from "memoize-one";

import apiRequest from "../../shared/apiRequest";

const FormItem = Form.Item;

const MODULES = [
  { label: "Datasource", type: "datasource", icon: "database" },
  { label: "Form", type: "form", icon: "form" },
  { label: "Computed Fields", type: "computed", icon: "calculator" }
];

class Model extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      error: null,
      stepKeys: (props.steps || []).map(() => _.uniqueId()),
      // Make a clone of the build steps. If the user deletes a module,
      // or a module's values must be reset (e.g. change the chosen datasource
      // in a datasource module) then the step/module in the build must also be
      // cleared, as it is used for populating the initial values of the fields.
      steps: props.steps
    };
  }

  labelsUsed = memoize(stepIndex => {
    const { form } = this.props;
    const { getFieldValue } = form;
    let steps = getFieldValue("steps");

    if (stepIndex) steps = steps.filter((step, i) => i < stepIndex);

    return steps.reduce((labels, step, stepIndex) => {
      let stepLabels = [];

      if (step.type === "datasource" && "datasource" in step)
        stepLabels = Object.values(step.datasource.labels || {}).filter(
          label => !!label
        );
      else if (["form", "computed"].includes(step.type)) {
        stepLabels = _.get(step, `${step.type}.fields`, [])
          .filter(field => !!field.name)
          .map(field => field.name);
      }

      return [...labels, ...stepLabels];
    }, []);
  });

  hasDependency = (stepIndex, field) => {
    const { form } = this.props;
    const { getFieldValue } = form;

    // If a datasource field is being checked, then use the field's label
    let relatedSteps = getFieldValue("steps");
    if (relatedSteps[stepIndex].type === "datasource")
      field = relatedSteps[stepIndex].datasource.labels[field];

    // Check whether this field is used as a matching field for any modules
    relatedSteps = relatedSteps.slice(stepIndex + 1).filter(step => {
      if (step.type === "datasource")
        return _.get(step, "datasource.matching") === field;

      if (step.type === "form")
        return [
          _.get(step, "form.primary") === field,
          _.get(step, "form.webForm.permission") === field,
          _.get(step, "webForm.visibleFields", []).includes(field)
        ].includes(true);

      return null;
    });

    return relatedSteps.length > 0;
  };

  handleSave = () => {
    const { location, history, form, selectedId, updateDatalab } = this.props;

    form.validateFields((err, build) => {
      if ((build.steps || []).length === 0) {
        this.setState({ error: "At least one component is required." });
        return;
      }

      if (err) return;

      this.setState({ loading: true });

      const containerId = _.get(location, "state.containerId");
      if (containerId) build.container = containerId;

      apiRequest(selectedId ? `/datalab/${selectedId}/` : "/datalab/", {
        method: selectedId ? "PATCH" : "POST",
        payload: build,
        onSuccess: dataLab => {
          notification["success"]({
            message: `DataLab ${selectedId ? "updated" : "created"}`,
            description: `The DataLab was successfully ${
              selectedId ? "updated" : "created"
            }.`
          });
          this.setState({ loading: false });
          updateDatalab(dataLab);
          history.push({ pathname: `/datalab/${dataLab.id}/data` });
        },
        onError: error => {
          console.log(error);
          this.setState({ loading: false });
        }
      });
    });
  };

  addModule = type => {
    const { form } = this.props;
    const { stepKeys } = this.state;
    const { getFieldDecorator } = form;
    
    // Force the first module to be a datasource
    if (stepKeys.length === 0 && type !== "datasource") {
      message.error("The first module of a DataLab must be a datasource.");
      return;
    }

    getFieldDecorator(`steps[${stepKeys.length}].type`, {
      initialValue: type
    });    
    this.setState({ stepKeys: [...stepKeys, _.uniqueId()], error: null });

  };

  deleteModule = () => {
    const { form } = this.props;
    const { stepKeys, steps } = this.state;
    const { getFieldValue, setFieldsValue } = form;

    // Delete the last module in the build
    this.setState({
      stepKeys: stepKeys.slice(0, -1),
      // Update the steps in the state.
      // This ensures that if a module is added, then the values will not
      // be mistakenly pre-populated (given that the form fields set
      // initialValue against the "step" provided in the props of the module)
      steps: steps && steps.slice(0, -1)
    });

    setFieldsValue({ steps: getFieldValue("steps").slice(0, -1) });
  };

  updateStep = (stepIndex, updatedStep) => {
    const { steps } = this.state;

    // If steps are undefined, then the user must be creating a DataLab
    // rather than updating one
    if (!steps) return;

    // Allow modules to update
    steps[stepIndex] = updatedStep;
    this.setState({ steps });
  };

  render() {
    const { form, datasources, actions, name, selectedId } = this.props;
    const { loading, error, stepKeys, steps } = this.state;
    const { getFieldDecorator, getFieldValue } = form;

    return (
      <ModelContext.Provider
        value={{
          selectedId,
          form,
          stepKeys,
          labelsUsed: this.labelsUsed,
          datasources,
          actions,
          deleteModule: this.deleteModule,
          hasDependency: this.hasDependency,
          updateStep: this.updateStep
        }}
      >
        <div className="model">
          <h2>Details</h2>

          <div className="name">
            <FormItem label="Name">
              {getFieldDecorator("name", {
                rules: [
                  {
                    required: true,
                    message: "DataLab name is required"
                  }
                ],
                initialValue: name
              })(<Input />)}
            </FormItem>
          </div>

          <h2>Data Model</h2>

          <div className="build">
            {stepKeys.map((key, index) => {
              // If the module was added during this session,
              // then a type would have been bound via the addModule
              // function's getFieldDecorator
              let type = getFieldValue(`steps[${index}].type`);
              // Otherwise, we must be editing an existing DataLab
              // so use the API call data to infer the module type
              if (!type) {
                type = steps[index].type;
              }

              return (
                <div className="module" key={key}>
                  {type === "datasource" && (
                    <DatasourceModule
                      stepIndex={index}
                      step={steps && steps[index]}
                    />
                  )}

                  {type === "form" && (
                    <FormModule
                      stepIndex={index}
                      step={steps && steps[index]}
                    />
                  )}

                  {type === "computed" && (
                    <ComputedModule
                      stepIndex={index}
                      step={steps && steps[index]}
                    />
                  )}
                </div>
              );
            })}

            <Add addModule={this.addModule}/>
          </div>

          {error && (
            <Alert message={error} type="error" style={{ marginBottom: 10 }} />
          )}

          <Button
            size="large"
            type="primary"
            onClick={this.handleSave}
            loading={loading}
          >
            Save
          </Button>

          <div className="module_toolbox">
            <div className="wrapper">
              <h2>Components</h2>
              {MODULES.map(modProps => (
                <Module
                  {...modProps}
                  key={modProps.label}
                  addModule={this.addModule}
                />
              ))}
            </div>
          </div>
        </div>
      </ModelContext.Provider>
    );
  }
}

export default Form.create()(Model);
