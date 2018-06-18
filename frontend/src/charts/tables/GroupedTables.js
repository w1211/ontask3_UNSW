import React from 'react';
import { Spin, Table } from 'antd';
import { View } from '@antv/data-set';

import { generateCountPercentField, generatePieChartLabel, sortByColName } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class GroupedTables extends React.Component {
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

  paddingZeroColumns = (data, curDataView, type, range, numBins, interval, colNameSelected, groupByCol) => {
    if(type==="number"){
      let min = Math.floor(range[0]/interval)*interval;
      if(numBins > curDataView.length){
        for(let i=0; i<numBins; i++){
          let tmp = ''+(min+interval*i)+'-'+(min+interval*(i+1));
          if(i>=curDataView.length||curDataView[i][colNameSelected]!==tmp){
            curDataView.splice(i, 0, {[colNameSelected]:tmp, percent:0+'%', count:0, key:i});
          }
          else{
            curDataView[i]['key']=i;
          }
        }
      }
    }
    else{
      let keysDv = new View().source(data)
      .transform({
        type: 'filter',
        callback(row) {
          if(row[groupByCol] !=='' && row[colNameSelected] !==''){
            return row;
          }
        }
      })
      .transform({
        type: 'partition',
        groupBy: [colNameSelected]
      });

      let paddingKeys = Object.keys(keysDv.rows);
      let tmpLen = curDataView.length;
      
      paddingKeys.sort(function(a, b){
        if(a.split('_')[1] > b.split('_')[1]){
          return 1;
        }
        else if(a.split('_')[1] === b.split('_')[1]){
          return 0;
        }
        else{
          return -1;
        }
      });

      if(paddingKeys.length > tmpLen){
        let newCurDataView = [];
        let j=0;

        for(let i=0; i<paddingKeys.length; i++){
          if(i>=tmpLen || '_'+curDataView[j][colNameSelected]!==paddingKeys[i]){
            newCurDataView.push({[colNameSelected]:paddingKeys[i].split('_')[1], percent:0+'%', count:0, key:i+tmpLen});
          }
          else{
            curDataView[j]['key']= i+tmpLen;
            newCurDataView.push(curDataView[j]);
            j++;
          }
        }
        return newCurDataView;
      }
    }
    return curDataView;
  }

  generateGroupedTables = (data, type, interval, numBins, range, colNameSelected, groupByCol, filterCols) => {
    let keys = [];
    let dataViews = [];

    let dataViewForKeys = new View().source(data)
    .transform({
      type: 'filter',
      callback(row) {
        if(row[groupByCol] !=='' && row[colNameSelected] !==''){
          return row;
        }
      }
    })
    .transform({
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

      sortByColName(curDataView, type, colNameSelected);

      curDataView.rows.map(
        (value, i)=>{
          value['percent'] = parseFloat(value['percent'] * 100).toFixed(1) + '%';
          value['key'] = i;
          return value;
      });

      curDataView = curDataView.rows;
      curDataView = this.paddingZeroColumns(data, curDataView, type, range, numBins, interval, colNameSelected, groupByCol);

      dataViews.push(curDataView);
    }

    this.setState({dataView: dataViews, keys})
  }

  componentDidMount(){
    const {data, type, interval, numBins, range, colNameSelected, groupByCol, filterCols} = this.props;

    this.generateGroupedTables(data, type, interval, numBins, range, colNameSelected, groupByCol, filterCols);
  }

  componentWillReceiveProps(nextProps){
    if(this.props!==nextProps && nextProps.show){
      this.generateGroupedTables(nextProps.data, nextProps.type, nextProps.interval, nextProps.numBins, nextProps.range, 
                                    nextProps.colNameSelected, nextProps.groupByCol, nextProps.filterCols);
    }
  }

  render(){
    const { colNameSelected } = this.props;
    const { dataView, keys } = this.state;

    const cols = [
      {title: colNameSelected, dataIndex: colNameSelected, key: colNameSelected},
      {title: 'Count', dataIndex: 'count', key: 'count'},
      {title: 'Percent', dataIndex:'percent', key:'percent'}
    ];
      
    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && cols ?
            dataView.map((value, i)=>{
              return(
                <div key={i} style={{margin:5, width:300}}>
                  <p style={{paddingLeft:10}}>{keys[i].split('_').slice(1)}</p>
                  <Table key={i} dataSource={value} columns={cols}/>
                </div>
              )
            })  
          :
            <Spin size="large" />
        }
      </div>
    )
  }
}

export default GroupedTables;