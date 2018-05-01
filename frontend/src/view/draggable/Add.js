import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropTarget } from 'react-dnd';
import { Icon, Tooltip } from 'antd';
import flow from 'lodash/flow';
import { connect } from 'react-redux';

import { addModule } from '../ViewActions';


const dropTarget = {	
  drop(props, monitor, component) {
		const { dispatch } = props;

		const item = monitor.getItem();
		dispatch(addModule(item));

    // Return a value to monitor.getDropResult()
    // in the drag source's endDrag() method
    return { dropped: true };
  }
};

const collect = (connect, monitor) => {
	const mod = monitor.getItem();

	return {
    connectDropTarget: connect.dropTarget(),
		hovered: monitor.isOver(),
		type: mod && mod.type 
  };
}


class Add extends Component {
	static propTypes = {
		connectDropTarget: PropTypes.func.isRequired,
		hovered: PropTypes.bool.isRequired,
		type: PropTypes.string
	};

	render() {
		const { connectDropTarget, type, hovered } = this.props;

		return connectDropTarget(
			<div>
				<Tooltip placement="right" title="Drag and drop a component here in order to add it to the DataLab">
					<div className={`add item ${hovered && type}`}>
						<Icon type="plus"/>
						<span>Add Module</span>
					</div>
				</Tooltip>
			</div>
		);	
	};
};

export default flow(
	DropTarget('module', dropTarget, collect),
	connect()
)(Add);
