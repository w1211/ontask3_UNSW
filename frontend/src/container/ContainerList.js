import React from 'react';
import { Button, Collapse, Card, Col, Row, Badge, Icon } from 'antd';

const Panel = Collapse.Panel;
const { Meta } = Card;
const ButtonGroup = Button.Group;

const ButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  marginRight: '10px',
}

const ContainerPanelHeader = ({ container, onEditContainer, onDeleteContainer, onCreateWorkflow }) => (
  <div>
  {container.code}
  <div style={{float: "right", marginRight: "10px", marginTop: "-5px"}}>
    <ButtonGroup style={ButtonStyle}>
      <Button disabled icon="user"/>
      <Button icon="edit" onClick={(e) => { e.stopPropagation(); onEditContainer(container); }}/>
      <Button disabled icon="share-alt"/>
    </ButtonGroup>
    <Button icon="hdd" style={ButtonStyle}><Badge count={container.datasources.length} showZero style={{backgroundColor: '#616161'}} /></Button>
    <Button style={ButtonStyle} onClick={(e) => { e.stopPropagation(); onCreateWorkflow(container); }}><Icon type="plus"/>New Workflow</Button>
    <Button type="danger" icon="delete" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); onDeleteContainer(container); }}/>
  </div>
</div>
);

const ContainerList = ({ containers, onEditContainer, onDeleteContainer, onCreateWorkflow, onEditWorkflow, onDeleteWorkflow }) => (
  <Collapse accordion>
  { containers.map((container, key) => {
    return (
      <Panel 
        header={
          <ContainerPanelHeader 
            container={container} 
            onEditContainer={onEditContainer} 
            onDeleteContainer={onDeleteContainer} 
            onCreateWorkflow={onCreateWorkflow}
          />}
          key={key}
        >
        { container.workflows.length > 0 ?
          <Row gutter={16} type="flex">
          { container.workflows.map((workflow, n) => {
              return (
                <Col span={6} key={n} style={{minHeight: '100%', marginBottom: '20px'}}>
                  <Card
                    style={{minHeight: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12)'}}
                    bodyStyle={{flex: 1}}
                    title={workflow.name}
                    actions={[
                      <Button icon="user" disabled/>,
                      <Button icon="edit"  onClick={() => { onEditWorkflow(container, workflow) }}/>, 
                      <Button icon="share-alt" disabled/>, 
                      <Button type="danger" icon="delete" onClick={() => { onDeleteWorkflow(workflow) }}/>
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