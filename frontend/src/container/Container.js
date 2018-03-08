import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Layout, Breadcrumb, Icon, Button, Modal, notification, Spin } from 'antd';

import * as ContainerActionCreators from './ContainerActions';
import { openViewModal } from '../view/ViewActions';
import { openDatasourceModal, deleteDatasource } from '../datasource/DatasourceActions';

import ContainerModal from './ContainerModal';
import ContainerList from './ContainerList';
import WorkflowModal from './WorkflowModal';
import DatasourceModal from '../datasource/DatasourceModal';
import ViewModal from '../view/ViewModal';

const confirm = Modal.confirm;
const { Content } = Layout;


class Container extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators({
      ...ContainerActionCreators, openViewModal, openDatasourceModal, deleteDatasource 
    }, dispatch)
  }

  componentWillReceiveProps(nextProps) {
    if (!(nextProps.didCreate || nextProps.didUpdate || nextProps.didDelete)) return;

    let message;
    let description;

    if (nextProps.didCreate) {
      message = `${nextProps.model.charAt(0).toUpperCase() + nextProps.model.slice(1)} created`;
      switch (nextProps.model) {
        case 'container':
          description = 'Next you should consider adding data sources and workflows to the container.';
          break;
        case 'workflow':
          description = 'The workflow was successfuly created.';
          break;
        case 'datasource':
          description = 'The datasource was successfuly created.';
          break;
        default:
          break;
      }
    }

    if (nextProps.didUpdate) {
      message = `${nextProps.model.charAt(0).toUpperCase() + nextProps.model.slice(1)} updated`;
      description = `The ${nextProps.model} was successfuly updated.`;
    }

    if (nextProps.didDelete) {
      message = `${nextProps.model.charAt(0).toUpperCase() + nextProps.model.slice(1)} deleted`;
      switch (nextProps.model) {
        case 'container':
          description = 'The container and its associated data sources and workflows have been successfully deleted.';
          break;
        case 'workflow':
          description = 'The workflow and its associated data matrices and rules have been successfully deleted.';
          break;
        case 'datasource':
          description = 'The datasource was successfully deleted.';
          break;
        default:
          break;
      }
    }

    notification['success']({
      message: message,
      description: description
    });
  }

  confirmContainerDelete = (containerId) => {
    let deleteContainer = this.boundActionCreators.deleteContainer;
    confirm({
      title: 'Confirm container deletion',
      content: 'All associated datasources and workflows will be irrevocably deleted with the container.',
      okText: 'Continue with deletion',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteContainer(containerId);
      }
    });
  }

  confirmWorkflowDelete = (workflowId) => {
    let deleteWorkflow = this.boundActionCreators.deleteWorkflow;
    confirm({
      title: 'Confirm workflow deletion',
      content: 'All associated data matrices and rules will be irrevocably deleted with the workflow.',
      okText: 'Continue with deletion',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteWorkflow(workflowId);
      }
    });
  }

  componentDidMount() {
    this.boundActionCreators.fetchContainers();
  };

  render() {
    const {
      dispatch, isFetching, containers, containerAccordionKey, containerId,
      containerModalVisible, containerLoading, containerError, container,
      workflowModalVisible, workflowLoading, workflowError, workflow,
      datasourceModalVisible, datasourceLoading, datasourceError, datasource, datasources,
      isExternalFile, uploadingFile
    } = this.props;

    return (
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item><Link to="/">Dashboard</Link></Breadcrumb.Item>
          <Breadcrumb.Item>Containers</Breadcrumb.Item>
        </Breadcrumb>
        <Layout style={{ padding: '24px 0', background: '#fff' }}>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            <h1>Containers</h1>
          { isFetching ?
            <Spin size="large" />
          :
            <div>
              <Button
                onClick={() => { dispatch(this.boundActionCreators.openContainerModal()) }}
                type="primary" icon="plus" size="large" style={{ marginBottom: '20px' }}
              >
                New container
              </Button>
              <ContainerModal
                visible={containerModalVisible}
                loading={containerLoading}
                error={containerError}
                container={container}

                onCreate={this.boundActionCreators.createContainer}
                onUpdate={this.boundActionCreators.updateContainer}
                onCancel={() => { dispatch(this.boundActionCreators.closeContainerModal()) }}
              />
              { containers && containers.length > 0 ?
                <div>
                  <WorkflowModal
                    visible={workflowModalVisible}
                    loading={workflowLoading}
                    error={workflowError}
                    containerId={containerId}
                    workflow={workflow}

                    onCreate={this.boundActionCreators.createWorkflow}
                    onUpdate={this.boundActionCreators.updateWorkflow}
                    onCancel={() => { dispatch(this.boundActionCreators.closeWorkflowModal()) }}
                  />

                  <DatasourceModal/>
                  
                  <ViewModal/>

                  <ContainerList
                    containers={containers}
                    activeKey={containerAccordionKey}
                    changeAccordionKey={(key) => { dispatch(this.boundActionCreators.changeContainerAccordion(key)) }}

                    openContainerModal={(container) => { dispatch(this.boundActionCreators.openContainerModal(container)) }}
                    confirmContainerDelete={this.confirmContainerDelete}

                    openWorkflowModal={(containerId, workflow) => { dispatch(this.boundActionCreators.openWorkflowModal(containerId, workflow)) }}
                    confirmWorkflowDelete={this.confirmWorkflowDelete}

                    openDatasourceModal={(containerId, datasources) => { dispatch(this.boundActionCreators.openDatasourceModal(containerId, datasources)) }}
                    openViewModal={(containerId, datasources, views) => { dispatch(this.boundActionCreators.openViewModal(containerId, datasources, views)) }}
                    deleteDatasource={this.boundActionCreators.deleteDatasource}
                  />
                </div>
              :
                <h2>
                  <Icon type="info-circle-o" style={{ marginRight: '10px' }}/>
                  Get started by creating your first container.
                </h2>
              }
            </div>
          }
          </Content>
        </Layout>
      </Content>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    isFetching, containers, containerAccordionKey, containerId,
    didCreate, didUpdate, didDelete, model,
    containerModalVisible, containerLoading, containerError, container,
    workflowModalVisible, workflowLoading, workflowError, workflow,
    datasourceModalVisible, datasourceLoading, datasourceError, datasource, datasources,
    isExternalFile, uploadingFile
  } = state.containers;
  
  return {
    isFetching, containers, containerAccordionKey, containerId,
    didCreate, didUpdate, didDelete, model,
    containerModalVisible, containerLoading, containerError, container,
    workflowModalVisible, workflowLoading, workflowError, workflow,
    datasourceModalVisible, datasourceLoading, datasourceError, datasource, datasources,
    isExternalFile, uploadingFile
  };
}

export default connect(mapStateToProps)(Container)
