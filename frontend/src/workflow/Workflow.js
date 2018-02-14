import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, Switch, Route, Redirect } from 'react-router-dom';
import { Layout, Breadcrumb, Icon, Modal, notification, Spin, Menu } from 'antd';

import * as WorkflowActionCreators from './WorkflowActions';

import Details from './Details';
import DataView from './DataView';
import Compose from './Compose';
import FilterModal from './FilterModal';
import ConditionGroupModal from './ConditionGroupModal';
import Action from './Action';

const confirm = Modal.confirm;
const { Content, Sider } = Layout;


class Workflow extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.didCreate) {
      switch (nextProps.model) {
        case 'rule':
          notification['success']({
            message: 'Rule created',
            description: 'Next you should consider defining the filter and condition groups and adding actions.'
          });
          break;
        case 'condition group':
          notification['success']({
            message: 'Condition group created',
            description: 'The condition group was successfuly created.'
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
      notification['success']({
        message: `${nextProps.model.charAt(0).toUpperCase() + nextProps.model.slice(1)} deleted`,
        description: `The ${nextProps.model} was successfuly deleted.`,
      });
    }
  }

  confirmConditionGroupDelete = (workflowId, conditionGroupIndex) => {
    let deleteRule = this.boundActionCreators.deleteConditionGroup;
    confirm({
      title: 'Confirm condition group deletion',
      content: 'Are you sure you want to delete this condition group?',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteRule(workflowId, conditionGroupIndex);
      }
    });
  }

  componentDidMount() {
    const { match } = this.props;
    this.boundActionCreators.fetchWorkflow(match.params.id);
  };

