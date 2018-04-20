import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';
import { Icon } from 'antd';


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
		type: PropTypes.string.isRequired,
	};

	render() {
		const { isDragging, connectDragSource, type, label, icon } = this.props;

		return connectDragSource(
			<div className={`item ${type} ${isDragging ? 'dragging' : ''}`}>
				<Icon type={icon}/>
				<span>{label}</span>
			</div>
		);
	};
};

export default DragSource('module', dragSource, collect)(Module);
