import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData, generateBoxPlot } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class GroupedBoxPlots extends React.Component {
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

  generateGroupedBoxPlots = (data, type, interval, range, colNameSelected, groupByCol, filterCols) => {
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

      generateBoxPlot(curDataView, colNameSelected);

      dataViews.push(curDataView);
    }

    this.setState({dataView: dataViews, keys})
  }

  componentDidMount(){
    const {data, type, interval, range, colNameSelected, groupByCol, filterCols} = this.props;

    this.generateGroupedBoxPlots(data, type, interval, range, colNameSelected, groupByCol, filterCols);
  }

  componentWillReceiveProps(nextProps){
    if(this.props!==nextProps && nextProps.show){
      this.generateGroupedBoxPlots(nextProps.data, nextProps.type, nextProps.interval, nextProps.range, 
                                    nextProps.colNameSelected, nextProps.groupByCol, nextProps.filterCols);
    }
  }

  render(){
    const { type, range, groupByCol, visibleField } = this.props;
    const { dataView, keys } = this.state;
    const cols = {
      range: {
        max: range[1],
        min: range[0]
    }};
      
    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && type ?
            <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'left'}}>
              { dataView.map((value, i)=>{
                if(!visibleField || visibleField.includes(groupByCol +'-'+ keys[i].split('_').slice(1))){
                  return(
                    <div key={i} style={{margin:5, width:300}}>
                    <p style={{paddingLeft:50}}>{keys[i].split('_').slice(1)}</p>
                    <Chart height={250} width={300} data={value} scale={cols}>
                      <Axis name='na' />
                      <Axis name='range' />
                      <Tooltip showTitle={false} crosshairs={{type:'rect', style: {fill: '#E4E8F1',fillOpacity: 0.43}}} 
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
                    </div>
                  );
                }
                return null
              })
            }
            </div>
          :
            <Spin size="large" />
        }
      </div>
    )
  }
}

export default GroupedBoxPlots;