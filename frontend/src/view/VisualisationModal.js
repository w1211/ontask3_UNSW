import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Select, Slider, InputNumber } from 'antd';
import { Chart, Geom, Axis, Legend, Coord, Tooltip, Label, Guide } from 'bizcharts';
import { View as dataView} from '@antv/data-set';

import * as ViewActionCreators from './ViewActions';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

const {Option} = Select;
const {Line, Text} = Guide;

class VisualisationModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.state = {
      chartType: "barChart",
      colNameSelected: null,
      interval: 5,
      rangeMin:0,
      rangeMax:100
    };
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  };

  isInt = (n) => {
    return n % 1 === 0;
  }

  handleCancel = () => { 
    this.boundActionCreators.closeVisualisationModal(); 
    this.setState({ chartType:"barChart", colNameSelected:null, rangeMin:null, rangeMax:null, interval: 5 }); 
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

  render() {
    const { visualisation_visible, build, data, visualise, isRowWise, record } = this.props;
    const { chartType, interval } = this.state;
    let { rangeMin, rangeMax, numBins } = this.state;

    let dv;
    let cols;
    let type;
    let colNameSelected;


    if (build && data && (this.state.colNameSelected || visualise)) {

      let buildStepIndex = this.state.colNameSelected ? this.state.colNameSelected.stepIndex : visualise.stepIndex;
      let fieldName = this.state.colNameSelected ? this.state.colNameSelected.field : visualise.field;
      
      const buildStep = build.steps[buildStepIndex];


      if (buildStep.type === 'datasource') {
        type = buildStep.datasource.types[fieldName];
        colNameSelected = buildStep.datasource.labels[fieldName];
      };

      dv = new dataView()
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
      rangeMin = Number(dv.rows[0].minValue);
      rangeMax = Number(dv.rows[0].maxValue);

      //TODO: round up should add 1 some time
      //call when numbins not defined
      if(!numBins){
        if(this.isInt(rangeMax/interval)){
          numBins = (rangeMax - Math.floor(rangeMin/interval)*interval)/interval+1;
        }
        else{
          numBins = (Math.ceil(rangeMax/interval)*interval - Math.floor(rangeMin/interval)*interval)/interval;
        }
      }
      
      //Barchar ploting
      if (chartType === "barChart" || chartType === "pieChart"){
        dv = new dataView()
        .source(data)
        .transform({type: 'pick', fields: [colNameSelected]})
        .transform({
          type: 'filter',
          callback(row) {
            return row[colNameSelected] !=='' ;
          }
        });
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

        if(chartType === "barChart"){
          cols = {
            colNameSelected: {tickInterval: 5},
          };
        }

        if(chartType === "pieChart"){
          cols = {
            percent: {
              formatter: val => {
                val = parseFloat(val * 100).toFixed(2) + '%';
                return val;
          }}};
          dv.transform({
            type: 'percent', field: 'count',
            dimension: colNameSelected, as: 'percent'
          })
          if(type === "number")
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
      }

      if(chartType==="boxPlot"){
        dv = new dataView()
        .source(data)
        .transform({type: 'pick', fields: [colNameSelected]})
        .transform({
          type: 'filter',
          callback(row) {
              return row[colNameSelected]!=="";
        }})
        .transform({
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

        cols ={
          range: {
            max: dv.rows[0].high
        }}
      }
    }

    let options = [];
    if (isRowWise) {
      build && build.steps.forEach((step, stepIndex) => {
        if (step.type === 'datasource') {
          step = step.datasource;
          step.fields.forEach(field => {
            if (step.matching !== field && step.primary !== field) {
              const label = step.labels[field];
              options.push({ stepIndex, field, label });
            };
          });
        };
      });
    };

    return (
      <Modal
        width={700}
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
          style={{ width: 150, marginLeft:15, display:"flex"}}
          value={chartType}
          onChange={(value)=>{this.setState({chartType: value})}}
        >
          <Option value="barChart">Barchart</Option>
          <Option value="pieChart">Piechart</Option>
          { type === "number" && <Option value="boxPlot">Boxplot</Option> }
        </Select>

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
              <Option value={`${option.stepIndex}_${option.field}`} key={i}>{option.label}</Option>
            )
          })}
        </Select>
        </div>
      }
      </div>

      { chartType === "barChart" && dv &&
        <div>
          <Chart height={450} data={dv} scale={cols} forceFit>
            <Axis 
              name={colNameSelected}
              title={colNameSelected} 
              autoRotate={true}
            />
            <Axis title={"Count"} name= {"count"} />
            <Tooltip crosshairs={{type : "y"}} />
            <Geom type="interval" position={dv.rows[0] && colNameSelected+"*count"} />
            {record &&
              <Guide>
                <Line
                  top={true}
                  start={[record[colNameSelected], 0]}
                  end={[record[colNameSelected], 'max']}
                  lineStyle= {{
                    lineDash:[2,0],
                    lineWidth: 1
                  }}
                />
                <Text
                  top= {true}
                  position= {[record[colNameSelected],'max']} 
                  content= {"You are here"}
                  style= {{
                    fill: '#666',
                    fontSize: '12'
                  }}
                  offsetX= {5}
                  offsetY= {0.5}
                />
              </Guide>
            }
          </Chart>
        </div>
      }

      { chartType==="pieChart" && dv &&
        <div>
          <Chart height={450} data={dv} scale={cols} padding={[ 80, 100, 80, 80 ]} forceFit>
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

      { type === "number" && chartType !== "boxPlot" &&
        <div>
          <div style={{display: "flex", justifyContent: "left", marginBottom: 10, alignItems: "center"}}>
            <h4>Interval: </h4>
            <InputNumber min={1}
              style={{display: "flex", marginRight:15, marginLeft:5}}
              max={rangeMax}
              value={this.state.interval}
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

          <div style={{display: "flex", justifyContent: "left", alignItems: "center"}}>
            <h4 style={{verticalAlign:"middle"}}>Min: </h4>
            <InputNumber min={rangeMin}
              max={rangeMax}
              style={{display: "flex", marginRight:10, marginLeft:5}}
              value={rangeMin}
              onChange={(value) => this.onRangeMinChange(value, rangeMin, rangeMax)}
            />

            <h4>Max: </h4>
            <InputNumber
              min={rangeMin}
              max={rangeMax}
              style={{display: "flex", marginLeft:5, marginRight:15}}
              value={rangeMax}
              onChange={(value) => this.onRangeMaxChange(value, rangeMin, rangeMax)}
            />
            <Slider range
              defaultValue={[rangeMin, rangeMax]}
              value={[rangeMin, rangeMax]}
              style={{display: "flex", width:"350px", marginRight:10}}
              min={rangeMin}
              max={rangeMax}
              onChange={(value) => {this.setState({rangeMin: value[0], rangeMax: value[1]});}}
            />
          </div>
        </div>
      }

      { chartType==="boxPlot" &&
        <div>
          <Chart height={450} data={dv} scale={cols} padding={[ 20, 120, 95 ]} forceFit>
            <Axis name='na' />
            <Axis name='range' />
            <Tooltip showTitle={false} crosshairs={{type:'rect',style: {fill: '#E4E8F1',fillOpacity: 0.43}}}     
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
      </Modal>
    );
  };
};

const mapStateToProps = (state) => {
  const { 
    visualisation_visible, error, build, data, visualise, isRowWise, record
  } = state.view;
  
  return { 
    visualisation_visible, error, build, data, visualise, isRowWise, record
  };
};

export default connect(mapStateToProps)(VisualisationModal);
