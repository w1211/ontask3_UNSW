import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
// import { Route } from 'react-router-dom';
import { Badge, Button, Icon, Collapse } from 'antd';

import { fetchContainers } from './ContainerActions';

const Panel = Collapse.Panel;
const ButtonGroup = Button.Group;


const ContainerHeader  = ({ container }) => {
  return (
    <div>
      {container.code}
      <div style={{float: "right", marginRight: "20px", marginTop: "-5px"}}>
        <ButtonGroup style={{marginRight: "10px", verticalAlign: "middle"}}>
          <Button icon="user"/>
          <Button icon="share-alt"/>
          <Button icon="edit"/>
        </ButtonGroup>
        <Button icon="hdd" style={{marginRight: "10px"}}><Badge count={4} style={{backgroundColor: '#616161'}} /></Button>
        <Button style={{marginRight: "10px", verticalAlign: "middle"}}><Icon type="plus"/>New Workflow</Button>
        <Button type="danger" icon="delete" style={{verticalAlign: "middle"}}/>
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
        <Button type="primary" icon="plus" size="large" style={{marginBottom: '20px'}}>New container</Button>
        { containers.length > 0 ?
          <Collapse accordion>
            { containers.map((container, i) => {
              return <Panel header={<ContainerHeader container={container}/>} key={i}>
                { container.workflows ?
                  <p>Workflows here</p>
                :
                  <p style={{margin: 0}}>No workflows have been created yet.</p>
                }
              </Panel>
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
