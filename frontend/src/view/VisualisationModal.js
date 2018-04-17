import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Select } from 'antd';
import { Chart, Geom, Axis, Legend, Coord, Tooltip, Label } from 'bizcharts';
import { View as dataView} from '@antv/data-set';

import * as ViewActionCreators from './ViewActions';

const {Option} = Select;

class VisualisationModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.state = {
      chartType: "barChart"
    };
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  };


  render() {
    const { dispatch, visualisation_visible, error, view, colName} = this.props;
    const { chartType } = this.state;

    let dv;
    let cols;

    if(view && colName){
      cols = {
        "Computer_programming": {tickInterval: 5},
      };

      dv = new dataView()
        .source(view.data)
        .transform({type: 'pick', fields: [colName]})
        .transform({type: 'aggregate', fields: [colName], 
                    operations: 'count', as: 'count',
                    groupBy: [colName]})
        .transform({type: 'sort-by', fields: [colName]});

      if(chartType==="pieChart"){
        cols = {
          percent: {
            formatter: val => {
              val = parseInt(val * 100, 10) + '%';
              return val;
            }
          }
        };
        dv = dv
        .transform({type: 'percent', field: 'count',
                    dimension: colName, as: 'percent'})
      }
    }

    return (
      <Modal
        width={700}
        visible={visualisation_visible}
        title={'Visualisation'}
        onCancel={() => { this.boundActionCreators.closeVisualisationModal(); 
                          this.setState({chartType:"barChart"}); }}
      >
        <Select
          style={{ width: 150, marginBottom:10}}
          placeholder="Barchart"
          value={chartType}
          onChange={(value)=>{this.setState({chartType: value})}}
        >
          <Option value="barChart">Barchart</Option>
          <Option value="pieChart">Piechart</Option>
        </Select>
      { chartType === "barChart" &&
        <div>
          <Chart height={450} data={dv} scale={cols} forceFit>
            <Axis name={colName} />
            <Axis name="count" />
            <Tooltip crosshairs={{type : "y"}}/>
            <Geom type="interval" position={colName+"*count"} />
          </Chart>
        </div>
      }
      { chartType==="pieChart" &&
        <div>
          <Chart height={450} data={dv} scale={cols} padding={[ 80, 100, 80, 80 ]} forceFit>
            <Coord type='theta' radius={0.75} />
            <Axis name="percent" />
            <Legend position='right' offsetY={-window.innerHeight / 2 +330} offsetX={-30} />
            <Tooltip 
              showTitle={false} 
              itemTpl='<li><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</li>'
              />
            <Geom
              type="intervalStack"
              position="percent"
              color={colName}
              tooltip={[colName+'*percent',(colName, percent) => {
                percent = parseInt(percent * 100, 10) + '%';
                return {
                  name: colName,
                  value: percent
                };
              }]}
              style={{lineWidth: 1,stroke: '#fff'}}
              >
              <Label content='percent' formatter={(val, item) => {
                  return item.point[colName] + ': ' + val;}} />
            </Geom>
          </Chart>
        </div>
      }
      </Modal>
    );
  };
};

const mapStateToProps = (state) => {
  const { 
    visualisation_visible, error, view, colName
  } = state.view;
  
  return { 
    visualisation_visible, error, view, colName
  };
};

export default connect(mapStateToProps)(VisualisationModal);
