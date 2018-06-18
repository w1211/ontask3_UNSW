import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip, Legend } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData, sortByColName, generateCountPercentField, isInt } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class GroupedBarCharts extends React.Component {
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

  generateGroupedBarCharts = (data, type, interval, range, colNameSelected, groupByCol, filterCols) => {
    let keys = [];
    let dataViews = [];
    let maxCount=0;

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

      sortByColName(curDataView, type, colNameSelected);

      let tmpMax = this.getMaxCount(curDataView);

      if(tmpMax > maxCount){
        maxCount = tmpMax;
      }
      dataViews.push(curDataView);
    }

    this.setState({dataView: dataViews, maxCount, keys})
  }

  componentDidMount(){
    const {data, type, interval, range, colNameSelected, groupByCol, filterCols} = this.props;

    this.generateGroupedBarCharts(data, type, interval, range, colNameSelected, groupByCol, filterCols);
  }

  componentWillReceiveProps(nextProps){
    const { percentageYAxis } = this.props;

    if(percentageYAxis===nextProps.percentageYAxis && this.props!==nextProps && nextProps.show){
      this.generateGroupedBarCharts(nextProps.data, nextProps.type, nextProps.interval, nextProps.range, 
                                    nextProps.colNameSelected, nextProps.groupByCol, nextProps.filterCols);
    }
  }

  render(){
    const { type, percentageYAxis, interval, range, numBins, colNameSelected, groupByCol, visibleField } = this.props;
    const { dataView, maxCount, keys } = this.state;
    let cols={};

    if(type==="number"){
      cols[colNameSelected] = numBins>20 ? 
       {max: isInt(range[1]/interval)?range[1]+interval:range[1],
        min: range[0]}
      :
       {tickInterval: interval,
        max: isInt(range[1]/interval)?range[1]+interval:range[1],
        min: range[0]}
    };

    if(percentageYAxis){
      cols['percent'] = {
        max: 1,
        formatter: val => {
          val = parseFloat(val * 100).toFixed(1) + '%';
          return val;
      }}
    }
    else{
      cols['count'] = {
          max: maxCount,
          min: 0
      };
    }
      
    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && type ?
            percentageYAxis ? 
            <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'left'}}>
              {dataView.map((value, i)=>{
                if(!visibleField || visibleField.includes(groupByCol +'-'+ keys[i].split('_').slice(1))){
                  return(
                    <div key={i} style={type!=="number" && value.rows.length>20?value.rows.length>40?{margin:5, width:900}:{margin:5, width:600}:{margin:5, width:300}}>
                    <p style={{paddingLeft:50}}>{keys[i].split('_').slice(1)}</p>
                    <Chart height={300} width={type!=="number" && value.rows.length>20 ? value.rows.length>40?900:600:300} data={value} scale={cols} padding={['auto', 'auto', 150, 'auto']}>
                      <Axis name={colNameSelected} title={{offset:70}}
                            label={ type!=="number" && value.rows.length>5 ? 
                                    {offset:5, autoRotate:false, textStyle:{rotate:90, textAlign:'start'}}
                                    :
                                    {autoRotate:true}}
                      />
                      <Axis title={{offset:70}} name= {"percent"} />
                      <Legend />
                      <Tooltip />
                      <Geom type='interval' position={colNameSelected+"*percent"} />
                    </Chart>
                    </div>
                    );
                }
              })
            }
            </div>
            :
            <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'left'}}>
              {dataView.map((value, i)=>{
                if(!visibleField || visibleField.includes(groupByCol +'-'+ keys[i].split('_').slice(1))){
                  return(
                    <div key={i} style={type!=="number" && value.rows.length>20?value.rows.length>40?{margin:5, width:900}:{margin:5, width:600}:{margin:5, width:300}}>
                    <p style={{paddingLeft:50}}>{keys[i].split('_').slice(1)}</p>
                    <Chart height={300} width={type!=="number" && value.rows.length>20 ? value.rows.length>40?900:600:300} data={value} scale={cols} padding={['auto', 'auto', 150, 'auto']}>
                      <Axis name={colNameSelected} title={{offset:70}}
                            label={ type!=="number" && value.rows.length>5 ? 
                                    {offset:5, autoRotate:false, textStyle:{rotate:90, textAlign:'start'}}
                                    :
                                    {autoRotate:true}}
                      />
                      <Axis title={{offset:70}} name= {"count"} />
                      <Legend />
                      <Tooltip />
                      <Geom type='interval' position={colNameSelected+"*count"} />
                    </Chart>
                    </div>
                  );
                }
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

export default GroupedBarCharts;