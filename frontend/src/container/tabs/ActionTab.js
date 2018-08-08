import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Input, Icon, Tooltip, Button, Card, Modal } from "antd";
import { Link } from "react-router-dom";

import { deleteAction, cloneAction } from "../../action/ActionActions";

const { Meta } = Card;
const confirm = Modal.confirm;

class ActionTab extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      { deleteAction, cloneAction },
      dispatch
    );

    this.state = { filter: null, deleting: {}, cloning: {} };
  }

  deleteAction = actionId => {
    confirm({
      title: "Confirm action deletion",
      content: "Are you sure you want to delete this action?",
      okText: "Continue with deletion",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({
          deleting: { [actionId]: true }
        });

        this.boundActionCreators.deleteAction({
          actionId,
          onFinish: () => {
            this.setState({ deleting: { [actionId]: false } });
          }
        });
      }
    });
  };

  cloneAction = actionId => {
    confirm({
      title: "Confirm action clone",
      content: "Are you sure you want to clone this action?",
      onOk: () => {
        this.setState({
          cloning: { [actionId]: true }
        });

        this.boundActionCreators.cloneAction({
          actionId,
          onFinish: () => {
            this.setState({ cloning: { [actionId]: false } });
          }
        });
      }
    });
  };

  render() {
    const { containerId, actions, dataLabs, openModal } = this.props;
    const { filter, deleting, cloning } = this.state;

    return (
      <div className="tab">
        {actions &&
          actions.length > 0 && (
            <div className="filter_wrapper">
              <div className="filter">
                <Input
                  placeholder="Filter actions by name"
                  value={filter}
                  addonAfter={
                    <Tooltip title="Clear filter">
                      <Icon
                        type="close"
                        onClick={() => this.setState({ filter: null })}
                      />
                    </Tooltip>
                  }
                  onChange={e => this.setState({ filter: e.target.value })}
                />
              </div>
            </div>
          )}
        {actions &&
          actions.map((action, i) => {
            if (filter && !action.name.includes(filter)) return null;

            return (
              <Card
                className="item"
                bodyStyle={{ flex: 1 }}
                title={action.name}
                actions={[
                  <Tooltip title="Enter action">
                    <Link to={`/action/${action.id}`}>
                      <Button icon="arrow-right" />
                    </Link>
                  </Tooltip>,
                  <Tooltip title="Edit action">
                    <Button
                      icon="edit"
                      onClick={() => {
                        openModal({
                          type: "action",
                          selected: action
                        });
                      }}
                    />
                  </Tooltip>,
                  <Tooltip title="Clone action">
                    <Button
                      icon="copy"
                      loading={action.id in cloning && cloning[action.id]}
                      onClick={() => this.cloneAction(action.id)}
                    />
                  </Tooltip>,
                  <Tooltip title="Delete action">
                    <Button
                      type="danger"
                      icon="delete"
                      loading={action.id in deleting && deleting[action.id]}
                      onClick={() => this.deleteAction(action.id)}
                    />
                  </Tooltip>
                ]}
                key={i}
              >
                <Meta
                  description={
                    <div>
                      {action.description
                        ? action.description
                        : "No description provided"}
                    </div>
                  }
                />
              </Card>
            );
          })}
        <div
          className="add item"
          onClick={() => {
            openModal({ type: "action", data: { containerId, dataLabs } });
          }}
        >
          <Icon type="plus" />
          <span>Create action</span>
        </div>
      </div>
    );
  }
}

export default connect()(ActionTab);
