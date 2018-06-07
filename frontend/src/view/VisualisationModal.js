import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Select, Slider, InputNumber, TreeSelect, Checkbox, Table } from 'antd';
import { Chart, Geom, Axis, Legend, Coord, Tooltip, Label, Guide } from 'bizcharts';
import { View as dataView} from '@antv/data-set';

import * as ViewActionCreators from './ViewActions';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

const {Option} = Select;
const {TreeNode} = TreeSelect;
const {Line, Text} = Guide;

class VisualisationModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.state = {
      chartType:"barChart", colNameSelected:null,
      interval:5, range:null, 
      groupByCol:null, numBins:null, 
      visibleField:null, onSameChart:false, 
      percentageAxis:false, selections:null
    };
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  };

  isInt = (n) => {
    return n % 1 === 0;
  }

  handleCancel = () => { 
    this.boundActionCreators.closeVisualisationModal(); 
    this.setState({ chartType:"barChart", colNameSelected:null, 
                    range:null, interval:5, 
                    groupByCol: null, numBins: null, 
                    visibleField: null, onSameChart: false, 
                    selections: null, percentageAxis:false
                  }); 
  };

  handleSubmit = () => {
    const { selectedId } = this.props;
    const { chartType, numBins, range} = this.state;
    this.boundActionCreators.updateVisualisationChart(selectedId, chartType, numBins, range[0], range[1]);
  };

  generateCountField = (dv, type, interval, colNameSelected) => {
    if (type === "number") {
      dv.transform({
        type: 'bin.histogram',
        field: colNameSelected,
        binWidth: interval,
        as: [colNameSelected, 'count']
      });
    }
    else{
      dv.transform({
        type: 'aggregate', fields: [colNameSelected], 
        operations: 'count', as: 'count',
        groupBy: [colNameSelected]
      });
    }
    return dv;
  }

  getMaxCount = (dv) => {
    dv.transform({
      type: 'sort',
      callback(a, b) {
        return a.count - b.count;
      }
    });
    return dv.rows[dv.rows.length-1].count;
  }

  generatePieChart = (dv,type, colNameSelected, percentageAxis) => {
    if(percentageAxis){
      dv.transform({
        type: 'percent', field: 'count',
        dimension: 'combinedFiled', as: 'percent'
      })
    }
    else{
      dv.transform({
        type: 'percent', field: 'count',
        dimension: colNameSelected, as: 'percent'
      })
    }
    if(type === "number"){
      dv.transform({
        type: 'map',
        callback: (row) => {
          row[colNameSelected]=
            (this.isInt(row[colNameSelected][0])?row[colNameSelected][0]:row[colNameSelected][0].toFixed(2))
            +'-'+
            (this.isInt(row[colNameSelected][1])?row[colNameSelected][1]:row[colNameSelected][1].toFixed(2));
          return row;
      }});
    }
    return dv;
  }

  generateBoxPlot = (dv, colNameSelected) => {
    dv.transform({
      type: 'map',
      callback: (obj) => {
        obj[colNameSelected] = Number(obj[colNameSelected]);
        return obj;
    }})
    .transform({
      type: 'bin.quantile',
      field: colNameSelected,
      as: 'range',
      fraction: 4
    })
    .transform({
      type: 'map',
      callback: (row) => {
        row.low = row.range[0]; row.q1 = row.range[1];
        row.median = row.range[2]; row.q3 = row.range[3];
        row.high = row.range[4]; row.na = colNameSelected;
        return row;
    }});
    return dv;
  }

  generateSubOptionList = (field, data) => {
    let keyList = [];
    let dv = new dataView().source(data).transform({
      type: 'aggregate', fields: [field], 
      operations: 'count', as: 'count',
      groupBy: [field]
    });
    
    for(let i in dv.rows){
      let tmp = dv.rows[i][field];
      keyList.push({label:tmp, value:field+'-'+tmp, key:''+tmp+'-'+i});
    }
    return keyList;
  }

  getMinMaxValue = (data, colNameSelected) => {
    let dv = new dataView()
    .source(data)
    .transform({
      type: 'filter',
      callback(row) {
        if(row[colNameSelected] !==''){
          row[colNameSelected] = Number(row[colNameSelected]);
          return row;
        }
      }
    })
    .transform({
      type: 'aggregate',
      fields: [colNameSelected, colNameSelected],
      operations: ['max', 'min'],
      as: ['maxValue', 'minValue']
    });

    return [Number(dv.rows[0].minValue),Number(dv.rows[0].maxValue)]
  }

  generateStackedHistogram = (data, type, interval, colNameSelected, groupByCol, range) => {
    let dv = new dataView().source(data)
    .transform({
      type: 'filter',
      callback(row) {
        if(row[groupByCol] !==''){
          return row;
        }
      }
    })
    .transform({
      type: 'filter',
      callback(row) {
        return row[colNameSelected] >= range[0] && row[colNameSelected] <= range[1] ;
    }});

    if(type==='number'){
      dv.transform({
        type: 'bin.histogram',
        field: colNameSelected,
        binWidth: interval,
        groupBy: [groupByCol],
        as: [colNameSelected, 'count']
      });
    }
    else{
      dv.transform({
        type: 'aggregate', fields: [colNameSelected], 
        operations: 'count', as: 'count',
        groupBy: [groupByCol, colNameSelected]
      });
    }
    dv.transform({
      type: 'map',
      callback: (obj) => {
        obj['combinedFiled'] = obj[colNameSelected]+obj[groupByCol];
        return obj;
    }})
    return dv;
  }

  generateGroupedBoxPlot = (data, colNameSelected, groupByCol, range) => {
    let dv;

    dv = new dataView().source(data)
    .transform({
      type: 'filter',
      callback(row) {
        if(row[colNameSelected] !=='' && row[groupByCol] !==''){
          return row;
        }
      }
    })
    .transform({
      type: 'filter',
      callback(row) {
        return row[colNameSelected] >= range[0] && row[colNameSelected] <= range[1] ;
    }})
    .transform({
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

    return dv;
  }

  render() {
    const { visualisation_visible, build, data, visualise, isRowWise, record, containerId } = this.props;
    const { chartType, interval, groupByCol, visibleField, onSameChart, percentageAxis } = this.state;
    let { range, numBins } = this.state;

    let dv;
    let cols;
    let type;
    let keys;
    let colNameSelected;
    let dataViews = [];
    let tableData;
    let minMax;

    if (build && data && (this.state.colNameSelected || visualise)) {

      let buildStepIndex = this.state.colNameSelected ? this.state.colNameSelected.stepIndex : visualise.stepIndex;
      let fieldName = this.state.colNameSelected ? this.state.colNameSelected.field : visualise.field;
      
      const buildStep = build.steps[buildStepIndex];

      if (buildStep.type === 'datasource') {
        type = buildStep.datasource.types[fieldName];
        colNameSelected = buildStep.datasource.labels[fieldName];
      };

      minMax = this.getMinMaxValue(data, colNameSelected);
      range = range ? range : minMax;

      if(!numBins){
        if(this.isInt(range[1]/interval)){
          numBins = (range[1] - Math.floor(range[0]/interval)*interval)/interval+1;
        }
        else{
          numBins = (Math.ceil(range[1]/interval)*interval - Math.floor(range[0]/interval)*interval)/interval;
        }
      }
      
      if(groupByCol && onSameChart && chartType==="barChart" && !percentageAxis){
        dv = this.generateStackedHistogram(data, type, interval, colNameSelected, groupByCol, range);
      }

      if(groupByCol && onSameChart && chartType==="barChart" && percentageAxis){
        dv = this.generateStackedHistogram(data, type, interval, colNameSelected, groupByCol, range);
        this.generatePieChart(dv, type, colNameSelected, percentageAxis);
        cols = {
          percent: {
            formatter: val => {
              val = parseFloat(val * 100).toFixed(2) + '%';
              return val;
        }}};
      }

      if(groupByCol && onSameChart && chartType==="boxPlot"){
        cols={
          _bin: {
            max: range[1],
            min: range[0]
        }};

        dv = this.generateGroupedBoxPlot(data, colNameSelected, groupByCol, range);
      }

      if(groupByCol && !onSameChart){

        dv = new dataView().source(data)
        .transform({
          type: 'filter',
          callback(row) {
            if(row[groupByCol] !==''){
              return row;
            }
          }
        })
        .transform({
          type: 'partition',
          groupBy: [ groupByCol ]
        });

        keys = Object.keys(dv.rows);

        let maxCount=0;

        for(let i in keys){
          let tmpdv;
          tmpdv = new dataView().source(data)
          .transform({
            type: 'filter',
            callback(row) {
              if('_'+row[groupByCol] === keys[i] && row[colNameSelected] !==''){
                return row;
              }
            }
          })
          .transform({
            type: 'filter',
            callback(row) {
              return row[colNameSelected] >= range[0] && row[colNameSelected] <= range[1] ;
          }});
          
          if(tmpdv.rows.length===0){
            dataViews.push(tmpdv);
            cols={};
            continue;
          }

          if(chartType!=="boxPlot"){
            this.generateCountField(tmpdv, type, interval, colNameSelected);
            let tmpMax = this.getMaxCount(tmpdv);
            if( tmpMax > maxCount){
              maxCount = tmpMax;
            }
          }
          if(chartType === "pieChart" || percentageAxis){
            this.generatePieChart(tmpdv, type, colNameSelected);
          }

          if(chartType==="boxPlot"){
            this.generateBoxPlot(tmpdv, colNameSelected);
          }

          if(chartType === "table"){
            this.generatePieChart(tmpdv, type, colNameSelected);
            tmpdv = tmpdv.rows.map(
              (value, i)=>{
                value['percent'] = parseFloat(value['percent'] * 100).toFixed(2) + '%';
                value['key']=i; 
                return value;
            });
          }
          dataViews.push(tmpdv);
        }

        if(chartType==="barChart" && !percentageAxis){
          if(chartType==="number"){
            cols = {
              [colNameSelected]: {
                tickInterval: interval,
                max: range[1],
                min: range[0]
              },
              count:{
                max: maxCount,
                min: 0
              }
            };
          }
          else{
            cols = {
              count:{
                max: maxCount,
                min: 0
              }
            };
          }
        }
        
        if(chartType==="pieChart" || percentageAxis){
          cols = {
            percent: {
              formatter: val => {
                val = parseFloat(val * 100).toFixed(2) + '%';
                return val;
          }}};
        }

        if(chartType==="boxPlot"){
          cols={
            range: {
              max: range[1],
              min: range[0]
          }};
        }

        if(chartType==="table"){
          cols = [
            {title: colNameSelected, dataIndex: colNameSelected, key: colNameSelected},
            {title: 'Count', dataIndex: 'count', key: 'count'},
            {title: 'Percent', dataIndex:'percent', key:'percent'}
          ];
        }
      }

      //no group by
      if(!groupByCol){
        dv = new dataView()
          .source(data)
          .transform({
            type: 'filter',
            callback(row) {
              return row[colNameSelected] !=='' ;
            }
        })
        .transform({
          type: 'filter',
          callback(row) {
            return row[colNameSelected] >= range[0] && row[colNameSelected] <= range[1] ;
        }});

        if(chartType==="barChart"){
          if(chartType==="number"){
            cols = {
              [colNameSelected]: {
                tickInterval: interval,
                max: range[1],
                min: range[0]
              },
              count:{
                min: 0
          }};}
          else{
            cols = {
              count:{
                min: 0
          }};}
        }

        if (chartType!=="boxPlot"){
          this.generateCountField(dv, type, interval, colNameSelected);

          if(chartType === "pieChart" || percentageAxis || chartType === "table"){
            cols = {
              percent: {
                formatter: val => {
                  val = parseFloat(val * 100).toFixed(2) + '%';
                  return val;
            }}};
            this.generatePieChart(dv, type, colNameSelected);
          }
        }

        if(chartType==="boxPlot"){
          this.generateBoxPlot(dv, colNameSelected);

          cols ={
            range: {
              max: dv.rows[0].high
          }}
        }
        
        if(chartType === "table"){
          tableData = dv.rows.map(
            (value, i)=>{
              value['percent'] = parseFloat(value['percent'] * 100).toFixed(2) + '%';
              value['key']=i; 
              return value;
          });
          cols = [
            {title: colNameSelected, dataIndex: colNameSelected, key: colNameSelected},
            {title: 'Count', dataIndex: 'count', key: 'count'},
            {title: 'Percent', dataIndex:'percent', key:'percent'}
          ]
        }
      }
    }

    let options = [];

    build && build.steps.forEach((step, stepIndex) => {
      if (step.type === 'datasource') {
        let index=0;
        step = step.datasource;
        step.fields.forEach(field => {
          if (step.matching !== field && step.primary !== field) {
            const label = step.labels[field];
            let sublist = this.generateSubOptionList(field, data);
            options.push({ type: step.types[field], label: field, value: 'group-'+field, children: sublist, key: ''+field+'-'+index});
          };
          index++;
        });
      };
    });
    
    return (
      <Modal
        width={1000}
        visible={visualisation_visible}
        title={'Visualisation'}
        onCancel={this.handleCancel}
        onOk={this.handleSubmit}
        okText="Save"
        cancelText="Close"
      >
      <div style={{display:"flex", flexWrap: 'wrap', justifyContent:"left", alignItems: "center", marginBottom: 20}}>
        <h4>Chart type: </h4>
        <Select
          style={{width: 150, marginLeft:15, marginRight:15}}
          value={chartType}
          onChange={(value)=>{this.setState({chartType: value})}}
        >
          <Option value="barChart">Barchart</Option>
          <Option value="pieChart">Piechart</Option>
          <Option value="table">Table</Option>
          { type === "number" && <Option value="boxPlot">Boxplot</Option> }
        </Select>
      { !isRowWise && options &&
        <div style={{display:"flex", justifyContent:"left", alignItems: "center"}}>
          <h4>Plot by: </h4>
          <TreeSelect
            style={{ width: 200, marginLeft:10}}
            onChange={(value, label, extra)=>{
              if(value.length===0){
                this.setState({
                  groupByCol: null,
                  visibleField: null,
                  selections: null,
                  onSameChart: false
                });
              }
              else if(extra.triggerValue.split('-')[0]==='group' && extra.triggerValue.split('-')[1]!==groupByCol){
                this.setState({
                  groupByCol: extra.triggerValue.split('-')[1],
                  visibleField: null,
                  selections: [extra.triggerValue]
                });
              }
              else if(extra.triggerValue.split('-')[0]!=='group' && extra.triggerValue.split('-')[0]===groupByCol){;
                if(value.length===1 && value[0].split('-')[1]===groupByCol){
                  this.setState({
                    visibleField: null,
                    selections: value
                  });
                }
                else{
                  this.setState({
                    visibleField: value,
                    selections: value
                  });
                }
              }
              else if(extra.triggerValue.split('-')[0]!=='group' && extra.triggerValue.split('-')[0]!==groupByCol){
                this.setState({
                  groupByCol: extra.triggerValue.split('-')[0], 
                  visibleField: [extra.triggerValue],
                  selections: [extra.triggerValue]
                });
              }
            }}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            placeholder="Please select group"
            value={this.state.selections}
            treeCheckable={true}
            showCheckedStrategy={TreeSelect.SHOW_PARENT}
            allowClear={true}
          >
          { options.filter(option => {
              if(option.type==="text") return true;
              return false;
            }).map((option, i) => {
              return(
                <TreeNode title={option.label} value={option.value} key={i+option.key}>
                  {!onSameChart && option.children.length!==0 &&
                    option.children.map((child, i) => {
                      return(
                        <TreeNode title={child.label} value={child.value} key={i+child.key}/>
                      )
                    })
                  }
                </TreeNode>
              )
            })}
          </TreeSelect>
          </div>
      }
      { !isRowWise && chartType !== "pieChart" && chartType !== "table" &&
        <Checkbox checked={onSameChart} style={{marginLeft:15}} onChange={(value)=>{this.setState({onSameChart:value.target.checked})}}>On same chart</Checkbox>
      }
      { !isRowWise && chartType === "barChart" &&
        <Checkbox checked={percentageAxis} style={{ marginLeft:15}} onChange={(value)=>{this.setState({percentageAxis:value.target.checked})}}>Show percentage</Checkbox>
      }
      { isRowWise &&
        <div>
          <h4>Columns: </h4>
          <Select
            style={{ width: 175, marginLeft:10, display:"flex"}}
            value={colNameSelected}
            onChange={
              (e) => {
                const [stepIndex, field] = e.split(/_(.+)/);
                this.setState({ 
                  colNameSelected: {
                    stepIndex,
                    field,
                  },
                  numBins:null,
                  interval:5
                });
              }
            }
          >
          {options.map((option, i) => {
            return(
              <Option value={option.value} key={option.key}>{option.label}</Option>
            )
          })}
        </Select>
        </div>
      }
      </div>
      { chartType === "barChart" && groupByCol && onSameChart && !percentageAxis &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
          <Chart height={450} width={600} data={dv}
          >
            <Axis
              name={colNameSelected}
              title={colNameSelected}
              autoRotate={true}
              grid={{
                lineStyle: {
                  stroke: '#d9d9d9',
                  lineWidth: 1,
                  lineDash: [ 2, 2 ]
                }
              }}
            />
            <Axis title={"Count"} name= {"count"} />
            <Legend />
            <Tooltip crosshairs={false} position={'top'} inPlot={false}/>
            <Geom type='intervalStack' position={colNameSelected+"*count"} color={groupByCol}/>
          </Chart>
        </div>
      }
      { chartType === "barChart" && groupByCol && onSameChart && percentageAxis &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
          <Chart height={450} width={600} data={dv} scale={cols}
          >
            <Axis
              name={colNameSelected}
              title={colNameSelected}
              autoRotate={true}
              grid={{
                lineStyle: {
                  stroke: '#d9d9d9',
                  lineWidth: 1,
                  lineDash: [ 2, 2 ]
                }
              }}
            />
            <Axis title={"Percent"} name= {"percent"} />
            <Legend />
            <Tooltip crosshairs={false} position={'top'} inPlot={false}/>
            <Geom type='intervalStack' position={colNameSelected+"*percent"} color={groupByCol}/>
          </Chart>
        </div>
      }
      { chartType === "barChart" && groupByCol && !onSameChart && percentageAxis &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
          {dataViews.map((value, i)=>{
            if(!visibleField || visibleField.includes(groupByCol +'-'+ keys[i].split('_').slice(1))){
              return(
                <div key={i} style={{margin:5, width:300}}>
                <p style={{paddingLeft:50}}>{keys[i].split('_').slice(1)}</p>
                <Chart height={250} width={300} data={value} scale={cols}>
                  <Axis name={colNameSelected} title={colNameSelected} autoRotate={true} />
                  <Axis title={"Percent"} name= {"percent"} />
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
      }
      { chartType === "barChart" && groupByCol && !onSameChart && !percentageAxis &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
          {dataViews.map((value, i)=>{
            if(!visibleField || visibleField.includes(groupByCol +'-'+ keys[i].split('_').slice(1))){
              return(
                <div key={i} style={{margin:5, width:300}}>
                <p style={{paddingLeft:50}}>{keys[i].split('_').slice(1)}</p>
                <Chart height={250} width={300} data={value} scale={cols}>
                  <Axis
                    name={colNameSelected}
                    title={colNameSelected}
                    autoRotate={true}
                  />
                  <Axis title={"Count"} name= {"count"} />
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
      }
      { chartType === "barChart" && !groupByCol && dv && percentageAxis &&
        <div style={{display: 'flex', textAlign: 'center', flexDirection: 'column', justifyContent:'center'}}>
          <Chart height={450} width={600} data={dv} scale={cols}>
            <Axis name={colNameSelected} title={colNameSelected} autoRotate={true} />
            <Axis title={"Percent"} name= {"percent"} />
            <Tooltip/>
            <Geom type="interval" position={colNameSelected+"*percent"} />
          </Chart>
        </div>
      }
      { chartType === "barChart" && !groupByCol && dv && !percentageAxis &&
        <div style={{display: 'flex', textAlign: 'center', flexDirection: 'column', justifyContent:'center'}}>
          <Chart height={450} width={600} data={dv} scale={cols}>
            <Axis name={colNameSelected} title={colNameSelected} autoRotate={true} />
            <Axis title={"Count"} name= {"count"} />
            <Tooltip/>
            <Geom type="interval" position={colNameSelected+"*count"} />
          </Chart>
        </div>
      }
      { chartType==="pieChart" && groupByCol &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
          { dataViews.map((value, i)=>{
            if(!visibleField || visibleField.includes(groupByCol +'-'+ keys[i].split('_').slice(1))){
              return(
                <div key={i} style={{margin:5, width:300}}>
                <p style={{paddingLeft:50}}>{keys[i].split('_').slice(1)}</p>
                <Chart height={300} data={value} scale={cols} forceFit>
                  <Coord type='theta' radius={0.75} />
                  <Axis name="percent" />
                  <Legend />
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
                        percent = (percent * 100).toFixed(2) + '%';
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
          })}
        </div>
      }
      { chartType==="pieChart" && !groupByCol &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        <Chart height={450} width={700} data={dv} scale={cols} padding={[ 80, 100, 80, 80 ]}>
          <Coord type='theta' radius={0.75} />
          <Axis name="percent" />
          <Legend position='right' offsetY={-window.innerHeight / 2 +330} offsetX={-30} />
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
            tooltip={dv.rows[0] && colNameSelected &&
              [colNameSelected+'*percent',(colNameSelected, percent) => {
                percent = parseInt(percent * 100, 10) + '%';
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
                if (dv.rows[0]){ 
                  return item.point[colNameSelected] + ': ' + val;
                }
              }}
            />
          </Geom>
        </Chart>
        </div>
      }
      { chartType==="table" && tableData && !groupByCol &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
          <Table dataSource={tableData} columns={cols}/>
        </div>
      }
      { chartType==="table" && groupByCol &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataViews.map((value, i)=>{
          return(
            <div key={i} style={{margin:5, width:300}}>
              <p style={{paddingLeft:10}}>{keys[i].split('_').slice(1)}</p>
              <Table key={i} dataSource={value} columns={cols}/>
            </div>
          )
        })  
        }
        </div>
      }
      { type === "number" && chartType !== "boxPlot" &&
        <div style={{display: "flex", justifyContent: "left", marginBottom: 10, alignItems: "center"}}>
          <h4>Interval: </h4>
          <InputNumber min={1}
            style={{display: "flex", marginRight:15, marginLeft:5}}
            max={range[1]}
            value={interval}
            onChange={(value) => {
              if(value!=='' && value!==0){
                let num;
                if(this.isInt(range[1]/value)){
                  num = (range[1] - Math.floor(range[0]/value)*value)/value+1;
                }
                else{
                  num = (Math.ceil(range[1]/value)*value - Math.floor(range[0]/value)*value)/value;
                }
                this.setState({interval: value, numBins: num});
              }
            }}
          />
          <h4>Bin number: </h4>
          <InputNumber min={1}
            style={{display: "flex", marginRight:15, marginLeft:5}}
            max={range[1]}
            value={numBins}
            onChange={(value) => {
              if(value!=='' && this.isInt(value)){
                //TODO: rebust?
                let int = ((range[1] - range[0] + 1)/value).toFixed(2) ;
                this.setState({numBins: value, interval: int});
              }
            }}
          />
        </div>
      }
      { chartType==="boxPlot" && groupByCol && onSameChart &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
          <Chart height={450} width={900} data={dv} scale={cols} padding={[ 20, 120, 95 ]}>
            <Tooltip />
            <Legend />
            <Axis name='na' />
            <Axis name='_bin' />
            <Geom type="schema" position="na*_bin" shape='box' color={groupByCol} adjust='dodge'/>
          </Chart>
        </div>
      }
      { chartType==="boxPlot" && groupByCol && !onSameChart &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
            { dataViews.map((value, i)=>{
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
            })
          }
        </div>
      }
      { chartType==="boxPlot" && !groupByCol &&
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        <Chart height={450} width={700} data={dv} scale={cols} padding={[ 20, 120, 95 ]}>
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
        </div>
      }
      <div style={{display:"flex", justifyContent:"left", flexWrap: 'wrap', alignItems: "center"}}>
        <h4>Filter by: </h4>
        {type==='number' && minMax ?
          <div style={{display:"flex", justifyContent:"left", flexWrap: 'wrap', alignItems: "center"}}>
            <p style={{marginLeft:10, marginBottom:0}}>Min: {range[0]}</p>
            <Slider range 
              defaultValue={minMax} 
              value={range[1] && range[0] ? [range[0], range[1]] : minMax} 
              style={{display: "flex", width:"350px", marginRight:10}}
              min={minMax[0]} 
              max={minMax[1]}
              onChange={(value) => {this.setState({range: value});}}
              style={{width: 300, marginLeft:15}}
            />
            <p style={{marginLeft:5, marginBottom:0}}>Max: {range[1]}</p>
          </div>
          :
          <div>not number</div>
        }
      </div>
      </Modal>
    );
  };
};

const mapStateToProps = (state) => {
  const { 
    visualisation_visible, error, build, data, visualise, isRowWise, record, containerId
  } = state.view;
  
  return { 
    visualisation_visible, error, build, data, visualise, isRowWise, record, containerId
  };
};

export default connect(mapStateToProps)(VisualisationModal);
