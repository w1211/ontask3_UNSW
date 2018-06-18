import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip, Legend } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class StackedBarChart extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      dataView:null
    };
  }

  generateStackedBarChart = (dataView, type, colNameSelected, groupByCol, interval) => {
    if(type==='number'){
      dataView.transform({
        type: 'bin.histogram',
        field: colNameSelected,
        binWidth: interval,
        groupBy: [groupByCol],
        as: [colNameSelected, 'count']
      });
    }
    else{
      dataView.transform({
        type: 'aggregate', fields: [colNameSelected], 
        operations: 'count', as: 'count',
        groupBy: [groupByCol, colNameSelected]
      });
    }

    dataView.transform({
      type: 'percent',
      field: 'count',
      dimension: groupByCol,
      groupBy: [ colNameSelected ],
      as: 'percent'
    });
  }

  componentDidMount(){
    const {data, type, interval, colNameSelected, groupByCol, range, filterCols} = this.props;

    let dataView = new View().source(data);

    filterData(dataView, type, colNameSelected, filterCols, range);

    this.generateStackedBarChart(dataView, type, colNameSelected, groupByCol, interval);

    this.setState({dataView});
  }

  componentWillReceiveProps(nextProps){
    const { percentageYAxis } = this.props;

    if(percentageYAxis===nextProps.percentageYAxis && this.props!==nextProps && nextProps.show){

      let dataView = new View().source(nextProps.data);

      filterData(dataView, nextProps.type, nextProps.colNameSelected, nextProps.filterCols, nextProps.range);

      this.generateStackedBarChart(dataView, nextProps.type, nextProps.colNameSelected, nextProps.groupByCol, nextProps.interval);

      this.setState({dataView});
    }
  }

  render(){
    const {dataView} = this.state;
    const {percentageYAxis, colNameSelected, type, filterCols, childrenOptions, groupByCol} = this.props;

    let cols = percentageYAxis ? 
    { percent: {
        max: 1,
        formatter: val => {
          val = parseFloat(val * 100).toFixed(1) + '%';
          return val;
    }}}
    :
    { count: {
      min: 0
    }};

    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && cols && percentageYAxis &&
            <Chart height={450} width={600} data={dataView} scale={cols} padding='auto'>
              <Axis name={colNameSelected} title={colNameSelected}
                    label={ type!=='number' && (filterCols.length===0? childrenOptions.length>10 : filterCols.length>10) ? 
                          {offset:5, autoRotate:false, textStyle:{rotate:90, textAlign:'start'}}
                          :
                          {autoRotate:true}}
              />
              <Axis title={{offset:70}} name= {"percent"} />
              <Legend />
              <Tooltip crosshairs={false} position={'top'} inPlot={false}/>
              <Geom type='intervalStack' position={colNameSelected+"*percent"} color={groupByCol}/>
            </Chart>
        }
        { dataView && cols && !percentageYAxis &&
            <Chart height={450} width={600} data={dataView} scale={cols} padding='auto'>
              <Axis name={colNameSelected} title={colNameSelected}
                    label={ type!=='number' && (filterCols.length===0 ? childrenOptions.length>10 : filterCols.length>10) ? 
                          {offset:5, autoRotate:false, textStyle:{rotate:90, textAlign:'start'}}
                          :
                          {autoRotate:true}}
              />
              <Axis title={"Count"} name= {"count"} />
              <Legend />
              <Tooltip crosshairs={false} position={'top'} inPlot={false}/>
              <Geom type='intervalStack' position={colNameSelected+"*count"} color={groupByCol}/>
            </Chart>
        }
        { !dataView && <Spin size="large" /> }
      </div>
    );
  }
}

export default StackedBarChart;