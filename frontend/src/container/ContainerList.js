import React from 'react';
import PropTypes from 'prop-types';
// import { Route } from 'react-router-dom';
import { Button, Collapse, Card, Col, Row, notification } from 'antd';
import { connect } from 'react-redux';

import ContainerPanelHeader from './ContainerPanelHeader';

const Panel = Collapse.Panel;
const { Meta } = Card;


class ContainerList extends React.Component {

  componentWillReceiveProps(nextProps) {
    if (!this.props.didDelete && nextProps.didDelete) {
      notification['success']({
        message: 'Container deleted',
        description: 'The container and its asssociated data sources and workflows has been successfully deleted.',
      });
    }
  }

  render() {
    const { containers } = this.props;

    return (
      <Collapse accordion>
      { containers.map((container, key) => {
        return (
          <Panel header={<ContainerPanelHeader container={container}/>} key={key}>
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
                          <Button type="danger" icon="delete"/>
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
  }
}

ContainerList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  containers: PropTypes.array.isRequired
}

const mapStateToProps = (state) => {
  const { didDelete } = state.containers;
  return {
    didDelete
  };
}

export default connect(mapStateToProps)(ContainerList)