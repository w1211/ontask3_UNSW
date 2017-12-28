import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Icon, Button, Modal, notification } from 'antd';

import { fetchContainers } from './ContainerActions';
import ContainerForm from './ContainerForm';
import ContainerList from './ContainerList';
import WorkflowForm from './WorkflowForm';
import DatasourceForm from './DatasourceForm';

import * as ContainerActionCreators from './ContainerActions';

const confirm = Modal.confirm;


class Container extends React.Component {
  constructor(props) { 
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(ContainerActionCreators, dispatch)
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch } = this.props;

    if (this.props.containerModalVisible && !nextProps.containerModalVisible) this.containerForm.resetFields();
    if (this.props.workflowModalVisible && !nextProps.workflowModalVisible) this.workflowForm.resetFields();
    if ((this.props.selectedDatasource && !nextProps.selectedDatasource) || (this.props.didCreate && this.props.model === 'datasource')) {
      this.datasourceForm.resetFields()
    }

    // If there is a container selected, and the list of containers is refreshed, then reselect the container
    if (this.props.isFetching && this.props.selectedContainer && !nextProps.isFetching) {
      let container = nextProps.containers.find(container => {
        return container._id['$oid'] === this.props.selectedContainer._id['$oid']
      });
      dispatch(this.boundActionCreators.reselectContainer(container));
    }

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
        case 'datasource':
          notification['success']({
            message: 'Datasource created',
            description: 'The datasource was successfuly created.'
          });
          break;
        default:
          break;
      }
    }

    if (nextProps.didUpdate) {
      notification['success']({
        message: `${nextProps.model.charAt(0).toUpperCase() + nextProps.model.slice(1)} updated`,
        description: `The ${nextProps.model} was successfuly updated.`,
      });
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
        case 'datasource':
          notification['success']({
            message: 'Datasource deleted',
            description: 'The datasource was successfully deleted.',
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

  onDeleteDatasource = (datasource) => {
    let deleteDatasource = this.boundActionCreators.deleteDatasource;
    confirm({
      title: 'Confirm datasource deletion',
      content: 'Are you sure you want to delete this datasource?',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteDatasource(datasource);
      }
    });
  }

  render() {
    const { 
      containers, dispatch,
      containerModalVisible, containerLoading, containerError, selectedContainer,
      workflowModalVisible, workflowLoading, workflowError, selectedWorkflow,
      datasourceModalVisible, datasourceLoading, datasourceError, selectedDatasource
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
            <DatasourceForm
              onChange={this.boundActionCreators.changeDatasource}
              onCreate={this.boundActionCreators.createDatasource}
              onUpdate={this.boundActionCreators.updateDatasource}
              onDelete={this.onDeleteDatasource}
              onCancel={() => {dispatch(this.boundActionCreators.closeDatasourceModal)}}
              visible={datasourceModalVisible}
              loading={datasourceLoading}
              error={datasourceError}
              container={selectedContainer}
              datasource={selectedDatasource}
              ref={(form) => {this.datasourceForm = form}}
            />
            <ContainerList
              containers={containers} 
              onEditContainer={(container) => {dispatch(this.boundActionCreators.openContainerModal(container))}}
              onDeleteContainer={this.onDeleteContainer}
              onCreateWorkflow={(container) => {dispatch(this.boundActionCreators.openWorkflowModal(container))}}
              onEditWorkflow={(container, workflow) => {dispatch(this.boundActionCreators.openWorkflowModal(container, workflow))}}
              onDeleteWorkflow={this.onDeleteWorkflow}
              onOpenDatasource={(container) => {dispatch(this.boundActionCreators.openDatasourceModal(container))}}
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
    datasourceModalVisible, datasourceLoading, datasourceError, selectedDatasource,
    didCreate, didUpdate, didDelete, model
  } = state.containers;
  return { 
    isFetching, containers,
    containerModalVisible, containerLoading, containerError, selectedContainer,
    workflowModalVisible, workflowLoading, workflowError, selectedWorkflow,
    datasourceModalVisible, datasourceLoading, datasourceError, selectedDatasource,
    didCreate, didUpdate, didDelete, model
  };
}

export default connect(mapStateToProps)(Container)
