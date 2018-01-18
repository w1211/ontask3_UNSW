import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Breadcrumb, Layout, Menu, Icon, Spin, notification, Modal } from 'antd';
import { Switch, Route, Redirect } from 'react-router-dom';

import { fetchWorkflow } from './WorkflowActions';
import MatrixDefinitionForm from './MatrixDefinitionForm';
import DataView from './DataView';
import Rules from './Rules';

import * as WorkflowActionCreators from './WorkflowActions';

const { Content, Sider } = Layout;
const confirm = Modal.confirm;


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

  onDeleteRule = (workflow, rule) => {
    let deleteRule = this.boundActionCreators.deleteRule;
    confirm({
      title: 'Confirm rule deletion',
      content: 'Are you sure you want to delete this rule?',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteRule(workflow, rule);
      }
    });
  }

  onDeleteConditionGroup = (workflow, rule, conditionGroupIndex) => {
    let deleteRule = this.boundActionCreators.deleteConditionGroup;
    confirm({
      title: 'Confirm condition group deletion',
      content: 'Are you sure you want to delete this condition group?',
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteRule(workflow, rule, conditionGroupIndex);
      }
    });
  }

  render() {
    const { 
      dispatch, match, location, isFetching, name, datasources, matrix, workflowLoading, actions,
      isFetchingData, data, columns, dataError,
      ruleModalVisible, selectedRule, ruleLoading, ruleError, activeRuleAccordion,
      conditionGroupModalVisible, selectedConditionGroup, conditionGroupLoading, conditionGroupError, transitoryConditionGroup,
      conditionGroupForm
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
            <Layout style={{background: '#fff'}}>
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
                  <Menu.Item key="matrix">
                    <Link to={`${match.url}/matrix`}>
                      <Icon type="appstore" />
                      <span>Matrix definition</span>
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="data">
                    <Link to={`${match.url}/data`}>
                      <Icon type="table" />
                      <span>Data view</span>
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="rules">
                    <Link to={`${match.url}/rules`}>
                      <Icon type="form" />
                      <span>Rules</span>
                    </Link>
                  </Menu.Item>
                </Menu>
              </Sider>
              <Content style={{ padding: '0 24px', minHeight: 280 }}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '1em'}}>
                  <h1 style={{display: 'inline-block', margin: 0}}>{name}</h1>
                </div>
                { isFetching ? 
                  <Spin size="large" />
                :
                  <Switch>
                    <Redirect exact from={match.url} to={`${match.url}/matrix`}/>
                    <Route path={`${match.url}/matrix`} render={()=>
                      <MatrixDefinitionForm 
                        datasources={datasources} 
                        matrix={matrix}
                        addSecondaryColumn={this.boundActionCreators.addSecondaryColumn}
                        deleteSecondaryColumn={this.boundActionCreators.deleteSecondaryColumn}
                        ref={(form) => {this.matrixDefinitionForm = form}}
                        onUpdate={(matrix) => {this.boundActionCreators.defineMatrix(match.params.id, matrix)}}
                        loading={workflowLoading}
                      />}
                    />
                    <Route path={`${match.url}/data`} render={()=>
                      <DataView 
                        fetchMatrixData={() => { this.boundActionCreators.fetchMatrixData(match.params.id) }}
                        isFetchingData={isFetchingData}
                        data={data}
                        columns={columns}
                        dataError={dataError}
                      />}
                    />
                    <Route path={`${match.url}/rules`} render={()=>
                      <Rules 
                        ruleModalVisible = {ruleModalVisible}
                        selectedRule = {selectedRule}
                        ruleLoading = {ruleLoading}
                        ruleError = {ruleError}
                        openRuleModal= {(rule) => { dispatch(this.boundActionCreators.openRuleModal(rule)) }}
                        onCancelRule = {() => { dispatch(this.boundActionCreators.closeRuleModal) }}
                        onCreateRule = {(rule) => this.boundActionCreators.createRule(match.params.id, rule)}
                        onUpdateRule = {(rule, payload) => this.boundActionCreators.updateRule(match.params.id, rule, payload)}
                        rules = {actions}
                        activeRuleAccordion = {activeRuleAccordion}
                        changeActiveAccordion = {(key) => this.boundActionCreators.changeActiveRuleAccordion(key)}
                        onDeleteRule = {(rule) => { this.onDeleteRule(match.params.id, rule) }}
                        conditionGroupModalVisible = {conditionGroupModalVisible}
                        selectedConditionGroup = {selectedConditionGroup}
                        conditionGroupLoading = {conditionGroupLoading}
                        conditionGroupError = {conditionGroupError}
                        openConditionGroupModal = {(rule) => { dispatch(this.boundActionCreators.openConditionGroupModal(rule)) }}
                        onCancelConditionGroup = {() => { dispatch(this.boundActionCreators.closeConditionGroupModal) }}
                        onChangeConditionGroup = {this.boundActionCreators.changeConditionGroup}
                        onCreateConditionGroup = {(actionId, payload) => this.boundActionCreators.createConditionGroup(match.params.id, actionId, payload)}
                        onUpdateConditionGroup = {(actionId, selected, payload) => this.boundActionCreators.updateConditionGroup(match.params.id, actionId, selected, payload)}
                        onDeleteConditionGroup = {(actionId, index) => this.onDeleteConditionGroup(match.params.id, actionId, index)}
                        matrix = {matrix}
                        transitoryConditionGroup = {transitoryConditionGroup}
                        addCondition = {this.boundActionCreators.addCondition}
                        addFormula = {(conditionIndex) => { this.boundActionCreators.addFormula(conditionIndex) }}
                        deleteCondition = {(index) => { this.boundActionCreators.deleteCondition(index) }}
                        deleteFormula = {(conditionIndex, formulaIndex) => { this.boundActionCreators.deleteFormula(conditionIndex, formulaIndex) }}
                        conditionGroupForm = {conditionGroupForm}
                        updateConditionGroupForm = {(payload) => { dispatch(this.boundActionCreators.mergeConditionGroupForm(payload)) }}
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

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(fetchWorkflow(match.params.id));
  };

};

Workflow.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStateToProps = (state) => {
  const {
    isFetching, name, matrix, actions, datasources, didCreate, didUpdate, didDelete,
    workflowLoading, workflowError, model,
    isFetchingData, data, columns, dataError,
    ruleModalVisible, selectedRule, ruleLoading, ruleError, activeRuleAccordion,
    conditionGroupModalVisible, selectedConditionGroup, conditionGroupLoading, conditionGroupError, transitoryConditionGroup,
    conditionGroupForm
  } = state.workflow;
  return {
    isFetching, name, matrix, actions, datasources, didCreate, didUpdate, didDelete,
    workflowLoading, workflowError, model,
    isFetchingData, data, columns, dataError,
    ruleModalVisible, selectedRule, ruleLoading, ruleError, activeRuleAccordion,
    conditionGroupModalVisible, selectedConditionGroup, conditionGroupLoading, conditionGroupError, transitoryConditionGroup,
    conditionGroupForm
  };
}

export default connect(mapStateToProps)(Workflow)
