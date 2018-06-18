import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Legend, Coord, Tooltip, Label } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData, sortByColName, generateCountPercentField, generatePieChartLabel } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class BarChart extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      dataView: null
    };
  }

  componentDidMount(){
    const { data, type, interval, range, colNameSelected, filterCols } = this.props;

    let dataView = new View().source(data);

    filterData(dataView, type, colNameSelected, filterCols, range);

    generateCountPercentField(dataView, type, interval, colNameSelected);

    sortByColName(dataView, type, colNameSelected);

    generatePieChartLabel(dataView, type, colNameSelected);

    this.setState({dataView});
  }

  componentWillReceiveProps(nextProps){
    if(this.props!==nextProps && nextProps.show){

      let dataView = new View().source(nextProps.data);

      filterData(dataView, nextProps.type, nextProps.colNameSelected, nextProps.filterCols, nextProps.range);

      generateCountPercentField(dataView, nextProps.type, nextProps.interval, nextProps.colNameSelected);

      sortByColName(dataView, nextProps.type, nextProps.colNameSelected);

      generatePieChartLabel(dataView, nextProps.type, nextProps.colNameSelected);

      this.setState({dataView});
    }
  }

  render(){
    const { type, colNameSelected } = this.props;
    const { dataView } = this.state;
    const cols = {
      percent: {
        max: 1,
        formatter: val => {
          val = parseFloat(val * 100).toFixed(1) + '%';
          return val;
    }}};
      
    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && type ?
          <Chart height={450} width={600} data={dataView} scale={cols}>
            <Coord type='theta' radius={0.75} />
            <Axis name="percent" />
            <Tooltip 
              showTitle={false}
              itemTpl='<li>
                        <span style="background-color:{color};" class="g2-tooltip-marker"></span>
                        {name}: {value}
                      </li>'
            />
            <Geom
              type="intervalStack"
              position="percent"
              color={colNameSelected}
              tooltip={dataView.rows[0] && colNameSelected &&
                      [colNameSelected+'*percent',(colNameSelected, percent) => {
                        percent = parseInt(percent * 100, 10) + '%';
                        return {
                          name: colNameSelected,
                          value: percent
                        };
                      }]}
              style={{lineWidth: 1, stroke: '#fff'}}
              >
              <Label
                content='percent'
                formatter={(val, item) => {
                            if(dataView.rows[0]){ 
                              return item.point[colNameSelected] + ': ' + val;
                          }}}
              />
            </Geom>
          </Chart>
        :
          <Spin size="large" />
        }
      </div>
    )
  }
}

export default BarChart;