import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Table, Icon, Checkbox } from 'antd';

import * as ViewActionCreators from '../ViewActions';

import components from '../draggable/Column';


class Details extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);
  };

  moveRow = (dragIndex, hoverIndex) => {
    const { selectedId } = this.props;

    this.boundActionCreators.changeColumnOrder(selectedId, { dragIndex, hoverIndex });
  };

  render() {
    const { build, datasources } = this.props;

    let columns = [];
    let tableData = [];
    let orderedTableData = [];
    
    if (build) {
      columns = [
        { title: 'Field', dataIndex: 'label', key: 'label' },
        { title: 'From', dataIndex: 'from', key: 'from', render: (text, record) => {
          if (record.module === 'datasource') return <div className="from"><Icon type="database" className="datasourceIcon"/>{record.from}</div>;
          if (record.module === 'form') return <div className="from"><Icon type="form" className="formIcon"/>{record.from}</div>;;
        }},
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { title: 'Visible', dataIndex: 'visible', key: 'visible', render: (text, record) => (
          <Checkbox defaultChecked={true}/>
        )}
      ];

      build.steps.forEach((step, stepIndex) => {
        if (step.type === 'datasource') {
          const module = step.type;
          step = step.datasource;

          const datasource = datasources.find(datasource => datasource.id === step.id);
          
          step.fields.forEach((field, fieldIndex) => {
            const label = step.labels[field];
            const type = step.types[field];
            tableData.push({
              stepIndex,
              field,
              key: label,
              label,
              module,
              from: datasource.name, 
              type
            });
          });

        } else if (step.type === 'form') {
          const module = step.type;
          step = step.form;
          
          step.fields.forEach((field, fieldIndex) => {
            tableData.push({
              stepIndex,
              field,
              key: field.name,
              label: field.name,
              module,
              from: step.name, 
              type: field.type
            });
          });
        };
      });

      // Order the columns
      build.order.forEach(field => {
        const column = tableData.find(column => column.stepIndex === field.stepIndex && column.field === field.field);
        if (column) orderedTableData.push(column);
      });

    };

    return (
      <div className="details">            
        
        <Table
          columns={columns}
          dataSource={orderedTableData}
          pagination={false}
          components={components}
          onRow={(record, index) => ({
            index,
            moveRow: this.moveRow,
          })}
        />
      </div>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    loading, error, build, datasources, selectedId
  } = state.view;
  
  return {
    loading, error, build, datasources, selectedId
  };
};

export default connect(mapStateToProps)(Details);
