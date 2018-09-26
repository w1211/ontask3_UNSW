import React from "react";
import { Card, Icon, Tooltip, Modal } from "antd";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

import * as DataLabActionCreators from "../DataLabActions";

class TrackingFeedbackModule extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );
  }

  handleDelete = () => {
    Modal.confirm({
      title: "Confirm feedback & tracking deletion",
      content:
        `Feedback & tracking data will only be removed from this DataLab. 
        The associated actions will still retain their data.`,
      okText: "Continue",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => this.boundActionCreators.deleteModule(true)
    });
  };

  render() {
    return (
      <Card
        className="feedback_tracking"
        actions={[
          <Tooltip title="Remove tracking & feedback">
            <Icon type="delete" onClick={this.handleDelete} />
          </Tooltip>
        ]}
        title={
          <div className="title">
            <div className="step_number">
              <Icon type="lock" />
            </div>
            <Icon type="eye" className="title_icon" />
            Tracking & Feedback
          </div>
        }
      >
        Content here
      </Card>
    );
  }
}

const mapStateToProps = state => {
  const { build, selectedId } = state.dataLab;

  return {
    build,
    selectedId
  };
};

export default connect(mapStateToProps)(TrackingFeedbackModule);
