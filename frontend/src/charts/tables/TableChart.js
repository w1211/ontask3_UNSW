import React from 'react';
import { Spin, Table } from 'antd';
import { View } from '@antv/data-set';

import { filterData, sortByColName, generateCountPercentField, generatePieChartLabel } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class TableChart extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      dataView: null
    };
  }

  generateTableData = ( data, type, interval, range, colNameSelected, filterCols ) => {
    let dataView = new View().source(data);

    filterData(dataView, type, colNameSelected, filterCols, range);

    generateCountPercentField(dataView, type, interval, colNameSelected);

    sortByColName(dataView, type, colNameSelected);

    generatePieChartLabel(dataView, type, colNameSelected);

    let tableData = dataView.rows.map(
      (value, i)=>{
        value['percent'] = parseFloat(value['percent'] * 100).toFixed(1) + '%';
        value['key']=i; 
        return value;
    });

    this.setState({dataView: tableData});
  }


  componentDidMount(){
    const { data, type, interval, range, colNameSelected, filterCols } = this.props;

    this.generateTableData( data, type, interval, range, colNameSelected, filterCols );
  }

  componentWillReceiveProps(nextProps){
    if(this.props!==nextProps && nextProps.show){
      this.generateTableData( nextProps.data, nextProps.type, nextProps.interval, 
                              nextProps.range, nextProps.colNameSelected, nextProps.filterCols );
    }
  }

  render(){
    const { colNameSelected } = this.props;
    const { dataView } = this.state;
    const cols = [
      {title: colNameSelected, dataIndex: colNameSelected, key: colNameSelected},
      {title: 'Count', dataIndex: 'count', key: 'count'},
      {title: 'Percent', dataIndex:'percent', key:'percent'}
    ]

    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && cols ?
          <Table dataSource={dataView} columns={cols}/>
        :
          <Spin size="large" />
        }
      </div>
    )
  }
}

export default TableChart;