import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Tooltip, Button, Modal } from "antd";

import * as ContainerActionCreators from "./ContainerActions";

const confirm = Modal.confirm;

class ContainerHeader extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      ContainerActionCreators,
      dispatch
    );

    this.state = { loading: false };
  }

  deleteContainer = containerId => {
    confirm({
      title: "Confirm container deletion",
      content:
        "All associated datasources, views and actions will be irrevocably deleted with the container.",
      okText: "Continue with deletion",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({
          loading: true
        });

        this.boundActionCreators.deleteContainer({
          containerId,
          onFinish: () => this.setState({ loading: false })
        });
      }
    });
  };

  surrenderAccess = containerId => {
    confirm({
      title: "Confirm remove sharing",
      content:
        "You will no longer be able to see or interact with this container.",
      okText: "Continue",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({ loading: true });

        this.boundActionCreators.surrenderAccess({
          containerId,
          onFinish: () => this.setState({ loading: false })
        });
      }
    });
  };

  render() {
    const { openModal, container, currentUser } = this.props;
    const { loading } = this.state;

    const isOwner = currentUser === container.owner;

    return (
      <div className="container_header">
        {container.code}

        <div className="header_buttons">
          {!isOwner ? (
            <Tooltip title={`This container is owned by ${container.owner}`}>
              <span className="shared">SHARED</span>
            </Tooltip>
          ) : (
            <Tooltip title="Share container">
              <Button
                icon="share-alt"
                onClick={e => {
                  e.stopPropagation();
                  openModal({ type: "sharing", selected: container });
                }}
              />
            </Tooltip>
          )}

          <Tooltip title="Edit container">
            <Button
              icon="edit"
              onClick={e => {
                e.stopPropagation();
                openModal({ type: "container", selected: container });
              }}
            />
          </Tooltip>

          <Tooltip title={isOwner ? "Delete container" : "Remove sharing"}>
            <Button
              type="danger"
              icon={isOwner ? "delete" : "close"}
              loading={loading}
              onClick={e => {
                e.stopPropagation();
                if (isOwner) {
                  this.deleteContainer(container.id);
                } else {
                  this.surrenderAccess(container.id);
                }
              }}
            />
          </Tooltip>
        </div>
      </div>
    );
  }
}

export default connect()(ContainerHeader);
