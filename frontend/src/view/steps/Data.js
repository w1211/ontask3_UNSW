import React from 'react';
import { Alert, Table, Spin } from 'antd';


const Data = ({ form, formState, loading, data }) => {
  if (!formState) return null;
  
  const columns = formState.columns.map((column, i) => {
    const field = (column.label && column.label.value && column.label.value !== column.field.value) ? column.label.value : column.field.value;
    return {
      title: field,
      dataIndex: field,
      key: field,
      fixed: i === 0 ? 'left' : undefined
    }
  });

  data = data && data.map((data, i) => ({...data, key: i }));

  return (
    loading ?
      <div>
        <Spin size="large" />
      </div>
    :
      <div>
        <Table
          columns={columns}
          dataSource={data}
          size="middle"
          pagination={{ size: 'small', pageSize: 5 }}
          scroll={{ x: (columns.length - 1) * 175 }}
        />
        { data && data.length > 10 && <Alert style={{ marginTop: 10 }} message="Note that only the first 10 records are shown in this data preview" type="info" showIcon/> }
      </div>
  );
}

export default Data;
