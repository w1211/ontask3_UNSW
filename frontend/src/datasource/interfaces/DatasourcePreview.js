import React from "react";
import { Table } from "antd";

class DatasourcePreview extends React.Component {
  render() {
    const { data } = this.props;

    const columns = Object.keys(data[0]).map(k => {
      return { title: k, dataIndex: k };
    });

    return (
      <div>
        <div style={{ marginBottom: 10 }}>
          Number of records: <strong>{data.length}</strong>
        </div>

        <Table
          rowKey={(record, index) => index}
          columns={columns}
          dataSource={data}
        />
      </div>
    );
  }
}

export default DatasourcePreview;
