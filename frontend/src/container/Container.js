import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Icon, Button, Modal, notification } from 'antd';

import { fetchContainers } from './ContainerActions';
import ContainerForm from './ContainerForm';
import ContainerList from './ContainerList';
import WorkflowForm from './WorkflowForm';

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
      switch (nextProps.model) {
        case 'container':
          notification['success']({
            message: 'Container created',
            description: 'Next you should consider adding data sources and workflows to the container.'
          });
          this.containerCreateForm.resetFields();
          break;
        case 'workflow':
          notification['success']({
            message: 'Workflow created',
            description: 'The workflow was successfuly created.'
          });
          this.workflowCreateForm.resetFields();
          break;
        default:
          break;
      }
    }

    if (nextProps.didUpdate) {
      switch (nextProps.model) {
        case 'container':
          notification['success']({
            message: 'Container updated',
            description: 'The container was successfuly updated.',
          });
          this.containerUpdateForm.resetFields();
          break;
        case 'workflow':
          notification['success']({
            message: 'Workflow updated',
            description: 'The workflow was successfuly updated.'
          });
          break;
        default:
          break;
      }
    }

    if (nextProps.didDelete) {
      switch (nextProps.model) {
        case 'container':
          notification['success']({
            message: 'Container deleted',
            description: 'The container and its asssociated data sources and workflows have been successfully deleted.',
          });
          break;
        case 'workflow':
          notification['success']({
            message: 'Workflow deleted',
            description: 'The workflow and its asssociated data matrices and rules have been successfully deleted.',
          });
          break;
        default:
          break;
      }
    }

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

  onDeleteWorkflow = (workflow) => {
    let deleteWorkflow = this.boundActionCreators.deleteWorkflow;
    confirm({
      title: 'Confirm workflow deletion',
      content: 'All associated data matrices and rules will be irrevocably deleted with the workflow.',
      okText: 'Continue with deletion',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteWorkflow(workflow);
      }
    });
  }

  render() {
    const { 
      containers, dispatch, 
      createContainerVisible, isCreating, createError,
      updateContainerVisible, isUpdating, updateError, selectedContainer,
      createWorkflowVisible, updateWorkflowVisible, selectedWorkflow
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
          visible={createContainerVisible}
          loading={isCreating}
          error={createError}
          ref={(form) => {this.containerCreateForm = form}}
        />
        
        { containers.length > 0 ?
          <div>
            <ContainerForm 
              onOk={this.boundActionCreators.updateContainer}
              onCancel={() => {dispatch(this.boundActionCreators.closeUpdateContainer)}} 
              visible={updateContainerVisible}
              loading={isUpdating}
              error={updateError}
              container={selectedContainer}
              ref={(form) => {this.containerUpdateForm = form}}
            />
            <WorkflowForm 
              onOk={this.boundActionCreators.createWorkflow}
              onCancel={() => {dispatch(this.boundActionCreators.closeCreateWorkflow)}} 
              visible={createWorkflowVisible}
              loading={isCreating}
              error={createError}
              container={selectedContainer}
              ref={(form) => {this.workflowCreateForm = form}}
            />
            <WorkflowForm 
              onOk={this.boundActionCreators.updateWorkflow}
              onCancel={() => {dispatch(this.boundActionCreators.closeUpdateWorkflow)}} 
              visible={updateWorkflowVisible}
              loading={isUpdating}
              error={updateError}
              container={selectedContainer}
              workflow={selectedWorkflow}
              ref={(form) => {this.workflowUpdateForm = form}}
            />
            <ContainerList
              containers={containers} 
              onEditContainer={(container) => {dispatch(this.boundActionCreators.openUpdateContainer(container))}}
              onDeleteContainer={this.onDeleteContainer}
              onCreateWorkflow={(container) => {dispatch(this.boundActionCreators.openCreateWorkflow(container))}}
              onEditWorkflow={(container, workflow) => {dispatch(this.boundActionCreators.openUpdateWorkflow(container, workflow))}}
              onDeleteWorkflow={this.onDeleteWorkflow}
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
  containers: PropTypes.array.isRequired
}

const mapStateToProps = (state) => {
  const { 
    isFetching, items: containers, 
    isCreating, didCreate, createError,
    isUpdating, didUpdate, updateError, 
    didDelete, model, selectedContainer, selectedWorkflow,
    createContainerVisible, updateContainerVisible, 
    createWorkflowVisible, updateWorkflowVisible
  } = state.containers;
  return { 
    isFetching, 
    containers,
    isCreating,
    didCreate,
    createError,
    isUpdating,
    didUpdate,
    updateError,
    didDelete,
    model,
    selectedContainer,
    selectedWorkflow,
    createContainerVisible,
    updateContainerVisible,
    createWorkflowVisible,
    updateWorkflowVisible
  };
}

export default connect(mapStateToProps)(Container)
