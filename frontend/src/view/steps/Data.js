import React from 'react';
import { Alert } from 'antd';


const Data = ({ form, formState }) => {
  if (!formState) return null;

  return (
    <div>
      <Alert style={{ marginTop: 10 }} message="Note that only the first 10 records are shown in this data preview" type="info" showIcon/>
    </div>
  );
}

export default Data;
