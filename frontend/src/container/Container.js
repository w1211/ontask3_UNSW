import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Icon, Button, Modal, notification } from 'antd';

import { fetchContainers } from './ContainerActions';
import ContainerForm from './ContainerForm';
import ContainerList from './ContainerList';

import * as ContainerActionCreators from './ContainerActions';

const confirm = Modal.confirm;


class Container extends React.Component {
  constructor(props) { 
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(ContainerActionCreators, dispatch)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.didCreate) {
      notification['success']({
        message: 'Container created',
        description: 'Next you should consider adding data sources and workflows to the container.'
      });
    }

    if (nextProps.didUpdate) {
      notification['success']({
        message: 'Container updated',
        description: 'The container was successfuly updated.',
      });
      this.containerUpdateForm.resetFields();
    }

    if (nextProps.didDelete) {
      notification['success']({
        message: 'Container deleted',
        description: 'The container and its asssociated data sources and workflows has been successfully deleted.',
      });
    }

  }

  containerUpdateFormRef = (form) => {
    this.containerUpdateForm = form;
  }

  onDeleteContainer = (container) => {
    let deleteContainer = this.boundActionCreators.deleteContainer;
    confirm({
      title: 'Confirm container deletion',
      content: 'All associated datasources and workflows will be irrevocably deleted with the container.',
      okText: 'Continue with deletion',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteContainer(container);
      }
    });
  }

  render() {
    const { 
      containers, dispatch, 
      createModalVisible, isCreating, createError,
      updateModalVisible, isUpdating, updateError, selectedContainer
    } = this.props;

    return (
      <div>
        <h1>Containers</h1>

        <Button 
          onClick={() => {dispatch(this.boundActionCreators.openCreateContainer)}} 
          type="primary" icon="plus" size="large" style={{marginBottom: '20px'}}
        >
          New container
        </Button>
        <ContainerForm 
          onOk={this.boundActionCreators.createContainer} 
          onCancel={() => {dispatch(this.boundActionCreators.closeCreateContainer)}} 
          visible={createModalVisible}
          loading={isCreating}
          error={createError}
        />
        
        { containers.length > 0 ?
          <div>
            <ContainerForm 
              onOk={this.boundActionCreators.updateContainer}
              onCancel={() => {dispatch(this.boundActionCreators.closeUpdateContainer)}} 
              visible={updateModalVisible}
              loading={isUpdating}
              error={updateError}
              container={selectedContainer}
              ref={this.containerUpdateFormRef}
            />
            <ContainerList
              containers={containers} 
              onEditContainer={(container) => {dispatch(this.boundActionCreators.openUpdateContainer(container))}}
              onDeleteContainer={this.onDeleteContainer}
            />
          </div>
        :
          <h2>
            <Icon type="info-circle-o" style={{marginRight: '10px'}}/>
            Get started by creating your first container.
          </h2>
        }
      </div>
    );
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fetchContainers());
  };

};

Container.propTypes = {
  dispatch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  containers: PropTypes.array.isRequired
}

const mapStateToProps = (state) => {
  const { 
    isFetching, items: containers, 
    createModalVisible, isCreating, didCreate, createError,
    updateModalVisible, isUpdating, didUpdate, updateError, selectedContainer,
    didDelete
  } = state.containers;
  return { 
    isFetching, 
    containers,
    createModalVisible,
    isCreating,
    didCreate,
    createError,
    updateModalVisible,
    isUpdating,
    didUpdate,
    updateError,
    selectedContainer, 
    didDelete
  };
}

export default connect(mapStateToProps)(Container)
