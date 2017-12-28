import React from 'react';
// import { bindActionCreators } from 'redux';
// import { connect } from 'react-redux';
// import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Layout, Menu, Icon, Button, Modal, notification } from 'antd';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;

// import { fetchContainers } from './ContainerActions';

// import * as ContainerActionCreators from './ContainerActions';

// const confirm = Modal.confirm;


const MatrixDefinition = () => (
  <div>
    matrix definition view
  </div>
);
const DataView = () => (
  <div>
    data view
  </div>
);
const Rules = () => (
  <div>
    rules view
  </div>
);


class Workflow extends React.Component {
  // constructor(props) { 
  //   super(props);
  //   const { dispatch } = props;

  //   // this.boundActionCreators = bindActionCreators(ContainerActionCreators, dispatch)
  // }

  // componentWillReceiveProps(nextProps) {
  //   const { dispatch } = this.props;
  // }

  render() {
    const { 
      dispatch, match, location
    } = this.props;
    
    return (
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
            <h1 style={{display: 'inline-block', margin: 0}}>Workflow</h1>
          </div>
          <Switch>
            <Redirect exact from={match.url} to={`${match.url}/matrix`}/>
            <Route exact path={`${match.path}/matrix`} component={MatrixDefinition}/>
            <Route exact path={`${match.path}/data`} component={DataView}/>
            <Route exact path={`${match.path}/rules`} component={Rules}/>
          </Switch>
        </Content>
      </Layout>
    );
  };

  // componentDidMount() {
  //   const { dispatch } = this.props;
  //   // dispatch(fetchContainers());
  // };

};

// Workflow.propTypes = {
//   dispatch: PropTypes.func.isRequired,
//   // containers: PropTypes.array.isRequired
// }

// const mapStateToProps = (state) => {
//   const { 
//     isFetching
//   } = state.workflow;
//   return { 
//     isFetching
//   };
// }

export default Workflow;

// export default connect(mapStateToProps)(Workflow)
