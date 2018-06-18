import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData, generateBoxPlot } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class BoxPlot extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      dataView:null
    };
  }

  componentDidMount(){
    const { data, type, range, colNameSelected, filterCols } = this.props;

    let dataView = new View().source(data);

    filterData(dataView, type, colNameSelected, filterCols, range);

    generateBoxPlot(dataView, colNameSelected);

    this.setState({dataView});
  }

  componentWillReceiveProps(nextProps){
    const { data } = this.props;

    if(this.props!==nextProps && nextProps.show){

      let dataView = new View().source(data);

      filterData(dataView, nextProps.type, nextProps.colNameSelected, nextProps.filterCols, nextProps.range);

      generateBoxPlot(dataView, nextProps.colNameSelected);

      this.setState({dataView});
    }
  }

  render(){
    const { dataView } = this.state;
    const cols = dataView && {
      range: {
        max: dataView.rows[0].high
    }}
      
    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView ?
            <Chart height={450} width={700} data={dataView} scale={cols} padding={[ 20, 120, 95 ]}>
              <Axis name='na' />
              <Axis name='range' />
              <Tooltip showTitle={false} crosshairs={{type:'rect',style: {fill: '#E4E8F1', fillOpacity: 0.43}}}     
                       itemTpl='<li style="margin-bottom:4px;">
                                <span style="background-color:{color};" class="g2-tooltip-marker"></span>
                                {name}<br/>
                                <span style="padding-left: 16px">Max: {high}</span><br/>
                                <span style="padding-left: 16px">Upper quartile: {q3}</span><br/>
                                <span style="padding-left: 16px">Median: {median}</span><br/>
                                <span style="padding-left: 16px">Lower quartile: {q1}</span><br/>
                                <span style="padding-left: 16px">Min: {low}</span><br/></li>'/>
              <Geom type="schema" position="na*range" shape='box' tooltip={['na*low*q1*median*q3*high', (na, low, q1, median, q3, high) => {
                  return {
                    name: na, low, q1, median, q3, high
                  };
                }]}
                style={{stroke: 'rgba(0, 0, 0, 0.45)',fill: '#1890FF',fillOpacity: 0.3}}
              />
            </Chart>
          :
            <Spin size="large" />
        }
      </div>
    )
  }
}

export default BoxPlot;