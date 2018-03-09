import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, Collapse, Card, Icon, Tooltip, Tabs } from 'antd';

import * as ContainerActionCreators from './ContainerActions';
import { openViewModal, deleteView } from '../view/ViewActions';
import { openDatasourceModal, deleteDatasource } from '../datasource/DatasourceActions';
import { openWorkflowModal, deleteWorkflow } from '../workflow/WorkflowActions';

import './ContainerList.css';

const TabPane = Tabs.TabPane;
const Panel = Collapse.Panel;
const { Meta } = Card;
const ButtonGroup = Button.Group;

const ButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  marginRight: '10px',
}

const typeMap = {
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL',
  'file': 'External file',
  'sqlite': 'SQLite',
  'mssql': 'MSSQL'
}


// const WorkflowCardHeader = ({ title }) => (
//   <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%' }}>
//     <div style={{ flex: 1 }}>{title}</div>
//     <ButtonGroup style={ButtonStyle}>
//       <Button disabled icon="user"/>
//       <Button disabled icon="share-alt"/>
//     </ButtonGroup>
//   </div>
// )

class ContainerList extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators({
      ...ContainerActionCreators, 
      openViewModal, deleteView, 
      openDatasourceModal, deleteDatasource, 
      openWorkflowModal, deleteWorkflow
    }, dispatch);
  }

  render() {
    const { dispatch, containers, accordionKey, tabKey } = this.props;

    return (
      <Collapse accordion onChange={this.boundActionCreators.changeContainerAccordion} activeKey={accordionKey} className="containerList">
        { containers.map((container, i) => {
          return (
            <Panel 
              header={
                <div>
                  {container.code}
                  <div style={{ float: "right", marginRight: "10px", marginTop: "-5px" }}>
                    <ButtonGroup style={ButtonStyle}>
                      <Button disabled icon="user"/>
                      <Button disabled icon="share-alt"/>
                    </ButtonGroup>
                    <Tooltip title="Edit container">
                      <Button icon="edit" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); this.boundActionCreators.openContainerModal(container); }}/>
                    </Tooltip>
                    <Tooltip title="Delete container">
                      <Button type="danger" icon="delete" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); this.boundActionCreators.deleteContainer(container.id); }}/>
                    </Tooltip>
                  </div>
                </div>
              }
              key={i}
            >

              <Tabs
                activeKey={tabKey}
                tabPosition="left"
                tabBarStyle={{ minWidth: 160 }}
                onChange={this.boundActionCreators.changeContainerTab}
              >

                <TabPane tab={`Datasources (${container.datasources.length})`} key="1">
                  <div className="tab">
                    {container.datasources.map((datasource, i) => (
                      <Card
                        className="item"
                        bodyStyle={{ flex: 1 }}
                        title={datasource.name}
                        actions={[
                          <Tooltip title="Edit datasource">
                            <Button icon="edit" onClick={() => { dispatch(this.boundActionCreators.openDatasourceModal(container.id, datasource)); }}/>
                          </Tooltip>,
                          <Tooltip title="Delete datasource">
                            <Button type="danger" icon="delete" onClick={() => { this.boundActionCreators.deleteDatasource(datasource.id) }} />
                          </Tooltip>
                        ]}
                        key={i}
                      >
                        <Meta description={<span>{typeMap[datasource.connection.dbType]}</span>}/>
                      </Card>
                    ))}
                    <div className="add item" onClick={() => { dispatch(this.boundActionCreators.openDatasourceModal(container.id)); }}>
                      <Icon type="plus"/>
                      <span>Add datasource</span>
                    </div>
                  </div>
                </TabPane>
              
                <TabPane tab={`Views (${container.views.length})`}  key="2">
                  <div className="tab">
                    {container.views.map((view, i) => (
                      <Card
                        className="item"
                        bodyStyle={{ flex: 1 }}
                        title="title"
                        actions={[
                          <Tooltip title="Edit view">
                            <Button icon="edit"/>
                          </Tooltip>,
                          <Tooltip title="Delete view">
                            <Button type="danger" icon="delete" onClick={() => { this.boundActionCreators.deleteView(view.id); }}/>
                          </Tooltip>
                        ]}
                        key={i}
                      >
                        <Meta description={
                          <div >
                            view
                          </div>
                        }/>
                      </Card>
                    ))}
                    <div className="add item" onClick={() => { dispatch(this.boundActionCreators.openViewModal(container.id, container.datasources)); }}>
                      <Icon type="plus"/>
                      <span>Create view</span>
                    </div>
                  </div>
                </TabPane>

                <TabPane tab={`Workflows (${container.workflows.length})`}  key="3">
                  <div className="tab">
                    {container.workflows.map((workflow, i) => (
                      <Card
                        className="item"
                        bodyStyle={{ flex: 1 }}
                        title={workflow.name}
                        actions={[
                          <Tooltip title="Enter workflow">
                            <Link to={`/workflow/${workflow.id}`}>
                              <Button icon="arrow-right"/>
                            </Link>
                          </Tooltip>,
                          <Tooltip title="Delete workflow">
                            <Button type="danger" icon="delete" onClick={() => { this.boundActionCreators.deleteWorkflow(workflow.id); }}/>
                          </Tooltip>
                        ]}
                        key={i}
                      >
                        <Meta description={
                          <div >
                            { workflow.description ? workflow.description : 'No description provided' }
                          </div>
                        }/>
                      </Card>
                    ))}
                    <div className="add item" onClick={() => { dispatch(this.boundActionCreators.openWorkflowModal(container.id)); }}>
                      <Icon type="plus"/>
                      <span>Create workflow</span>
                    </div>
                  </div>
                </TabPane>
              </Tabs>
            </Panel>        
          )
        })}
      </Collapse>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    containers, accordionKey, tabKey
  } = state.containers;
  
  return {
    containers, accordionKey, tabKey
  };
}

export default connect(mapStateToProps)(ContainerList)
