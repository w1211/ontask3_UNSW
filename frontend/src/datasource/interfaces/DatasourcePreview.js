import React from "react";
import { Table } from "antd";

class DatasourcePreview extends React.Component {
  render() {
    const { data } = this.props;

    const columns = Object.keys(data[0]).map(k => {
      return { title: k, dataIndex: k };
    });

    return (
      <Table
        rowKey={(record, index) => index}
        columns={columns}
        dataSource={data}
      />
    );
  }
}

export default DatasourcePreview;
