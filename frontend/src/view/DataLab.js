import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Table, Spin, Layout, Breadcrumb, Icon, Tooltip, Dropdown, Button, Modal, Card } from 'antd';

import { DragDropContext, DragSource } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import * as ViewActionCreators from './ViewActions';

import './DataLab.css';
import { OPEN_FILTER_MODAL } from '../workflow/WorkflowActions';

import Module from './draggable/Module';
import Add from './draggable/Add';


const { Content } = Layout;


class DataLabCreator extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  };
  
  render() {
    const { loading, selected } = this.props;

    return (
      <div className="dataLab">
        <Content style={{ padding: '0 50px' }}>

          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item><Link to="/">Dashboard</Link></Breadcrumb.Item>
            <Breadcrumb.Item><Link to="/containers">Containers</Link></Breadcrumb.Item>
            <Breadcrumb.Item>DataLab</Breadcrumb.Item>
          </Breadcrumb>

          <Layout style={{ padding: '24px 0', background: '#fff' }}>
            <Content style={{ padding: '0 24px', minHeight: 280 }}>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1em' }}>
                <h1 style={{ display: 'inline-block', margin: 0 }}>{`${selected ? 'Update' : 'Create'} DataLab`}</h1>
                <Link to="/containers" style={{ width: 'fit-content' }}>
                  <Icon type="arrow-left" />
                  <span>Back to containers</span>
                </Link>
              </div>

              { loading ?
                <Spin size="large" />
              :
                <div>

                  <h2>Build</h2>
                  <div style={{ marginBottom: 40 }}>
                    <Add/>
                  </div>
                    
                  <h2>Modules</h2>
                  <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <Module type="datasource" icon="database" label="Datasource"/>
                    <Module type="computed" icon="calculator" label="Computed Fields"/>
                    <Module type="form" icon="form" label="Form"/>
                  </div>

                </div>
              }
            </Content>
          </Layout>
        </Content>
      </div>
    );
  };

};




const mapStateToProps = (state) => {
  const {
    loading, error, selected
  } = state.view;
  
  return {
    loading, error, selected
  };
};

export default connect(mapStateToProps)(DragDropContext(HTML5Backend)(DataLabCreator));
