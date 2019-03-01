import React from "react";
import { Button, Modal, Table } from "antd";
import _ from "lodash";

class AccessListModal extends React.Component {
  render() {
    const { visible, name, users, permission, closeModal } = this.props;

    return (
      <Modal
        visible={visible}
        title="Access list"
        onCancel={closeModal}
        footer={[
          <Button key="ok" type="primary" onClick={this.closeModal}>
            OK
          </Button>
        ]}
      >
        <p>
          The following users have access to <strong>{name}</strong>:
        </p>

        <Table
          dataSource={(users || []).map(user => ({ [permission]: user }))}
          columns={[
            {
              title: permission,
              dataIndex: permission,
              key: "permission",
              sorter: (a, b) =>
                _.get(a, permission, "").localeCompare(_.get(b, permission, ""))
            }
          ]}
          rowKey={(record, i) => i}
        />
      </Modal>
    );
  }
}

export default AccessListModal;
