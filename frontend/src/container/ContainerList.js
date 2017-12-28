import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Collapse, Card, Col, Row, Badge, Icon, Tooltip } from 'antd';

const Panel = Collapse.Panel;
const { Meta } = Card;
const ButtonGroup = Button.Group;

const ButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  marginRight: '10px',
}

const ContainerPanelHeader = ({ container, onEditContainer, onDeleteContainer, onCreateWorkflow, onOpenDatasource }) => (
  <div>
  {container.code}
  <div style={{float: "right", marginRight: "10px", marginTop: "-5px"}}>
    <ButtonGroup style={ButtonStyle}>
      <Button disabled icon="user"/>
      <Tooltip title="Edit container">
        <Button icon="edit" onClick={(e) => { e.stopPropagation(); onEditContainer(container); }}/>
      </Tooltip>
      <Button disabled icon="share-alt"/>
    </ButtonGroup>
    <Tooltip title="Modify datasources">
      <Button icon="hdd" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); onOpenDatasource(container); }}><Badge count={container.datasources.length} showZero style={{backgroundColor: '#616161'}} /></Button>
    </Tooltip>
    <Button style={ButtonStyle} onClick={(e) => { e.stopPropagation(); onCreateWorkflow(container); }}><Icon type="plus"/>New Workflow</Button>
    <Tooltip title="Delete container">
      <Button type="danger" icon="delete" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); onDeleteContainer(container); }}/>
    </Tooltip>
  </div>
</div>
);

const WorkflowCardHeader = ({ title, onEnterWorkflow }) => (
  <div style={{display: 'inline-flex', alignItems: 'center', width: '100%'}}>
    <div style={{flex: 1}}>{title}</div>
    <ButtonGroup style={ButtonStyle}>
      <Button disabled icon="user"/>
      <Button disabled icon="share-alt"/>
    </ButtonGroup>
  </div>
)

const ContainerList = ({ containers, activeKey, changeActiveAccordion, onEditContainer, onDeleteContainer, onCreateWorkflow, onEditWorkflow, onDeleteWorkflow, onOpenDatasource }) => (
  <Collapse accordion onChange={changeActiveAccordion} activeKey={activeKey}>
  { containers.map((container, key) => {
    return (
      <Panel 
        header={
          <ContainerPanelHeader 
            container={container}
            onEditContainer={onEditContainer} 
            onDeleteContainer={onDeleteContainer} 
            onCreateWorkflow={onCreateWorkflow}
            onOpenDatasource={onOpenDatasource}
          />}
        key={container.code}
      >
      { container.workflows.length > 0 ?
        <Row gutter={16} type="flex">
        { container.workflows.map((workflow, n) => {
            return (
              <Col span={6} key={n} style={{minHeight: '100%', marginBottom: '20px'}}>
                <Card
                  style={{minHeight: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12)'}}
                  bodyStyle={{flex: 1}}
                  title={<WorkflowCardHeader title={workflow.name}/>}
                  actions={[
                    <Tooltip title="Enter workflow">
                      <Link to={`/workflow/${workflow._id['$oid']}`}>
                        <Button icon="arrow-right"/>
                      </Link>
                    </Tooltip>,
                    <Tooltip title="Edit workflow">
                      <Button icon="edit"  onClick={() => { onEditWorkflow(container, workflow) }}/>
                    </Tooltip>,
                    <Tooltip title="Delete workflow">
                      <Button type="danger" icon="delete" onClick={() => { onDeleteWorkflow(workflow) }}/>
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
        <p style={{margin: 0}}>No workflows have been created yet.</p>
      }
      </Panel>        
    )
  })}
</Collapse>
)

export default ContainerList;