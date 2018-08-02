import React, { Component } from "react";
import PropTypes from "prop-types";
import { DragSource } from "react-dnd";
import { Icon } from "antd";
import flow from "lodash/flow";
import { connect } from "react-redux";

import { addModule } from "../DataLabActions";

const dragSource = {
  beginDrag(props) {
    return {
      type: props.type
    };
  }
};

const collect = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
};

class Module extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired
  };

  render() {
    const {
      dispatch,
      isDragging,
      connectDragSource,
      type,
      label,
      icon
    } = this.props;

    return connectDragSource(
      <div
        className={`module ${type} ${isDragging ? "dragging" : ""}`}
        onClick={() => dispatch(addModule({ type }))}
      >
        <Icon type={icon} />
        <span>{label}</span>
      </div>
    );
  }
}

export default flow(
  DragSource("module", dragSource, collect),
  connect()
)(Module);
