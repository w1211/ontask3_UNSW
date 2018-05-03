import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Spin, Layout, Breadcrumb, Icon, Button, Form, Input } from 'antd';

import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import * as ViewActionCreators from './ViewActions';

import './DataLab.css';

import Module from './draggable/Module';
import Add from './draggable/Add';
import DatasourceModule from './modules/Datasource';
import ResolveMatchModal from './resolve/Discrepencies';

const { Content } = Layout;
const FormItem = Form.Item;


class DataLabCreator extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  };

  componentDidMount() {
    const { match, location, history } = this.props;

    if (location.state && 'containerId' in location.state) {
      // User pressed "Create DataLab", as the containerId is only set in the 
      // location state when the navigation occurs
      this.boundActionCreators.retrieveDatasources(location.state.containerId);
    } else if (match.params.id) {
      this.boundActionCreators.retrieveDataLab(match.params.id);
    } else {
      // The user must have cold-loaded the URL, so we have no container to reference
      // Therefore redirect the user back to the container list
      history.push('/containers');
    }
  };


  render() {
    const { location, history, form, loading, selectedId, build, datasources, discrepencies } = this.props;

    const containerId = location.state && location.state.containerId;

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
                <h1 style={{ display: 'inline-block', margin: 0 }}>{`${selectedId ? 'Update' : 'Create'} DataLab`}</h1>
                <Link to="/containers" style={{ width: 'fit-content' }}>
                  <Icon type="arrow-left" />
                  <span>Back to containers</span>
                </Link>
              </div>

              { loading ?
                <Spin size="large" />
              :
                <div style={{ paddingRight: 160 }}>
                  <h2>Details</h2>
                  <div style={{ marginBottom: 20, maxWidth: 350 }}>
                    <FormItem label="Name" validateStatus={build && build.errors.name ? 'error' : null}>
                      <Input value={build && build.name} onChange={(e) => this.boundActionCreators.updateBuild(null, 'name', e.target.value)}/>
                    </FormItem>
                  </div>

                  <h2 style={{ marginBottom: '1em' }}>Data Model</h2>
                  <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
                    { build && build.steps.map((step, index) => (
                      <div style={{ marginRight: 25, marginBottom: 25, position: 'relative' }} key={index}>
                        { 
                          step.type === 'datasource' && 
                          <DatasourceModule
                            datasources={datasources} build={build} step={index}
                            onChange={this.boundActionCreators.updateBuild}
                            checkForDiscrepencies={this.boundActionCreators.checkForDiscrepencies}
                            deleteStep={this.boundActionCreators.deleteStep}
                          /> 
                        }
                      </div>
                    ))}
                    <Add/>
                  </div>

                  <ResolveMatchModal
                    visible={discrepencies && ('primary' in discrepencies || 'matching' in discrepencies)}
                    discrepencies={discrepencies}
                    form={form}
                    onResolve={this.boundActionCreators.resolveDiscrepencies}
                  />

                  <div style={{ marginBottom: 40 }}>
                    <Button size="large" type="primary" onClick={() => this.boundActionCreators.saveBuild(history, containerId, selectedId)}>Save</Button>
                  </div>
                    
                  <div className="modules">
                    <div className="wrapper">
                      <h2>Components</h2>
                      <Module type="datasource" icon="database" label="Datasource"/>
                      <Module type="computed" icon="calculator" label="Computed Fields"/>
                      <Module type="form" icon="form" label="Form"/>
                    </div>
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
    loading, error, selectedId, build, datasources, discrepencies
  } = state.view;
  
  return {
    loading, error, selectedId, build, datasources, discrepencies
  };
};
 
export default connect(mapStateToProps)(Form.create()(DragDropContext(HTML5Backend)(DataLabCreator)));
