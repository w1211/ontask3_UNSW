import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import { Route } from 'react-router-dom';
import { Badge, Button, Icon, Collapse, Card, Col, Row } from 'antd';

import { fetchContainers } from './ContainerActions';
import ContainerCreate from './ContainerCreate';

const Panel = Collapse.Panel;
const ButtonGroup = Button.Group;
const { Meta } = Card;

const ButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  marginRight: '10px',
}

const ContainerHeader = ({ container }) => {
  return (
    <div>
      {container.code}
      <div style={{float: "right", marginRight: "10px", marginTop: "-5px"}}>
        <ButtonGroup style={ButtonStyle}>
          <Button icon="user"/>
          <Button icon="edit"/>
          <Button icon="share-alt"/>
        </ButtonGroup>
        <Button icon="hdd" style={ButtonStyle}><Badge count={container.datasources.length} style={{backgroundColor: '#616161'}} /></Button>
        <Button style={ButtonStyle}><Icon type="plus"/>New Workflow</Button>
        <Button type="danger" icon="delete" style={ButtonStyle}/>
      </div>
    </div>
  )
}
ContainerHeader.propTypes = {
  container: PropTypes.object
}
  
class Container extends React.Component {

  render() {
    const { containers } = this.props;

    return (
      <div>
        <h1>Containers</h1>
        <ContainerCreate />
        { containers.length > 0 ?
          <Collapse accordion>
            { containers.map((container, i) => {
              return (
                <Panel header={<ContainerHeader container={container}/>} key={i}>
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
                                <Button icon="user"/>,
                                <Button icon="edit"/>, 
                                <Button icon="share-alt"/>, 
                                <Button type="danger" icon="delete" style={ButtonStyle}/>
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
        :
          <h2>
            <Icon type="info-circle-o" style={{marginRight: '10px'}}/>
            Get started by creating your first container.
          </h2>
        }
      </div>
    );
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fetchContainers());
  };

};

Container.propTypes = {
  dispatch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  containers: PropTypes.array.isRequired
}

const mapStateToProps = (state) => {
  const { isFetching, items: containers } = state.containers;
  return { 
    isFetching, 
    containers
  };
}

export default connect(mapStateToProps)(Container)
