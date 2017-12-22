import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Button } from 'antd';

import ModalForm from '../shared/ModalForm';
import ContainerForm from './ContainerForm';

import { openCreateContainer, closeCreateContainer, createContainer } from './ContainerActions';

class ContainerCreate extends React.Component {
  state = {
    visible: false,
  };
  
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
      nextProps.isSaving === false &&
      nextProps.submitError === null &&
      nextProps.modalVisible === false
    ) {
      this.form.resetFields()
    }
  }

  render() {
      return (
        <div>
          <Button onClick={this.showModal} type="primary" icon="plus" size="large" style={{marginBottom: '20px'}}>
            New container
          </Button>
          <ModalForm 
            visible={this.props.modalVisible} 
            title="Create container"
            okText="Create"
            onCancel={this.handleCancel} 
            onOk={this.handleCreate}
            isLoading={this.props.isSaving}
          >
            <ContainerForm ref={this.createContainerRef}/>
            {this.props.submitError}
          </ModalForm>
        </div>
      );
  }
  
}

ContainerCreate.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStateToProps = (state) => {
  const { isSaving, submitError, modalVisible } = state.containers;
  return { 
    isSaving,
    submitError,
    modalVisible
  };
}

export default connect(mapStateToProps)(ContainerCreate)
