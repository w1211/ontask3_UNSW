import React from 'react';

import { Spin, Alert, Table } from 'antd';


class DataView extends React.Component {
  render() {
    const { 
      loading, error, data, columns
    } = this.props;
    
    return (
      <div>
        { loading ? 
          <Spin size="large" />
        :
          error ? 
          <Alert
            message={"Error"}
            description={error}
            type="error"
            showIcon
          />
          :
          data && data.length > 0 ? 
            <Table 
              columns={columns.map(field => {
                return {
                  title: field,
                  dataIndex: field,
                  key: field
                };
              })}
              dataSource={data.map((record, i) => {
                record.key = i;
                return record;
              })}
            />
          :
          <Alert
            message={"Error"}
            description="No data was returned. Ensure that the datasources are returning records and the matrix definitions are correctly configured."
            type="error"
            showIcon
          />
        }
      </div>
    );
  };

  componentDidMount() {
    const { fetchData } = this.props;
    fetchData();
  };

};

export default DataView
