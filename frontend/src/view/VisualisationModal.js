import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Select, Slider, InputNumber, TreeSelect, Checkbox } from 'antd';
import { Chart, Geom, Axis, Legend, Coord, Tooltip, Label, Guide } from 'bizcharts';
import { View as dataView} from '@antv/data-set';

import * as ViewActionCreators from './ViewActions';

import FilterModal from './FilterModal'
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
      chartType: "barChart", colNameSelected: null,
      interval: 5, rangeMin:0,
      rangeMax:100, groupByCol: null,
      numBins:null, visibleField: null,
      onSameChart: false
    };
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  };

  isInt = (n) => {
    return n % 1 === 0;
  }

  handleCancel = () => { 
    this.boundActionCreators.closeVisualisationModal(); 
    this.setState({ chartType:"barChart", colNameSelected:null, 
                    rangeMin:0, rangeMax:100, 
                    interval:5, groupByCol: null,
                    numBins: null, visibleField: null,
                    onSameChart: false, selections: null
                  }); 
  };

  handleSubmit = () => {
    const { selectedId } = this.props;
    const { chartType, numBins, rangeMin, rangeMax } = this.state;
    this.boundActionCreators.updateVisualisationChart(selectedId, chartType, numBins, rangeMin, rangeMax);
  };

  onRangeMaxChange = (value, defaultMin, defaultMax) => {
    const {rangeMin, rangeMax} = this.state;
    if(rangeMin){
      if(value>=rangeMin && value<=defaultMax){
        this.setState({rangeMax: value});
      }
    }
    else{
      if(value>=defaultMin && value<=defaultMax){
        this.setState({rangeMax: value});
      }
    }
  }

  onRangeMinChange = (value, defaultMin, defaultMax) => {
    const {rangeMin, rangeMax} = this.state;
    if(rangeMax){
      if(value<=rangeMax && value>=defaultMin){
        this.setState({rangeMin: value});
      }
    }
    else{
      if(value<=defaultMax && value>=defaultMin){
        this.setState({rangeMin: value});
      }
    }
  }

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

  generatePieChart = (dv,type, colNameSelected) => {
    dv.transform({
      type: 'percent', field: 'count',
      dimension: colNameSelected, as: 'percent'
    })
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

  generateStackedHistogram = (data, type, interval, colNameSelected, groupByCol) => {
    let dv = new dataView().source(data)
    .transform({
      type: 'filter',
      callback(row) {
        if(row[groupByCol] !==''){
          return row;
        }
      }
    });
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
    return dv;
  }

  generateGroupedBoxPlot = (data, colNameSelected, groupByCol) => {
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
    const { chartType, interval, groupByCol, visibleField, onSameChart } = this.state;
    let { rangeMin, rangeMax, numBins } = this.state;

    let dv;
    let cols;
    let type;
    let keys;
    let colNameSelected;
    let dataViews = [];

    if (build && data && (this.state.colNameSelected || visualise)) {

      let buildStepIndex = this.state.colNameSelected ? this.state.colNameSelected.stepIndex : visualise.stepIndex;
      let fieldName = this.state.colNameSelected ? this.state.colNameSelected.field : visualise.field;
      
      const buildStep = build.steps[buildStepIndex];

      if (buildStep.type === 'datasource') {
        type = buildStep.datasource.types[fieldName];
        colNameSelected = buildStep.datasource.labels[fieldName];
      };

      let minMax = this.getMinMaxValue(data, colNameSelected);

      rangeMin = minMax[0];
      rangeMax = minMax[1];

      //calculate num of bins
      if(!numBins){
        if(this.isInt(rangeMax/interval)){
          numBins = (rangeMax - Math.floor(rangeMin/interval)*interval)/interval+1;
        }
        else{
          numBins = (Math.ceil(rangeMax/interval)*interval - Math.floor(rangeMin/interval)*interval)/interval;
        }
      }
      
      if(groupByCol && onSameChart===true && chartType==="barChart"){
        dv = this.generateStackedHistogram(data, type, interval, colNameSelected, groupByCol);
      }

      if(groupByCol && onSameChart===true && chartType==="boxPlot"){
        cols={
          _bin: {
            max: rangeMax,
            min: rangeMin
        }};

        dv = this.generateGroupedBoxPlot(data, colNameSelected, groupByCol);
      }

      if(groupByCol && onSameChart==false){

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
          });
          
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
          if(chartType === "pieChart"){
            this.generatePieChart(tmpdv, type, colNameSelected);
          }
          if(chartType==="boxPlot"){
            this.generateBoxPlot(tmpdv, colNameSelected);
          }
          dataViews.push(tmpdv);
        }

        if(chartType==="barChart"){
          cols = {
            [colNameSelected]: {
              tickInterval: interval,
              max: rangeMax,
              min: rangeMin
            },
            count:{
              max: maxCount,
              min: 0
            }
          };
        }
        if(chartType==="pieChart"){
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
              max: rangeMax,
              min: rangeMin
          }};
        }
      }

      if(!groupByCol){
        dv = new dataView()
          .source(data)
          .transform({
            type: 'filter',
            callback(row) {
              return row[colNameSelected] !=='' ;
            }
        });

        if (chartType!=="boxPlot"){
          this.generateCountField(dv, type, interval, colNameSelected);

          if(chartType === "pieChart"){
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
      <div>
      <FilterModal/>
      <Modal
        width={1000}
        visible={visualisation_visible}
        title={'Visualisation'}
        onCancel={this.handleCancel}
        onOk={this.handleSubmit}
        okText="Save"
        cancelText="Close"
      >
      <div style={{display:"flex", justifyContent:"left", alignItems: "center", marginBottom: 20}}>
        <h4>Chart type: </h4>
        <Select
          style={{width: 150, marginLeft:15, display:"flex"}}
          value={chartType}
          onChange={(value)=>{this.setState({chartType: value})}}
        >
          <Option value="barChart">Barchart</Option>
          <Option value="pieChart">Piechart</Option>
          { type === "number" && <Option value="boxPlot">Boxplot</Option> }
        </Select>

      { !isRowWise && options &&
          <div style={{display:"flex", justifyContent:"left", alignItems: "center"}}>
          <h4>Plot by: </h4>
          <TreeSelect
            style={{ width: 250, marginLeft:10}}
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
          { chartType === "barChart" &&
            <Checkbox checked={onSameChart} style={{ width: 200, marginLeft:10}} onChange={()=>{this.setState({onSameChart:!onSameChart})}}>On same chart</Checkbox>
          }
        </div>
      }

      { isRowWise &&
        <div style={{display:"flex", justifyContent:"left", alignItems: "center"}}>
          <h4>Columns: </h4>
          <Select
            style={{ width: 150, marginLeft:10, display:"flex"}}
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

      { chartType === "barChart" && dv &&
        <div>
          { groupByCol ?
              onSameChart?
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
                  :        
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
                          <Tooltip crosshairs={{type : "y"}} />
                          <Geom type='interval' position={colNameSelected+"*count"} />
                        </Chart>
                        </div>
                      );
                    }
                  })
                  }
                </div>    
          :
            <div style={{display: 'flex', textAlign: 'center', flexDirection: 'column', justifyContent:'center'}}>
              <Chart height={450} width={600} data={dv} scale={cols}
                onGetG2Instance={(chart) => {
                  this.chart = chart;
                }}
                onPlotDblClick={(ev) => {
                  let point = {
                    x: ev.x,
                    y: ev.y
                  };
                  let items = this.chart.getTooltipItems(point);
                  this.boundActionCreators.openFilterModal(items[0].title, colNameSelected, containerId);
                }}
              >
                <Axis 
                  name={colNameSelected}
                  title={colNameSelected}
                  autoRotate={true}
                />
                <Axis title={"Count"} name= {"count"} />
                <Tooltip/>
                <Geom type="interval" position={dv.rows[0] && colNameSelected+"*count"} />
                {record &&
                  <Guide>
                    <Line top={true} start={[record[colNameSelected], 0]}
                          end={[record[colNameSelected], 'max']}
                          lineStyle= {{
                            lineDash:[2,0],
                            lineWidth: 1
                          }}
                    />
                    <Text
                      top= {true} position= {[record[colNameSelected],'max']} 
                      content= {"You are here"}
                      style= {{fill: '#666', fontSize: '12'}}
                      offsetX= {5} offsetY= {0.5}
                    />
                  </Guide>
                }
              </Chart>
            </div>
          }
        </div>
      }

      { chartType==="pieChart" && dv &&
        <div>
          { groupByCol ?
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
          :
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
        </div>
      }

      { type === "number" && chartType !== "boxPlot" &&
        <div>
          <div style={{display: "flex", justifyContent: "left", marginBottom: 10, alignItems: "center"}}>
            <h4>Interval: </h4>
            <InputNumber min={1}
              style={{display: "flex", marginRight:15, marginLeft:5}}
              max={rangeMax}
              value={interval}
              onChange={(value) => {
                if(value!=='' && value!==0){
                  let num;
                  if(this.isInt(rangeMax/value)){
                    num = (rangeMax - Math.floor(rangeMin/value)*value)/value+1;
                  }
                  else{
                    num = (Math.ceil(rangeMax/value)*value - Math.floor(rangeMin/value)*value)/value;
                  }
                  this.setState({interval: value, numBins: num});
                }
              }}
            />
            <h4>Bin number: </h4>
            <InputNumber min={1}
              style={{display: "flex", marginRight:15, marginLeft:5}}
              max={rangeMax}
              value={numBins}
              onChange={(value) => {
                if(value!=='' && this.isInt(value)){
                  //TODO: rebust?
                  let int = ((rangeMax - rangeMin + 1)/value).toFixed(2) ;
                  this.setState({numBins: value, interval: int});
                }
              }}
            />
          </div>
        </div>
      }

      { chartType==="boxPlot" &&
        <div>
        { groupByCol ?
            <div>
              { onSameChart ? 
              <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
                <Chart height={450} width={900} data={dv} scale={cols} padding={[ 20, 120, 95 ]}>
                  <Tooltip crosshairs={{type:'rect'}} />
                  <Legend />
                  <Axis name='na' />
                  <Axis name='_bin' />
                  <Geom type="schema" position="na*_bin" shape='box' color={groupByCol} adjust='dodge'/>
                </Chart>
              </div>
              :
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
          </div>
          :
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
      </div>
      }
      </Modal>
      </div>
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
