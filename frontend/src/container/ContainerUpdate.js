import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Alert } from 'antd';

import ModalForm from '../shared/ModalForm';
import ContainerForm from './ContainerForm';

import { closeUpdateContainer, updateContainer } from './ContainerActions';

class ContainerUpdate extends React.Component {
  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch(closeUpdateContainer());
  }

  handleUpdate = () => {
    const { dispatch } = this.props;
    this.form.validateFields((err, values) => {
      if (err) {
        return;
      }
      dispatch(updateContainer(this.props.selected._id['$oid'], values));
    });
  }

  updateContainerRef = (form) => {
    this.form = form;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.selected === null) this.form.resetFields();
  }

  render() {
      return (
        <ModalForm 
          visible={this.props.updateModalVisible} 
          title="Update container"
          okText="Update"
          onCancel={this.handleCancel} 
          onOk={this.handleUpdate}
          isLoading={this.props.isUpdating}
        >
          <ContainerForm ref={this.updateContainerRef} container={this.props.selected}/>
          { this.props.updateError && <Alert message={this.props.updateError} type="error"/>}
        </ModalForm>
      );
  }
  
}

ContainerUpdate.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStateToProps = (state) => {
  const { isUpdating, updateError, updateModalVisible, selected } = state.containers;
  return { 
    isUpdating,
    updateError,
    updateModalVisible,
    selected
  };
}

export default connect(mapStateToProps)(ContainerUpdate)
