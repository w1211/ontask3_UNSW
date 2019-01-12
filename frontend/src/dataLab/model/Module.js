import React, { Component } from "react";
import { DragSource } from "react-dnd";
import { Icon } from "antd";

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
  render() {
    const {
      isDragging,
      connectDragSource,
      type,
      label,
      icon,
      addModule
    } = this.props;

    return connectDragSource(
      <div
        className={`module ${type} ${isDragging ? "dragging" : ""}`}
        onClick={() => addModule(type)}
      >
        <Icon type={icon} />
        <span>{label}</span>
      </div>
    );
  }
}

export default DragSource("module", dragSource, collect)(Module);
