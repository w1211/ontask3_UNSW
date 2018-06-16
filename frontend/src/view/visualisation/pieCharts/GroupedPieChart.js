import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip, Legend, Coord, Label } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData, isInt, generateCountPercentField, generatePieChartLabel } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class GroupedPieChart extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      dataView: null
    };
  }

  filterSelectedItem = (i, dataView, type, range, keys, colNameSelected, groupByCol, filterCols) => {
    if(type === "number"){
      dataView.transform({
        type: 'filter',
        callback(row) {
          if('_'+row[groupByCol] === keys[i] && row[groupByCol] !=='' && row[colNameSelected] !=='' &&
             row[colNameSelected] >= range[0] && row[colNameSelected] <= range[1]){
            return row;
          } ;
      }});
    }
    else if(filterCols.length!==0){
      dataView.transform({
        type: 'filter',
        callback(row) {
          if('_'+row[groupByCol] === keys[i] && row[colNameSelected] !=='' &&
             filterCols.indexOf(row[colNameSelected]) !== -1){
            return row;
          } ;
      }});
    }
  }

  getMaxCount = (dataView) => {
    dataView.transform({
      type: 'sort',
      callback(a, b) {
        return a.count - b.count;
      }
    });
    return dataView.rows[dataView.rows.length-1].count;
  }

  generateGroupedPieCharts = (data, type, interval, range, colNameSelected, groupByCol, filterCols) => {
    let keys = [];
    let dataViews = [];

    let dataViewForKeys = new View().source(data);

    filterData(dataViewForKeys, type, colNameSelected, filterCols, range);

    dataViewForKeys.transform({
      type: 'partition',
      groupBy: [ groupByCol ]
    });

    keys = Object.keys(dataViewForKeys.rows);

    for(let i in keys){
      let curDataView;

      curDataView = new View().source(data);
      
      this.filterSelectedItem(i, curDataView, type, range, keys, colNameSelected, groupByCol, filterCols);

      if(curDataView.rows.length===0){
        dataViews.push(curDataView);
        continue;
      }

      generateCountPercentField(curDataView, type, interval, colNameSelected);

      generatePieChartLabel(curDataView, type, colNameSelected);

      dataViews.push(curDataView);
    }

    this.setState({dataView: dataViews, keys})
  }

  componentDidMount(){
    const {data, type, interval, range, colNameSelected, groupByCol, filterCols} = this.props;

    this.generateGroupedPieCharts(data, type, interval, range, colNameSelected, groupByCol, filterCols);
  }

  componentWillReceiveProps(nextProps){
    if(this.props!==nextProps && nextProps.show){
      this.generateGroupedPieCharts(nextProps.data, nextProps.type, nextProps.interval, nextProps.range, 
                                   nextProps.colNameSelected, nextProps.groupByCol, nextProps.filterCols);
    }
  }

  render(){
    const { type, interval, range, colNameSelected, groupByCol, visibleField } = this.props;
    const { dataView, keys } = this.state;
    const cols = {
      [colNameSelected]: {
        tickInterval: interval,
        max: isInt(range[1]/interval)?range[1]+interval:range[1],
        min: range[0]
      },
      percent: {
        max: 1,
        formatter: val => {
          val = parseFloat(val * 100).toFixed(1) + '%';
          return val;
    }}};
      
    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && type ?
            dataView.map((value, i)=>{
              if(!visibleField || visibleField.includes(groupByCol +'-'+ keys[i].split('_').slice(1))){
                return(
                  <div key={i} style={{margin:5, width:300, hight:400, overflow:'scroll'}}>
                  <p style={{paddingLeft:50}}>{keys[i].split('_').slice(1)}</p>
                  <Chart forceFit hight={300} data={value} scale={cols}>
                    <Coord type='theta' radius={0.75} />
                    <Axis name="percent" />
                    <Legend name={colNameSelected} title={true} useHtml={true} dx={20} offsetY={-100}/>
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
                      tooltip={colNameSelected &&
                        [colNameSelected+'*percent',(colNameSelected, percent) => {
                          percent = (percent * 100).toFixed(1) + '%';
                          return {
                            name: colNameSelected,
                            value: percent
                          };
                        }]
                      }
                      style={{lineWidth: 1, stroke: '#fff'}}
                    >
                      <Label
                        content='percent'
                        formatter={(val, item) => {
                            return item.point[colNameSelected] + ': ' + val;
                        }}
                      />
                    </Geom>
                  </Chart>
                  </div>
                );
              }
            })
          :
            <Spin size="large" />
        }
      </div>
    )
  }
}

export default GroupedPieChart;