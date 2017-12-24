import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Badge, Button, Icon, Modal } from 'antd';

import { openUpdateContainer, deleteContainer } from './ContainerActions';

const ButtonGroup = Button.Group;
const confirm = Modal.confirm;

const ButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  marginRight: '10px',
}

class ContainerPanelHeader extends React.Component {
  showUpdateModal = (container) => {
    const { dispatch } = this.props;
    dispatch(openUpdateContainer(container));
  }

  confirmDelete = (container) => {
    const { dispatch, isDeleting } = this.props;
    confirm({
      title: 'Confirm container deletion',
      content: 'All associated datasources and workflows will be irrevocably deleted with the container.',
      okText: 'Continue with deletion',
      okType: 'danger',
      cancelText: 'Cancel',
      loading: isDeleting,
      onOk() {
        dispatch(deleteContainer(container._id['$oid']));
      }
    });
  }

  render() {
    const { container } = this.props;

    return (
      <div>
        {container.code}
        <div style={{float: "right", marginRight: "10px", marginTop: "-5px"}}>
          <ButtonGroup style={ButtonStyle}>
            <Button disabled icon="user"/>
            <Button icon="edit" onClick={(e) => { e.stopPropagation(); this.showUpdateModal(container); }}/>
            <Button disabled icon="share-alt"/>
          </ButtonGroup>
          <Button icon="hdd" style={ButtonStyle}><Badge count={container.datasources.length} showZero style={{backgroundColor: '#616161'}} /></Button>
          <Button style={ButtonStyle}><Icon type="plus"/>New Workflow</Button>
          <Button type="danger" icon="delete" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); this.confirmDelete(container); }}/>
        </div>
      </div>
    )
  }
}

ContainerPanelHeader.propTypes = {
  dispatch: PropTypes.func.isRequired,
  container: PropTypes.object.isRequired
}

export default connect()(ContainerPanelHeader)