import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, Collapse, Card, Icon, Tooltip, Tabs, Input } from 'antd';

import * as ContainerActionCreators from './ContainerActions';
import { deleteView } from '../view/ViewActions';
import { openDatasourceModal, deleteDatasource } from '../datasource/DatasourceActions';
import { openWorkflowModal, deleteWorkflow } from '../workflow/WorkflowActions';
import { openSchedulerModal } from '../scheduler/SchedulerActions';


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
  'xlsXlsxFile': 'Excel file',
  'csvTextFile': 'CSV/text file',
  's3BucketFile': 'S3 bucket file',
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
      deleteView, 
      openDatasourceModal, deleteDatasource, 
      openWorkflowModal, deleteWorkflow,
      openSchedulerModal
    }, dispatch);

    this.state = {
      datasourceFilter: null,
      viewFilter: null,
      workflowFilter: null
    }
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
                    {container.datasources.length > 0 && 
                      <div style={{ width: '100%' }}>
                        <Input style={{ marginBottom: 10, maxWidth: 500 }} placeholder="Filter datasources by name"
                          value={this.state.datasourceFilter} 
                          addonAfter={
                            <Tooltip title="Clear filter">
                              <Icon style={{ cursor: 'pointer' }} type="close" onClick={() => this.setState({ datasourceFilter: null })}/>
                            </Tooltip>
                          }
                          onChange={(e) => this.setState({ datasourceFilter: e.target.value }) }
                        />
                      </div> 
                    }
                    {container.datasources.map((datasource, i) => {
                      if (this.state.datasourceFilter && !datasource.name.includes(this.state.datasourceFilter)) return null;

                      let actions = [];
                      actions.push(
                        <Tooltip title="Edit datasource">
                          <Button icon="edit" onClick={() => { dispatch(this.boundActionCreators.openDatasourceModal(container.id, datasource)); }}/>
                        </Tooltip>
                      );
                      if (['mysql', 'postgresql', 'sqlite', 'mssql', 's3BucketFile'].includes(datasource.connection.dbType)) actions.push(
                        <Tooltip title={'schedule' in datasource ? 'Update schedule' : 'Create schedule'}>
                          <Button icon="calendar" onClick={() => { dispatch(this.boundActionCreators.openSchedulerModal(datasource.id, datasource.schedule)); }}/>
                        </Tooltip>
                      );
                      actions.push(
                        <Tooltip title="Delete datasource">
                          <Button type="danger" icon="delete" onClick={() => { this.boundActionCreators.deleteDatasource(datasource.id) }} />
                        </Tooltip>
                      );

                      return (
                        <Card
                          className="item"
                          bodyStyle={{ flex: 1 }}
                          title={datasource.name}
                          actions={actions}
                          key={i}
                        >
                          <Meta description={<span>{typeMap[datasource.connection.dbType]}</span>}/>
                        </Card>
                      )
                    })}
                    <div className="add item" onClick={() => { dispatch(this.boundActionCreators.openDatasourceModal(container.id)); }}>
                      <Icon type="plus"/>
                      <span>Add datasource</span>
                    </div>
                  </div>
                </TabPane>
              
                <TabPane tab={`DataLabs (${container.views.length})`}  key="2">
                  <div className="tab">
                    {container.views.length > 0 && 
                      <div style={{ width: '100%' }}>
                        <Input style={{ marginBottom: 10, maxWidth: 500 }} placeholder="Filter DataLabs by name"
                          value={this.state.viewFilter} 
                          addonAfter={
                            <Tooltip title="Clear filter">
                              <Icon style={{ cursor: 'pointer' }} type="close" onClick={() => this.setState({ viewFilter: null }) }/>
                            </Tooltip>
                          }
                          onChange={(e) => this.setState({ viewFilter: e.target.value })}
                        />
                      </div> 
                    }
                    {container.views.map((view, i) => {
                      if (this.state.viewFilter && !view.name.includes(this.state.viewFilter)) return null;

                      return (
                        <Card
                          className="item"
                          bodyStyle={{ flex: 1 }}
                          title={view.name}
                          actions={[
                            <Link to={{ pathname: `/view/${view.id}`}}>
                              <Tooltip title="Edit DataLab">
                                <Button icon="arrow-right"/>
                              </Tooltip>
                            </Link>,
                            <Tooltip title="Delete DataLab">
                              <Button type="danger" icon="delete" onClick={() => { this.boundActionCreators.deleteView(view.id); }}/>
                            </Tooltip>
                          ]}
                          key={i}
                        >
                          <Meta description={
                            <div >
                              {`${view.steps.length} ${view.steps.length > 1 ? 'modules' : 'module'}`}
                            </div>
                          }/>
                        </Card>
                      )
                    })}
                    <Link to={{ pathname: `/datalab`, state: { containerId: container.id } }}>
                      <div className="add item">
                        <Icon type="plus"/>
                        <span>Create DataLab</span>
                      </div>
                    </Link>
                  </div>
                </TabPane>

                <TabPane tab={`Actions (${container.workflows.length})`}  key="3">
                  <div className="tab">
                    {container.workflows.length > 0 && 
                      <div style={{ width: '100%' }}>
                        <Input style={{ marginBottom: 10, maxWidth: 500 }} placeholder="Filter actions by name"
                          value={this.state.workflowFilter} 
                          addonAfter={
                            <Tooltip title="Clear filter">
                              <Icon style={{ cursor: 'pointer' }} type="close" onClick={() => this.setState({ workflowFilter: null })}/>
                            </Tooltip>
                          }
                          onChange={(e) => this.setState({ workflowFilter: e.target.value }) }
                        />
                      </div> 
                    }
                    {container.workflows.map((workflow, i) => {
                      if (this.state.workflowFilter && !workflow.name.includes(this.state.workflowFilter)) return null;
                      
                      return (
                        <Card
                          className="item"
                          bodyStyle={{ flex: 1 }}
                          title={workflow.name}
                          actions={[
                            <Tooltip title="Edit action">
                              <Link to={`/workflow/${workflow.id}`}>
                                <Button icon="arrow-right"/>
                              </Link>
                            </Tooltip>,
                            <Tooltip title="Delete action">
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
                      )
                    })}
                    <div className="add item" onClick={() => { dispatch(this.boundActionCreators.openWorkflowModal(container.id, container.views)); }}>
                      <Icon type="plus"/>
                      <span>Create action</span>
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
