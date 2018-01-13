import React from 'react';

import { Spin, Alert, Table } from 'antd';



class DataView extends React.Component {

  render() {
    const { 
      isFetchingData, dataError, data
    } = this.props;
    
    return (
      <div>
        { isFetchingData ? 
          <Spin size="large" />
        :
          dataError ? 
          <Alert
            message={"Error"}
            description={dataError}
            type="error"
            showIcon
          />
          :
          data && data.length > 0 ? 
            <Table 
              columns={Object.keys(data[0]).map(field => {
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
    const { fetchMatrixData } = this.props;
    fetchMatrixData();
  };

};

export default DataView
