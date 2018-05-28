import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Table, Icon } from 'antd';

import * as ViewActionCreators from '../ViewActions';

import VisualisationModal from '../VisualisationModal';
import datasourceColumns from '../data-manipulation/DatasourceColumns';
import formColumns from '../data-manipulation/FormColumns';


class Data extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    this.state = {
      sort: null,
      editable: { }
    };
  };

  handleChange = (pagination, filters, sorter) => {
    this.setState({
      filter: filters,
      sort: sorter
    });
  };

  onEdit = (e) => {
    this.setState({ editable: e });
  };

  confirmEdit = () => {
    const { selectedId } = this.props;
    const { editable } = this.state;
    
    this.boundActionCreators.updateFormValues(
      selectedId, 
      editable,
      () => this.setState({ editable: { } })
    );
  };

  render() {
    const { build, data } = this.props;
    const { sort, editable } = this.state;

    let columns = [];
    let orderedColumns = [];
    let tableData = data && data.map((data, i) => ({...data, key: i }));
    
    if (build && data) {
      const openVisualisation = this.boundActionCreators.openVisualisationModal;

      // Initialise the columns of the table
      build.steps.forEach((step, stepIndex) => {
        if (step.type === 'datasource') columns.push(...datasourceColumns(step, stepIndex, sort, openVisualisation));
        if (step.type === 'form') columns.push(...formColumns(step, stepIndex, sort, editable, this.onEdit, this.confirmEdit, openVisualisation));
      });

      // Order the columns
      build.order.forEach(field => {
        const column = columns.find(column => column.stepIndex === field.stepIndex && column.field === field.field);
        if (column) orderedColumns.push(column);
      });

      // First non-primary field in the first module, assuming its a datasource
      const defaultField = build.steps[0].datasource.fields.filter(field => field !== build.steps[0].datasource.primary)[0];
      // Only show the row-wise visualisations column if we have at least one non-primary field in the dataset
      if (defaultField) {
        const defaultVisualisation = {
          stepIndex: 0,
          field: defaultField,
          label: build.steps[0].datasource.labels[defaultField]
        };
  
        orderedColumns.unshift({
          title: 'Action', fixed: 'left', dataIndex: 0, key: 0,
          render: () => (
            <a>
              <Icon type="area-chart" onClick={() => this.boundActionCreators.openVisualisationModal(defaultVisualisation, true)}/>
            </a>
          )
        });
      };
    };

    return (
      <div className="dataManipulation">            
        <VisualisationModal/>
        
        <Table
          columns={orderedColumns}
          dataSource={tableData}
          scroll={{ x: (columns.length - 1) * 175 }}
          onChange={this.handleChange} 
          pagination={{ showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'] }}
        />
      </div>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    loading, error, build, data, selectedId
  } = state.view;
  
  return {
    loading, error, build, data, selectedId
  };
};

export default connect(mapStateToProps)(Data);
