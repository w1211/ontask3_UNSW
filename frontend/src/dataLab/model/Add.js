import React, { Component } from "react";
import { DropTarget } from "react-dnd";
import { Icon, Tooltip } from "antd";

const dropTarget = {
  drop(props, monitor, component) {
    const { addModule } = props;

    const item = monitor.getItem();
    addModule(item.type);
  }
};

const collect = (connect, monitor) => {
  const mod = monitor.getItem();

  return {
    connectDropTarget: connect.dropTarget(),
    hovered: monitor.isOver(),
    type: mod && mod.type
  };
};

class Add extends Component {
  render() {
    const { connectDropTarget, hovered, type } = this.props;

    return connectDropTarget(
      <div>
        <Tooltip
          placement="right"
          title="Drag and drop a component here in order to add it to the DataLab"
        >
          <div className={`add_module ${hovered && type}`}>
            <Icon type="plus" />
            <span>Add Module</span>
          </div>
        </Tooltip>
      </div>
    );
  }
}

export default DropTarget("module", dropTarget, collect)(Add);
