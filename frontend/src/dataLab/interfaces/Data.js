import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Table, Icon } from "antd";

import * as DataLabActionCreators from "../DataLabActions";

import VisualisationModal from "../visualisation/VisualisationModal";
import { DatasourceColumns, FormColumns } from "../data-manipulation";

class Data extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );

    this.state = {
      sort: {},
      editable: {}
    };
  }

  initialiseData = () => {
    const { data } = this.props;

    if (!data) return [];

    // Add unique keys to each of the data records, to be consumed by the data table
    const tableData = data.map((data, i) => ({ ...data, key: i }));

    return tableData;
  };

  initialiseColumns = () => {
    const { build } = this.props;
    const { sort, editable } = this.state;

    if (!build) return [];

    // Initialise the columns of the data table
    const columns = [];
    build.steps.forEach((step, stepIndex) => {
      if (step.type === "datasource")
        columns.push(
          ...DatasourceColumns({
            step: step["datasource"],
            stepIndex,
            sort,
            openVisualisation: this.boundActionCreators.openVisualisationModal
          })
        );

      if (step.type === "form")
        columns.push(
          ...FormColumns({
            step: step["form"],
            stepIndex,
            sort,
            editable,
            onEdit: this.onEdit,
            confirmEdit: this.confirmEdit,
            openVisualisation: this.boundActionCreators.openVisualisationModal
          })
        );
    });

    // Order the columns
    const orderedColumns = [];
    build.order.forEach(orderItem => {
      const column = columns.find(
        column =>
          column.stepIndex === orderItem.stepIndex &&
          column.field === orderItem.field
      );
      if (column && orderItem.visible) orderedColumns.push(column);
    });

    // Identify the first non-primary field
    const firstNonPrimaryField = orderedColumns.find(column => {
      const step = build.steps[column.stepIndex];
      return column.field !== step[step.type].primary;
    });

    // Only show the row-wise visualisations column if we have at
    // least one non-primary field in the dataset
    if (firstNonPrimaryField) {
      const defaultVisualisation = {
        stepIndex: firstNonPrimaryField.stepIndex,
        field: firstNonPrimaryField.field
      };

      orderedColumns.unshift({
        title: "Action",
        fixed: "left",
        dataIndex: 0,
        key: 0,
        render: (index, value) => (
          <a>
            <Icon
              type="area-chart"
              onClick={() =>
                this.boundActionCreators.openVisualisationModal(
                  defaultVisualisation,
                  true,
                  value
                )
              }
            />
          </a>
        )
      });
    }

    return orderedColumns;
  };

  handleChange = (pagination, filter, sort) => {
    this.setState({ filter, sort });
  };

  onEdit = e => {
    this.setState({ editable: e });
  };

  confirmEdit = () => {
    const { selectedId } = this.props;
    const { editable } = this.state;

    this.boundActionCreators.updateFormValues(selectedId, editable, () =>
      this.setState({ editable: {} })
    );
  };

  render() {
    const { visualisation } = this.state;

    // Columns are initialised on every render, so that changes to the sort
    // in local state can be reflected in the table columns. Otherwise the
    // columns would ideally only be initialised when receiving the build
    // for the first time
    const orderedColumns = this.initialiseColumns();

    // Similarly, the table data is initialised on every render, so that
    // changes to values in form columns can be reflected
    const tableData = this.initialiseData();

    return (
      <div className="dataManipulation">
        <VisualisationModal
          {...visualisation}
          closeModal={() =>
            this.setState({ visualisation: { visible: false } })
          }
        />

        <Table
          columns={orderedColumns}
          dataSource={orderedColumns.length > 0 ? tableData : []}
          scroll={{ x: (orderedColumns.length - 1) * 175 }}
          onChange={this.handleChange}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ["10", "25", "50", "100"]
          }}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { build, data, selectedId, formFieldLoading } = state.dataLab;

  return {
    build,
    data,
    selectedId,
    formFieldLoading
  };
};

export default connect(mapStateToProps)(Data);
