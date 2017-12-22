import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Button, Alert } from 'antd';

import ModalForm from '../shared/ModalForm';
import ContainerForm from './ContainerForm';

import { openCreateContainer, closeCreateContainer, createContainer } from './ContainerActions';

class ContainerCreate extends React.Component {
  showModal = () => {
    const { dispatch } = this.props;
    dispatch(openCreateContainer());
  }

  handleCancel = () => {
    const { dispatch } = this.props;
    dispatch(closeCreateContainer());
  }

  handleCreate = () => {
    const { dispatch } = this.props;
    this.form.validateFields((err, values) => {
      if (err) {
        return;
      }
      dispatch(createContainer(values));
    });
  }

  createContainerRef = (form) => {
    this.form = form;
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.isCreating === false &&
      nextProps.createError === null &&
      nextProps.createModalVisible === false
    ) {
      this.form.resetFields();
    }
  }

  render() {
      return (
        <div>
          <Button onClick={this.showModal} type="primary" icon="plus" size="large" style={{marginBottom: '20px'}}>
            New container
          </Button> 
          <ModalForm 
            visible={this.props.createModalVisible} 
            title="Create container"
            okText="Create"
            onCancel={this.handleCancel} 
            onOk={this.handleCreate}
            isLoading={this.props.isCreating}
          >
            <ContainerForm ref={this.createContainerRef}/>
            { this.props.createError && <Alert message={this.props.createError} type="error"/>}
            </ModalForm>
        </div>
      );
  }
  
}

ContainerCreate.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStateToProps = (state) => {
  const { isCreating, createError, createModalVisible } = state.containers;
  return { 
    isCreating,
    createError,
    createModalVisible
  };
}

export default connect(mapStateToProps)(ContainerCreate)
