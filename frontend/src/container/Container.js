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
    if (this.props.containerModalVisible && !nextProps.containerModalVisible) this.containerForm.resetFields();
    if (this.props.workflowModalVisible && !nextProps.workflowModalVisible) this.workflowForm.resetFields();

    if (nextProps.didCreate) {
      switch (nextProps.model) {
        case 'container':
          notification['success']({
            message: 'Container created',
            description: 'Next you should consider adding data sources and workflows to the container.'
          });
          break;
        case 'workflow':
          notification['success']({
            message: 'Workflow created',
            description: 'The workflow was successfuly created.'
          });
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
      containerModalVisible, containerLoading, containerError, selectedContainer,
      workflowModalVisible, workflowLoading, workflowError, selectedWorkflow
    } = this.props;

    return (
      <div>
        <h1>Containers</h1>

        <Button 
          onClick={() => {dispatch(this.boundActionCreators.openContainerModal())}} 
          type="primary" icon="plus" size="large" style={{marginBottom: '20px'}}
        >
          New container
        </Button>
        <ContainerForm 
          onCreate={this.boundActionCreators.createContainer}
          onUpdate={this.boundActionCreators.updateContainer}
          onCancel={() => {dispatch(this.boundActionCreators.closeContainerModal)}} 
          visible={containerModalVisible}
          loading={containerLoading}
          error={containerError}
          container={selectedContainer}
          ref={(form) => {this.containerForm = form}}
        />
        { containers.length > 0 ?
          <div>
            <WorkflowForm 
              onCreate={this.boundActionCreators.createWorkflow}
              onUpdate={this.boundActionCreators.updateWorkflow}
              onCancel={() => {dispatch(this.boundActionCreators.closeWorkflowModal)}} 
              visible={workflowModalVisible}
              loading={workflowLoading}
              error={workflowError}
              container={selectedContainer}
              workflow={selectedWorkflow}
              ref={(form) => {this.workflowForm = form}}
            />
            <ContainerList
              containers={containers} 
              onEditContainer={(container) => {dispatch(this.boundActionCreators.openContainerModal(container))}}
              onDeleteContainer={this.onDeleteContainer}
              onCreateWorkflow={(container) => {dispatch(this.boundActionCreators.openWorkflowModal(container))}}
              onEditWorkflow={(container, workflow) => {dispatch(this.boundActionCreators.openWorkflowModal(container, workflow))}}
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
    containerModalVisible, containerLoading, containerError, selectedContainer,
    workflowModalVisible, workflowLoading, workflowError, selectedWorkflow,
    didCreate, didUpdate, didDelete, model
  } = state.containers;
  return { 
    isFetching, containers,
    containerModalVisible, containerLoading, containerError, selectedContainer,
    workflowModalVisible, workflowLoading, workflowError, selectedWorkflow,
    didCreate, didUpdate, didDelete, model
  };
}

export default connect(mapStateToProps)(Container)
