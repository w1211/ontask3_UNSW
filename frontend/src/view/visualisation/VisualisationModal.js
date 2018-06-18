import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Select, Slider, InputNumber, TreeSelect, Checkbox } from 'antd';
import { View as dataView} from '@antv/data-set';
import { BarChart, BoxPlot, PieChart, StackedBarChart, GroupedBarCharts, GroupedBoxPlots, StackedBoxPlot,
         GroupedPieCharts, TableChart, GroupedTables } from '../../charts/charts';

import * as ViewActionCreators from '../ViewActions';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

const {Option} = Select;
const {TreeNode} = TreeSelect;

class VisualisationModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.state = {
      chartType:"barChart", colNameSelected:null,
      interval:5, range:null, 
      groupByCol:null, numBins:null, 
      visibleField:null, onSameChart:false, 
      percentageAxis:false, selections:null,
      filterCols:[]
    };
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  };

  isInt = (n) => {
    return n % 1 === 0;
  }

  handleCancel = () => { 
    this.boundActionCreators.closeVisualisationModal(); 
  };

  handleSubmit = () => {
    const { selectedId } = this.props;
    const { chartType, numBins, range} = this.state;
    this.boundActionCreators.updateVisualisationChart(selectedId, chartType, numBins, range[0], range[1]);
  };

  getMaxCount = (dv) => {
    dv.transform({
      type: 'sort',
      callback(a, b) {
        return a.count - b.count;
      }
    });
    return dv.rows[dv.rows.length-1].count;
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

  render() {
    const { visualisation_visible, build, data, visualise, isRowWise } = this.props;
    const { chartType, interval, groupByCol, onSameChart, percentageAxis, visibleField } = this.state;
    let { range, numBins, filterCols } = this.state;

    let type;
    let colNameSelected;
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
        let min = Math.floor(range[0]/interval)*interval;
        numBins = (Math.ceil((this.isInt(range[1]/interval)?range[1]/interval+1:range[1]/interval))*interval-min)/interval;
      }
    }

    let options = [];
    let childrenOptions = [];

    build && build.steps.forEach((step, stepIndex) => {
      if (step.type === 'datasource') {
        let index=0;
        step = step.datasource;
        step.fields.forEach(field => {
          if (step.matching !== field && step.primary !== field) {
            const label = step.labels[field];
            let sublist = this.generateSubOptionList(field, data);
            options.push({ type: step.types[field], label: field, value: 'group-'+field, children: sublist, key: ''+field+'-'+index});
            if(label===colNameSelected){
              childrenOptions=sublist;
            }
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
          onChange={(value) => {this.setState({chartType: value})}}
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
      { !isRowWise && chartType === "barChart" &&
        <Checkbox checked={percentageAxis} style={{ marginLeft:15}} onChange={(value)=>{this.setState({percentageAxis:value.target.checked})}}>Show percentage</Checkbox>
      }
      { !isRowWise && chartType !== "pieChart" && chartType !== "table" && groupByCol &&
        <Checkbox checked={onSameChart} style={{marginLeft:15}} onChange={(value)=>{this.setState({onSameChart:value.target.checked})}}>On same chart</Checkbox>
      }
      { isRowWise &&
        <div style={{display:"flex", justifyContent:"left", alignItems: "center"}}>
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
      { data && chartType === "barChart" && !groupByCol && !onSameChart &&
        <BarChart
          show={visualisation_visible} data={data} type={type} percentageYAxis={percentageAxis} interval={interval} range={range} numBins={numBins}
          colNameSelected={colNameSelected} filterCols={filterCols}
        />
      }
      {chartType==="barChart" && groupByCol && onSameChart &&
        <StackedBarChart 
          show={visualisation_visible} data={data} type={type} percentageYAxis={percentageAxis} interval={interval} range={range}
          colNameSelected={colNameSelected} groupByCol={groupByCol} filterCols={filterCols} childrenOptions={childrenOptions}
        />
      }
      {chartType === "barChart" && groupByCol && !onSameChart &&
        <GroupedBarCharts
          show={visualisation_visible} data={data} type={type} percentageYAxis={percentageAxis} interval={interval} range={range}
          colNameSelected={colNameSelected} groupByCol={groupByCol} filterCols={filterCols} numBins={numBins} visibleField={visibleField}
        />
      }
      { chartType==="pieChart" && !groupByCol &&
        <PieChart show={visualisation_visible} data={data} type={type} 
                  interval={interval} range={range} colNameSelected={colNameSelected} filterCols={filterCols}
        /> 
      }
      { chartType==="pieChart" && groupByCol &&
        <GroupedPieCharts
          show={visualisation_visible} data={data} type={type} interval={interval} range={range}
          colNameSelected={colNameSelected} groupByCol={groupByCol} filterCols={filterCols}
        /> 
      }
      { data && chartType === "boxPlot" && !groupByCol && !onSameChart &&
        <BoxPlot show={visualisation_visible} data={data} type={type} range={range} colNameSelected={colNameSelected} filterCols={filterCols}/>
      }
      { data && chartType === "boxPlot" && groupByCol && onSameChart &&
        <StackedBoxPlot 
          show={visualisation_visible} data={data} type={type} interval={interval} range={range}
          colNameSelected={colNameSelected} groupByCol={groupByCol}
        />
      }
      { data && chartType === "boxPlot" && groupByCol && !onSameChart &&
        <GroupedBoxPlots 
          show={visualisation_visible} data={data} type={type} interval={interval} range={range}
          colNameSelected={colNameSelected} groupByCol={groupByCol} filterCols={filterCols}
        />
      }
      { chartType==="table" && !groupByCol &&
        <TableChart show={visualisation_visible} data={data} type={type} 
                    interval={interval} range={range} colNameSelected={colNameSelected} filterCols={filterCols}
        /> 
      }
      { chartType==="table" && groupByCol &&
        <GroupedTables show={visualisation_visible} numBins={numBins} data={data} type={type} 
                       interval={interval} range={range} groupByCol={groupByCol} colNameSelected={colNameSelected} filterCols={filterCols}
        /> 
      }
      <div style={{display:"flex", justifyContent:"left", flexWrap: 'wrap', alignItems: "center"}}>
        <h4>Filter by: </h4>
        { type==='number' && minMax &&
          <div style={{display:"flex", justifyContent:"left", flexWrap: 'wrap', alignItems: "center"}}>
            <p style={{marginLeft:10, marginBottom:0}}>Min: {range[0]}</p>
            <Slider range 
              defaultValue={minMax} 
              value={range[1] || range[0] ? [range[0], range[1]] : minMax} 
              style={{display: "flex", width:"350px", marginRight:10, marginLeft:15}}
              min={minMax[0]} 
              max={minMax[1]}
              onChange={(value) => {this.setState({range: value});}}
            />
            <p style={{marginLeft:5, marginBottom:0}}>Max: {range[1]}</p>
          </div>
        }
        { type!=="number" && childrenOptions &&
          <div style={{marginLeft:10}}>
            <Select
              mode="multiple"
              style={{ width: 300 }}
              placeholder="Please select"
              allowClear={true}
              value={filterCols}
              onChange={(value)=>{this.setState({filterCols:value})}}
            >
              { childrenOptions.map((child, i) => {
                  return(
                    <Option key={i+child.key} value={child.label}>{child.label}</Option>
                  )
                })
              }
            </Select>
          </div>
        }
      </div>
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
                let int = ((range[1] - range[0] + 1)/value).toFixed(1) ;
                this.setState({numBins: value, interval: int});
              }
            }}
          />
        </div>
      }
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
