import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip, Guide, Line, Text } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData, sortByColName, generateCountPercentField, isInt, findMaxCountPercent } from '../utils.js';

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

  generateRecordMark(dataView, type, record, percentageYAxis, colNameSelected){
    for(let row of dataView.rows){
      if(type==="number" && Number(record[colNameSelected])<row[colNameSelected][1] && Number(record[colNameSelected])>row[colNameSelected][0]){
        
        return percentageYAxis ? row['percent'] : row['count']
      }
      else if(type!=="number" && record[colNameSelected]===row[colNameSelected]){
        return percentageYAxis ? row['percent'] : row['count']
      }
    }
  }

  generateBarChart(data, type, interval, range, colNameSelected, filterCols, record, isRowWise, percentageYAxis){
    
    let dataView = new View().source(data);
  
    filterData(dataView, type, colNameSelected, filterCols, range);
  
    generateCountPercentField(dataView, type, interval, colNameSelected);
  
    sortByColName(dataView, type, colNameSelected);

    if(isRowWise){
      let markHeight = this.generateRecordMark(dataView, type, record, percentageYAxis, colNameSelected);
      let maxCountPercent = findMaxCountPercent(dataView);

      this.setState({dataView, markHeight, maxCountPercent});
    }
  
    this.setState({dataView});
  }

  componentDidMount(){
    const {data, type, interval, range, colNameSelected, filterCols, record, isRowWise, percentageYAxis} = this.props;
    this.generateBarChart(data, type, interval, range, colNameSelected, filterCols, record, isRowWise, percentageYAxis);
  }

  componentWillReceiveProps(nextProps){
    const { percentageYAxis } = this.props;

    if(nextProps.isRowWise || (percentageYAxis===nextProps.percentageYAxis && this.props!==nextProps && nextProps.show)){

      this.generateBarChart(nextProps.data, nextProps.type, nextProps.interval, nextProps.range, nextProps.colNameSelected,
                            nextProps.filterCols, nextProps.record, nextProps.isRowWise, nextProps.percentageYAxis);
    }
  }

  render(){
    const { type, percentageYAxis, interval, range, colNameSelected, numBins, record, isRowWise } = this.props;
    const { dataView, markHeight, maxCountPercent } = this.state;
    
    let cols={};
    let top = markHeight && maxCountPercent && markHeight+(percentageYAxis ? maxCountPercent[1]*0.05 : maxCountPercent[0]*0.05);

    if(type==='number'){
      cols[colNameSelected] = numBins>20 ? 
       {max: isInt(range[1]/interval)?range[1]+interval:range[1],
        min: range[0]}
      :
       {tickInterval: interval,
        max: isInt(range[1]/interval)?range[1]+interval:range[1],
        min: range[0]}
    }

    if(percentageYAxis){
      cols['percent'] = {
        alias: 'Percent',
        max: 1,
        formatter: val => {
          val = parseFloat(val * 100).toFixed(1) + '%';
          return val;
      }};
    }
    else{
      cols['count'] = {
        alias: 'Count',
        min: 0
      };
    }

    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && cols && percentageYAxis &&
          <Chart height={450} width={600} data={dataView} scale={cols} padding='auto'>
            <Axis
              name={colNameSelected} title={{offset:50}}
              label={ type!=='number' && dataView.rows.length>10 ? 
                          {offset:5, autoRotate:false, textStyle:{rotate:90, textAlign:'start'}}
                          :
                          {autoRotate:true}}
            />
            <Axis title={{offset:70}} name= {"percent"} autoRotate={true} label={{autoRotate:false}} />
            <Tooltip/>
            <Geom type="interval" position={colNameSelected+"*percent"} />
            {isRowWise && record &&
              <Guide>
                <Guide.Line top={true} start={[record[colNameSelected], markHeight]} end={[record[colNameSelected], top]}
                      lineStyle={{stroke:'#000', lineDash:[2,0], lineWidth: 1 }}
                />
                <Guide.Text top= {true}
                      position= {[record[colNameSelected],top]} 
                      content= {"You are here"}
                      style= {{ fill: '#666', fontSize: '12' }}
                      offsetX= {-35} offsetY= {-10}
                />
              </Guide>
            }
          </Chart>
        }
        { dataView && cols && !percentageYAxis &&
          <Chart height={450} width={600} data={dataView} scale={cols} padding='auto'>
            <Axis name={colNameSelected} title={{offset:50}} autoRotate={true}
                  label={ type!=='number' && dataView.rows.length>10 ? 
                          {offset:5, autoRotate:false, textStyle:{rotate:90, textAlign:'start'}}
                          :
                          {autoRotate:true}}
            />
            <Axis title={{offset:70}} name= {"count"} />
            <Tooltip/>
            <Geom type="interval" position={colNameSelected+"*count"} />
            {isRowWise && record &&
              <Guide>
                <Guide.Line top={true} start={[record[colNameSelected], markHeight]} end={[record[colNameSelected], top]}
                      lineStyle={{stroke:'#000', lineDash:[2,0], lineWidth: 1 }}
                />
                <Guide.Text top= {true}
                      position= {[record[colNameSelected],top]} 
                      content= {"You are here"}
                      style= {{ fill: '#666', fontSize: '12' }}
                      offsetX= {-35} offsetY= {-10}
                />
              </Guide>
            }
          </Chart>
        }
        { !dataView && <Spin size="large" /> }
      </div>
    )
  }
}

export default BarChart;