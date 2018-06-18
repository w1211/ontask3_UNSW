import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip, Legend } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class StackedBoxPlot extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      dataView:null
    };
  }

  generateStackedBoxPlot = (dataView, colNameSelected, groupByCol) => {
    dataView.transform({
      type: 'map',
      callback: (obj) => {
        obj[colNameSelected] = Number(obj[colNameSelected]);
        obj.na = colNameSelected;
        return obj;
    }})
    .transform({
      type: 'bin.quantile',
      field: colNameSelected,
      as: '_bin',
      groupBy: [ groupByCol ],
    });
  }

  componentDidMount(){
    const {data, type, colNameSelected, groupByCol, range, filterCols} = this.props;

    let dataView = new View().source(data);

    filterData(dataView, type, colNameSelected, filterCols, range);

    this.generateStackedBoxPlot(dataView, colNameSelected, groupByCol);

    this.setState({dataView});
  }

  componentWillReceiveProps(nextProps){
    if(this.props!==nextProps && nextProps.show){

      let dataView = new View().source(nextProps.data);

      filterData(dataView, nextProps.type, nextProps.colNameSelected, nextProps.filterCols, nextProps.range);

      this.generateStackedBoxPlot(dataView, nextProps.colNameSelected, nextProps.groupByCol);

      this.setState({dataView});
    }
  }

  render(){
    const { dataView } = this.state;
    const { range, groupByCol} = this.props;

    let cols = {
      _bin: {
        max: range[1],
        min: range[0]
    }};

    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView ?
          <Chart height={450} width={900} data={dataView} scale={cols} padding='auto'>
            <Tooltip />
            <Legend />
            <Axis name='na' />
            <Axis name='_bin' />
            <Geom type="schema" position="na*_bin" shape='box' color={groupByCol} adjust='dodge'/>
          </Chart>
        :
          <Spin size="large" />
        }
      </div>
    );
  }
}

export default StackedBoxPlot;