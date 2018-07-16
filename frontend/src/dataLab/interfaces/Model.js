import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Button, Form, Input } from "antd";
import _ from "lodash";

import * as DataLabActionCreators from "../DataLabActions";

import Module from "../draggable/Module";
import Add from "../draggable/Add";

import DatasourceModule from "../modules/Datasource";
import FormModule from "../modules/Form";

import DiscrepenciesModal from "../modals/DiscrepenciesModal";
import FormFieldModal from "../modals/FormFieldModal";

const FormItem = Form.Item;

class Model extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = {
      loading: false,
      formField: { visible: false, stepIndex: null, field: null },
      discrepencies: { visible: false }
    };
  }

  componentDidMount() {
    const { build } = this.props;

    if (build)
      this.setState({
        usedDatasources: this.getUsedDatasources(),
        usedLabels: this.getUsedLabels()
      });
  }

  componentDidUpdate(prevProps) {
    const { build } = this.props;

    if (prevProps.build !== build)
      this.setState({
        usedDatasources: this.getUsedDatasources(),
        usedLabels: this.getUsedLabels()
      });
  }

  getUsedDatasources = () => {
    const { build } = this.props;

    // Identify which datasources have been used in the build
    const usedDatasources = build.steps.map(
      step => step.type === "datasource" && step.datasource.id
    );
    return usedDatasources;
  };

  getUsedLabels = () => {
    const { build } = this.props;

    // Identify the labels used in the build
    let labels = [];
    build.steps.forEach((step, stepIndex) => {
      let stepLabels;

      if (step.type === "datasource")
        stepLabels = Object.values(step.datasource.labels).map(label => ({
          stepIndex,
          label: label
        }));

      if (step.type === "form")
        stepLabels = step.form.fields.map(field => ({
          stepIndex,
          label: field.name
        }));

      labels = [...labels, ...stepLabels];
    });

    return labels;
  };

  hasDependency = (stepIndex, field) => {
    const { build } = this.props;

    const step = build.steps[stepIndex];

    if (step.type === "datasource")
      field = _.get(step, `datasource.labels[${field}]`, field);

    // Check whether this field is used as a matching field for any modules
    let relatedSteps = build.steps.slice(stepIndex + 1);

    relatedSteps = relatedSteps.filter(step => {
      if (step.type === "datasource")
        return _.get(step, "datasource.matching") === field;

      if (step.type === "form")
        return [
          _.get(step, "form.primary") === field,
          _.get(step, "form.webForm.permission") === field,
          _.get(step, "form.webForm.visibleFields", []).includes(field)
        ].includes(true);

      return false;
    });

    return relatedSteps.length > 0;
  };

  openModal = (type, props) => {
    this.setState({ [type]: { visible: true, ...props } });
  };

  closeModal = type => {
    this.setState({
      [type]: { visible: false }
    });
  };

  handleSave = () => {
    const { location, history } = this.props;

    const containerId = _.get(location, "state.containerId");

    this.boundActionCreators.saveBuild({
      containerId,
      onStart: () => this.setState({ loading: true }),
      onError: errors => this.setState({ loading: false }),
      onSuccess: dataLabId => {
        this.setState({ loading: false });
        // Redirect to data interface
        history.push({ pathname: `/datalab/${dataLabId}/data` });
      }
    });
  };

  checkDuplicateLabel = field => {
    const { build } = this.props;

    const labels = this.labelsUsed(build.steps);

    return [labels.includes(field), labels];
  };

  validate = ({ field, stepIndex }) => {
    const { build } = this.props;
    if (stepIndex !== undefined)
      return _.get(build, `errors.steps[${stepIndex}].${field}`) ? "error" : "";

    return _.get(build, `errors.${field}`) ? "error" : "";
  };

  render() {
    const { build, datasources } = this.props;
    const {
      loading,
      usedDatasources,
      usedLabels,
      formField,
      discrepencies
    } = this.state;

    if (!build || !datasources) return null;

    return (
      <div className="model">
        <h2>Details</h2>

        <div className="name">
          <FormItem
            label="Name"
            validateStatus={this.validate({ field: "name" })}
          >
            <Input
              value={build.name}
              onChange={e =>
                this.boundActionCreators.updateBuild({
                  field: "name",
                  value: e.target.value
                })
              }
            />
          </FormItem>
        </div>

        <h2>Data Model</h2>

        <div className="build">
          {build.steps.map((step, index) => (
            <div className="module" key={index}>
              {step.type === "datasource" && (
                <DatasourceModule
                  stepIndex={index}
                  usedLabels={usedLabels}
                  usedDatasources={usedDatasources}
                  hasDependency={this.hasDependency}
                  validate={this.validate}
                  openDiscrepenciesModal={props =>
                    this.openModal("discrepencies", props)
                  }
                />
              )}

              {step.type === "form" && (
                <FormModule
                  stepIndex={index}
                  usedLabels={usedLabels}
                  validate={this.validate}
                  openFormFieldModal={props =>
                    this.openModal("formField", props)
                  }
                />
              )}
            </div>
          ))}

          <Add />
        </div>

        <DiscrepenciesModal
          {...discrepencies}
          closeDiscrepenciesModal={() => this.closeModal("discrepencies")}
        />

        <FormFieldModal
          {...formField}
          hasDependency={this.hasDependency}
          closeFormFieldModal={() => this.closeModal("formField")}
        />

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
            <Module type="datasource" icon="database" label="Datasource" />
            <Module type="form" icon="form" label="Form" />
            <Module type="computed" icon="calculator" label="Computed Fields" />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { build, datasources } = state.dataLab;

  return {
    build,
    datasources
  };
};

export default connect(mapStateToProps)(Model);
