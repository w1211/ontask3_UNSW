import React from "react";
import {
  Button,
  Form,
  Input,
  message,
  Alert,
  Tooltip,
  notification,
  Affix,
  Icon
} from "antd";
import _ from "lodash";
import memoize from "memoize-one";

import DatasourceModule from "./datasource/Datasource";
import FormModule from "./form/Form";
import ComputedModule from "./computed/Computed";

import ModelContext from "./ModelContext";

import apiRequest from "../../shared/apiRequest";

const FormItem = Form.Item;

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
          if (!selectedId)
            history.push({ pathname: `/datalab/${dataLab.id}/data` });
        },
        onError: error => {
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
    const {
      form,
      datasources,
      dataLabs,
      forms,
      actions,
      name,
      selectedId
    } = this.props;
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
          dataLabs,
          forms,
          actions,
          deleteModule: this.deleteModule,
          hasDependency: this.hasDependency,
          updateStep: this.updateStep
        }}
      >
        <div className="model" style={{ maxWidth: 1300 }}>
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

          <Affix offsetTop={25}>
            <div className="components">
              <div>Components</div>
              <div>
                <Tooltip title="Add a datasource module">
                  <Button
                    icon="database"
                    size="large"
                    className="datasource"
                    onClick={() => this.addModule("datasource")}
                  />
                </Tooltip>
                <Tooltip title="Add a form module">
                  <Button
                    icon="form"
                    size="large"
                    className="form"
                    onClick={() => this.addModule("form")}
                  />
                </Tooltip>
                <Tooltip title="Add a computed fields module">
                  <Button
                    icon="calculator"
                    size="large"
                    className="computed"
                    onClick={() => this.addModule("computed")}
                  />
                </Tooltip>
              </div>
            </div>
          </Affix>

          <div className="build">
            {stepKeys.length > 0 ? (
              stepKeys.map((key, index) => {
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
              })
            ) : (
              <div>
                <Icon
                  type="info-circle"
                  theme="twoTone"
                  style={{ marginRight: 5 }}
                />
                Add your first component by clicking the Datasource module in
                the Components toolbox above.
              </div>
            )}
          </div>

          {error && (
            <Alert message={error} type="error" style={{ marginBottom: 10 }} />
          )}

          <Button type="primary" onClick={this.handleSave} loading={loading}>
            {selectedId ? "Save" : "Submit"}
          </Button>
        </div>
      </ModelContext.Provider>
    );
  }
}

export default Form.create()(Model);
