import React from "react";
import { Card, Icon, Tooltip, Select, Popover } from "antd";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import _ from "lodash";

import * as DataLabActionCreators from "../DataLabActions";

class ComputedModule extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = {};
  }

  componentDidMount() {
    const { build, stepIndex } = this.props;

    this.setState({
      currentStep: build.steps[stepIndex].computed,
      errors: build.errors.steps[stepIndex]
    });
  }

  modifyComputedField = (field, fieldIndex) => {
    const { stepIndex, openComputedFieldModal } = this.props;
    const { usedLabels } = this.props;

    const updateBuild = (fieldName, value, isNotField) => {
      this.boundActionCreators.updateBuild({
        stepIndex,
        field: fieldName,
        value,
        isNotField
      });
    };
    
    openComputedFieldModal({
      stepIndex,
      usedLabels: usedLabels.map(item => item.label),
      field,
      fieldIndex,
      updateBuild
    });
  };

  render() {
    const { stepIndex, build, validate } = this.props;
    const { currentStep } = this.state;

    if (!currentStep) return null;

    // Initialize the array that will hold the modules' actions
    let actions = [
      <Tooltip title="Add computed field">
        <Icon type="plus" onClick={() => this.modifyComputedField()} />
      </Tooltip>
    ];

    // If this is the last step, show the delete button
    if (build.steps.length === stepIndex + 1)
      actions.push(
        <Tooltip title="Remove computed fields">
          <Icon
            type="delete"
            onClick={() => this.boundActionCreators.deleteModule()}
          />
        </Tooltip>
      );

    return (
      <Card
        className="computed"
        actions={actions}
        title={
          <div className="title">
            <div className="step_number">{stepIndex + 1}</div>
            <Icon type="calculator" className="title_icon" />
            Computed Fields
          </div>
        }
      >
        {_.get(currentStep, "fields", []).length === 0 ? (
          validate({ field: "fields", stepIndex }) ? (
            <p className="error">At least one computed field must be added.</p>
          ) : (
            <p>Add a computed field by clicking the button below.</p>
          )
        ) : (
          <Tooltip
            title="Edit a given field by clicking on its name"
            placement="right"
          >
            <Select
              disabled
              mode="tags"
              dropdownStyle={{ display: "none" }}
              labelInValue={true}
              className="fields"
              value={currentStep.fields.map((field, fieldIndex) => {
                const label = field.name;

                const truncatedLabel =
                  label.length > 20 ? `${label.slice(0, 20)}...` : label;

                return {
                  key: label,
                  label: (
                    <span
                      onClick={() =>
                        this.modifyComputedField(field, fieldIndex)
                      }
                    >
                      {truncatedLabel !== label ? (
                        <Popover
                          content={label}
                          overlayStyle={{ zIndex: 2000 }}
                          mouseLeaveDelay={0}
                        >
                          {truncatedLabel}
                        </Popover>
                      ) : (
                        label
                      )}
                    </span>
                  )
                };
              })}
            />
          </Tooltip>
        )}
      </Card>
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

export default connect(mapStateToProps)(ComputedModule);
