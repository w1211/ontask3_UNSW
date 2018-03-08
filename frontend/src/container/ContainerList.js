import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Collapse, Card, Col, Row, Badge, Icon, Tooltip, Tabs } from 'antd';

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


const ContainerPanelHeader = ({ container, openContainerModal, confirmContainerDelete, openWorkflowModal, openDatasourceModal, openViewModal }) => (
  <div>
  {container.code}
  <div style={{ float: "right", marginRight: "10px", marginTop: "-5px" }}>
    <ButtonGroup style={ButtonStyle}>
      <Button disabled icon="user"/>
      <Tooltip title="Edit container">
        <Button icon="edit" onClick={(e) => { e.stopPropagation(); openContainerModal(container); }}/>
      </Tooltip>
      <Button disabled icon="share-alt"/>
    </ButtonGroup>
    <Tooltip title="Modify datasources">
      <Button icon="hdd" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); openDatasourceModal(container.id, container.datasources); }}>
        <Badge count={container.datasources.length} showZero style={{ backgroundColor: '#616161' }} />
      </Button>
    </Tooltip>
    <Tooltip title="Modify views"> 
      <Button icon="eye-o" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); openViewModal(container.id, container.datasources, container.views); }}>
        <Badge count={container.views.length} showZero style={{ backgroundColor: '#616161' }} />
      </Button>
    </Tooltip>
    <Button style={ButtonStyle} onClick={(e) => { e.stopPropagation(); openWorkflowModal(container.id); }}>
      <Icon type="plus"/>New Workflow
    </Button>
    <Tooltip title="Delete container">
      <Button type="danger" icon="delete" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); confirmContainerDelete(container.id); }}/>
    </Tooltip>
  </div>
</div>
);

const WorkflowCardHeader = ({ title }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%' }}>
    <div style={{ flex: 1 }}>{title}</div>
    <ButtonGroup style={ButtonStyle}>
      <Button disabled icon="user"/>
      <Button disabled icon="share-alt"/>
    </ButtonGroup>
  </div>
)

const tabListNoTitle = [{
  key: 'article',
  tab: 'article',
}, {
  key: 'app',
  tab: 'app',
}, {
  key: 'project',
  tab: 'project',
}];

const contentListNoTitle = {
  article: <p>article content</p>,
  app: <p>app content</p>,
  project: <p>project content</p>,
};

const typeMap = {
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL',
  'file': 'External file',
  'sqlite': 'SQLite',
  'mssql': 'MSSQL'
}

const ContainerList = ({ 
  containers, activeKey, changeAccordionKey, 
  openContainerModal, confirmContainerDelete, 
  openWorkflowModal, confirmWorkflowDelete, 
  openDatasourceModal, openViewModal
}) => (
  <Collapse accordion onChange={changeAccordionKey} activeKey={activeKey} className="containerList">
  { containers.map((container, key) => {
    return (
      <Panel 
        header={
          <ContainerPanelHeader 
            container={container}
            openContainerModal={openContainerModal} 
            confirmContainerDelete={confirmContainerDelete} 
            openWorkflowModal={openWorkflowModal}
            openDatasourceModal={openDatasourceModal}
            openViewModal={openViewModal}
          />}
        key={container.code}
      >
      <Tabs
        defaultActiveKey="1"
        tabPosition="left"
        tabBarStyle={{ minWidth: 160 }}
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
                    <Button icon="edit"/>
                  </Tooltip>,
                  <Tooltip title="Delete datasource">
                    <Button type="danger" icon="delete"/>
                  </Tooltip>
                ]}
                >
                <Meta description={
                  <div >
                    {typeMap[datasource.connection.dbType]}
                  </div>
                }/>
              </Card>
            ))}
            <div className="add item">
              <Icon type="plus"/>
              <span>Add datasource</span>
            </div>
          </div>
        </TabPane>
        
        <TabPane tab={`Views (${container.views.length})`}  key="2">
          <div className="tab">
            {container.views.map((views, i) => (
              <Card
                className="item"
                bodyStyle={{ flex: 1 }}
                title="title"
                actions={[
                  <Tooltip title="Edit view">
                    <Button icon="edit"/>
                  </Tooltip>,
                  <Tooltip title="Delete view">
                    <Button type="danger" icon="delete"/>
                  </Tooltip>
                ]}
                >
                <Meta description={
                  <div >
                    view
                  </div>
                }/>
              </Card>
            ))}
            <div className="add item">
              <Icon type="plus"/>
              <span>Create view</span>
            </div>
          </div>
        </TabPane>
        <TabPane tab={`Workflows (${container.workflows.length})`}  key="3">Content of tab 3</TabPane>
      </Tabs>

        {/* <div> */}

        {/* { container.workflows.length > 0 ?
        <Row gutter={16} type="flex">
          { container.workflows.map((workflow, index) => {
              return (
                <Col span={6} key={index} style={{ minHeight: '100%', marginBottom: '20px' }}>
                  <Card
                    style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12)' }}
                    bodyStyle={{ flex: 1 }}
                    title={<WorkflowCardHeader title={workflow.name}/>}
                    actions={[
                      <Tooltip title="Enter workflow">
                        <Link to={`/workflow/${workflow.id}`}>
                          <Button icon="arrow-right"/>
                        </Link>
                      </Tooltip>,
                      // <Tooltip title="Edit workflow">
                      //   <Button icon="edit"  onClick={() => { openWorkflowModal(container.id, workflow) }}/>
                      // </Tooltip>,
                      <Tooltip title="Delete workflow">
                        <Button type="danger" icon="delete" onClick={() => { confirmWorkflowDelete(workflow.id) }}/>
                      </Tooltip>
                    ]}
                    >
                    <Meta
                      description={ workflow.description ?
                        workflow.description
                      :
                        'No description provided'
                      }
                    />
                  </Card>
                </Col>
              )
            })
          }
        </Row>
        :
          <p style={{ margin: 0 }}>No workflows have been created yet.</p>
        }
      </div> */}
      </Panel>        
    )
  })}
</Collapse>
)

export default ContainerList;