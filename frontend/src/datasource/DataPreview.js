import React, { Component } from "react";
import { Modal, Table, Button } from "antd";

export default class DataPreview extends Component {
  handleCancel = () => {
    const { closeModal } = this.props;
    closeModal();
  };

  render() {
    const { visible, data } = this.props;
    const { columns, preview } = data;
    
    return (
      <div>
        <Modal
          title="Datasource Preview"
          visible={visible}
          onCancel={this.handleCancel}
          width={columns ? columns.length * 200 : 520}
          footer={[
            <Button key="submit" type="primary" onClick={this.handleCancel}>
              Ok
            </Button>
          ]}
        >
          <Table
            rowKey={(record, index) => index}
            columns={columns}
            dataSource={preview}
            pagination={{ pageSize: 5 }}
          />
        </Modal>
      </div>
    );
  }
}