  render() {
    const {
      dispatch, isFetching, match, location, name, details, conditionGroups, datasources,
      detailsLoading, detailsError,
      dataLoading, dataError, data, columns,
      filterModalVisible, filterLoading, filterError, filter, filterFormState,
      conditionGroupModalVisible, conditionGroupLoading, conditionGroupError, conditionGroup, conditionGroupFormState,
      actionEditorState, actionContentLoading, actionContentError, schedule,
      emailLoading, emailError, emailSettings, emailSuccess,
      previewContentModalVisible, previewContentLoading, previewContent
    } = this.props;

    return (
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item><Link to="/">Dashboard</Link></Breadcrumb.Item>
          <Breadcrumb.Item><Link to="/containers">Containers</Link></Breadcrumb.Item>
          <Breadcrumb.Item>Workflow</Breadcrumb.Item>
        </Breadcrumb>
        <Layout style={{ padding: '24px 0', background: '#fff' }}>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            <Layout style={{ background: '#fff' }}>
              <Sider width={200}>
                <Menu
                  mode="inline"
                  selectedKeys={[location.pathname.split("/")[3]]}
                  style={{ height: '100%' }}
                >
                  <Menu.Item key="back">
                    <Link to="/containers">
                      <Icon type="arrow-left" />
                      <span>Back to containers</span>
                    </Link>
                  </Menu.Item>
                  <Menu.Divider/>
                  <Menu.Item key="details">
                    <Link to={`${match.url}/details`}>
                      <Icon type="appstore" />
                      <span>Details</span>
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="data">
                    <Link to={`${match.url}/data`}>
                      <Icon type="table" />
                      <span>Data view</span>
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="compose">
                    <Link to={`${match.url}/compose`}>
                      <Icon type="form" />
                      <span>Compose</span>
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="action">
                    <Link to={`${match.url}/action`}>
                      <Icon type="schedule" />
                      <span>Action</span>
                    </Link>
                  </Menu.Item>
                </Menu>
              </Sider>
              <Content style={{ padding: '0 24px', minHeight: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
                  <h1 style={{ display: 'inline-block', margin: 0 }}>{name}</h1>
                </div>
                { isFetching ?
                  <Spin size="large" />
                :
                  <Switch>
                    <Redirect exact from={match.url} to={`${match.url}/details`}/>
                    <Route path={`${match.url}/details`} render={()=>
                      <Details
                        loading={detailsLoading}
                        error={detailsError}
                        datasources={datasources}
                        details={details}

                        addSecondaryColumn={this.boundActionCreators.addSecondaryColumn}
                        deleteSecondaryColumn={this.boundActionCreators.deleteSecondaryColumn}
                        onUpdate={(details) => { this.boundActionCreators.updateDetails(match.params.id, details) }}
                      />}
                    />
                    <Route path={`${match.url}/data`} render={()=>
                      <DataView
                        loading={dataLoading}
                        error={dataError}
                        data={data}
                        details={details}
                        columns={columns}

                        fetchData={() => { this.boundActionCreators.fetchData(match.params.id) }}
                      />}
                    />
                    <Route path={`${match.url}/compose`} render={()=>
                      <div>
                        <FilterModal
                          visible={filterModalVisible}
                          loading={filterLoading}
                          error={filterError}
                          details={details}
                          formState={filterFormState}

                          onUpdate={(payload) => { this.boundActionCreators.updateFilter(match.params.id, payload) }}
                          onCancel={() => { dispatch(this.boundActionCreators.closeFilterModal()) }}

                          addFormula={this.boundActionCreators.addFormulaToFilter}
                          deleteFormula={this.boundActionCreators.deleteFormulaFromFilter}
                          updateFormState={this.boundActionCreators.updateFilterFormState}
                        />
                        <ConditionGroupModal
                          visible={conditionGroupModalVisible}
                          loading={conditionGroupLoading}
                          error={conditionGroupError}
                          details={details}
                          conditionGroup={conditionGroup}
                          formState={conditionGroupFormState}

                          onCreate={(payload) => { this.boundActionCreators.createConditionGroup(match.params.id, payload) }}
                          onUpdate={(conditionGroup, payload) => { this.boundActionCreators.updateConditionGroup(match.params.id, conditionGroup, payload) }}
                          onCancel={() => { dispatch(this.boundActionCreators.closeConditionGroupModal()) }}

                          addCondition={this.boundActionCreators.addConditionToConditionGroup}
                          deleteCondition={this.boundActionCreators.deleteConditionFromConditionGroup}
                          addFormula={this.boundActionCreators.addFormulaToConditionGroup}
                          deleteFormula={this.boundActionCreators.deleteFormulaFromConditionGroup}
                          updateFormState={this.boundActionCreators.updateConditionGroupFormState}
                        />
                        <Compose
                          contentLoading={actionContentLoading}
                          error={actionContentError}
                          conditionGroups={conditionGroups}
                          editorState={actionEditorState}
                          details={details}
                          filter={filter}

                          openFilterModal={() => { dispatch(this.boundActionCreators.openFilterModal(filter)) }}
                          confirmFilterDelete={this.confirmFilterDelete}

                          openConditionGroupModal={(conditionGroup) => { dispatch(this.boundActionCreators.openConditionGroupModal(conditionGroup)) }}
                          confirmConditionGroupDelete={(conditionGroupIndex) => { this.confirmConditionGroupDelete(match.params.id, conditionGroupIndex) }}

                          updateEditorState={(payload) => { dispatch(this.boundActionCreators.updateEditorState(payload)) }}
                          onUpdateContent={(payload) => { this.boundActionCreators.updateContent(match.params.id, payload) }}

                          previewLoading={previewContentLoading}
                          previewVisible={previewContentModalVisible}
                          previewContent={previewContent}
                          onPreviewContent={(payload) => { this.boundActionCreators.previewContent(match.params.id, payload) }}
                          onClosePreview={() => { dispatch(this.boundActionCreators.closePreviewContent()) }}
                        />
                      </div>
                    }/>
                    <Route path={`${match.url}/action`} render={()=>
                      <Action
                        emailLoading={emailLoading}
                        emailError={emailError}
                        emailSuccess={emailSuccess}
                        // schedule={schedule}
                        emailSettings={emailSettings}
                        details={details}

                        onSendEmail={(payload) => { this.boundActionCreators.sendEmail(match.params.id, payload) }}
                        onCreate={(payload) => this.boundActionCreators.createSchedule(match.params.id, payload)}
                        onDelete={() => this.boundActionCreators.deleteSchedule(match.params.id)}
                      />}
                    />
                  </Switch>
                }
              </Content>
            </Layout>
          </Content>
      </Layout>
    </Content>
    );
  };
};

const mapStateToProps = (state) => {
  const {
    isFetching, name, details, conditionGroups, datasources,
    didCreate, didUpdate, didDelete, model,
    detailsLoading, detailsError,
    dataLoading, dataError, data, columns,
    filterModalVisible, filterLoading, filterError, filter, filterFormState,
    conditionGroupModalVisible, conditionGroupLoading, conditionGroupError, conditionGroup, conditionGroupFormState,
    actionEditorState, actionContentLoading, actionContentError, content, schedule,
    emailLoading, emailError, emailSettings, emailSuccess,
    previewContentModalVisible, previewContentLoading, previewContent
  } = state.workflow;
  return {
    isFetching, name, details, conditionGroups, datasources,
    didCreate, didUpdate, didDelete, model,
    detailsLoading, detailsError,
    dataLoading, dataError, data, columns,
    filterModalVisible, filterLoading, filterError, filter, filterFormState,
    conditionGroupModalVisible, conditionGroupLoading, conditionGroupError, conditionGroup, conditionGroupFormState,
    actionEditorState, actionContentLoading, actionContentError, content, schedule,
    emailLoading, emailError, emailSettings, emailSuccess,
    previewContentModalVisible, previewContentLoading, previewContent
  };
}

export default connect(mapStateToProps)(Workflow)
