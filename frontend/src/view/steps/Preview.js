import React from 'react';
import { Radio } from 'antd';

import Details from './Details';
import Data from './Data';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;


const Preview = ({ form, formState, datasources, moveRow, viewMode, onChangeViewMode, loading, data }) => {
  return (
    <div>
      <RadioGroup defaultValue="details" onChange={ (e) => { onChangeViewMode(e.target.value); }} style={{ marginBottom: 10 }}>
        <RadioButton value="details">Details</RadioButton>
        <RadioButton value="data">Data</RadioButton>
      </RadioGroup>

      { viewMode === 'details' &&
        <Details
          form={form}
          formState={formState}
          datasources={datasources}
          moveRow={moveRow}
          viewMode={viewMode}
        />
      }

      { viewMode === 'data' &&
        <Data
          form={form}
          formState={formState}
          loading={loading}
          data={data}
        />
      }
    </div>
  );
}

export default Preview;
