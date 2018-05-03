import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Switch, Route, Redirect } from 'react-router-dom';
import { Layout, Breadcrumb, Icon, Spin, Menu } from 'antd';

import * as WorkflowActionCreators from './WorkflowActions';

import Compose from './interfaces/Compose';
import Email from './interfaces/Email';
import StaticPage from './interfaces/StaticPage';

import './Workflow.css';

const { Content, Sider } = Layout;


class Workflow extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch);
  };

  componentDidMount() {
    const { match } = this.props;
    this.boundActionCreators.fetchWorkflow(match.params.id);
  };

  render() {
    const { match, location, isFetching, workflow } = this.props;

    return (
      <Content style={{ padding: '0 50px' }} className="workflow">

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
                  <Menu.Item key="compose">
                    <Link to={`${match.url}/compose`}>
                      <Icon type="form" />
                      <span>Compose</span>
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="email">
                    <Link to={`${match.url}/email`}>
                      <Icon type="mail" />
                      <span>Email</span>
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="static">
                    <Link to={`${match.url}/static`}>
                      <Icon type="link" />
                      <span>Static page</span>
                      {/* <Tag style={{ marginLeft: 5 }} color="red" size="small">OFF</Tag> */}
                    </Link>
                  </Menu.Item>
                </Menu>
              </Sider>

              <Content style={{ padding: '0 24px', minHeight: 280 }}>

                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1em' }}>
                  <h1 style={{ display: 'inline-block', margin: 0 }}>{workflow && workflow.name}</h1>
                </div>

                { isFetching ?
                  <Spin size="large" />
                :
                  <Switch>
                    <Redirect exact from={match.url} to={`${match.url}/compose`}/>
                    <Route path={`${match.url}/compose`} component={Compose}/>
                    <Route path={`${match.url}/email`} component={Email}/>
                    <Route path={`${match.url}/static`} component={StaticPage}/>
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
    isFetching, workflow
  } = state.workflow;
  return {
    isFetching, workflow
  };
};

export default connect(mapStateToProps)(Workflow);
