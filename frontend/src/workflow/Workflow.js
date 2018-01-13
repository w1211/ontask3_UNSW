import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Breadcrumb, Layout, Menu, Icon, Spin, notification } from 'antd';
import { Switch, Route, Redirect } from 'react-router-dom';

import { fetchWorkflow } from './WorkflowActions';
import MatrixDefinitionForm from './MatrixDefinitionForm';
import DataView from './DataView';
import RulesForm from './RulesForm';

import * as WorkflowActionCreators from './WorkflowActions';

const { Content, Sider } = Layout;


class Workflow extends React.Component {
  constructor(props) { 
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.didUpdate) {
      notification['success']({
        message: `${nextProps.model.charAt(0).toUpperCase() + nextProps.model.slice(1)} updated`,
        description: `The ${nextProps.model} was successfuly updated.`,
      });
    }
  }

  render() {
    const { 
      match, location, isFetching, name, datasources, matrix, workflowLoading
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
                    <Route path={`${match.path}/data`} component={DataView}/>
                    <Route path={`${match.path}/rules`} component={RulesForm}/>
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
    isFetching, name, matrix, actions, datasources, 
    workflowLoading, workflowError, didUpdate, model
  } = state.workflow;
  return {
    isFetching, name, matrix, actions, datasources,
    workflowLoading, workflowError, didUpdate, model
  };
}

export default connect(mapStateToProps)(Workflow)
