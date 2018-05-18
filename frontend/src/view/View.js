import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Table, Spin, Layout, Breadcrumb, Icon, Radio } from 'antd';

import * as ViewActionCreators from './ViewActions';

import VisualisationModal from './VisualisationModal';
import datasourceColumns from './data-manipulation/DatasourceColumns';
import formColumns from './data-manipulation/FormColumns';

const { Content } = Layout;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;


class View extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    this.state = {
      sort: null,
      editable: { }
    };
  };

  componentDidMount() {
    const { match } = this.props;
    this.boundActionCreators.retrieveDataLab(match.params.id);
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
    const { match } = this.props;
    const { editable } = this.state;
    
    this.boundActionCreators.updateFormValues(
      match.params.id, 
      editable,
      () => this.setState({ editable: { } })
    );
  };

  render() {
    const { history, loading, build, data, match } = this.props;
    const { sort, editable } = this.state;

    let columns = [];
    let tableData = data && data.map((data, i) => ({...data, key: i }));
    
    if (build) {
      // First non-primary field in the first module, assuming its a datasource
      const defaultField = build.steps[0].datasource.fields.filter(field => field !== build.steps[0].datasource.primary)[0];
      // Only show the row-wise visualisations column if we have at least one non-primary field in the dataset
      if (defaultField) {
        const defaultVisualisation = {
          stepIndex: 0,
          field: defaultField,
          label: build.steps[0].datasource.labels[defaultField]
        };
  
        columns = [{
          title: 'Action', fixed: 'left', dataIndex: 0, key: 0,
          render: () => (
            <a>
              <Icon type="area-chart" onClick={() => this.boundActionCreators.openVisualisationModal(defaultVisualisation, true)}/>
            </a>
          )
        }];
      };

      const openVisualisation = this.boundActionCreators.openVisualisationModal;

      // Initialise the columns of the table
      build.steps.forEach((step, stepIndex) => {
        if (step.type === 'datasource') columns.push(...datasourceColumns(step, stepIndex, sort, openVisualisation));
        if (step.type === 'form') columns.push(...formColumns(step, stepIndex, sort, editable, this.onEdit, this.confirmEdit, openVisualisation));
      });

    };

    return (
      <div className="dataManipulation">
        <Content style={{ padding: '0 50px' }}>

          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item><Link to="/">Dashboard</Link></Breadcrumb.Item>
            <Breadcrumb.Item><Link to="/containers">Containers</Link></Breadcrumb.Item>
            <Breadcrumb.Item><Link to={`/datalab/${match.params.id}`}>DataLab</Link></Breadcrumb.Item>
            <Breadcrumb.Item>Data Manipulation</Breadcrumb.Item>
          </Breadcrumb>

          <Layout style={{ padding: '24px 0', background: '#fff' }}>
            <Content style={{ padding: '0 24px', minHeight: 280 }}>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1em' }}>
                <h1 style={{ display: 'inline-block', margin: 0 }}>{build && build.name}</h1>
                <Link to='/containers' style={{ width: 'fit-content' }}>
                  <Icon type="arrow-left" />
                  <span>Back to containers</span>
                </Link>
              </div>

              <div style={{ marginBottom: 20}} >
                <RadioGroup defaultValue="data" size="large" onChange={() => history.push(`/datalab/${match.params.id}`)}>
                  <RadioButton value="data">Data View</RadioButton>
                  <RadioButton value="details">Details View</RadioButton>
                </RadioGroup>
              </div>

              { loading ?
                <Spin size="large" />
              :
                <div>                  
                  <VisualisationModal/>
                  
                  <Table
                    columns={columns}
                    dataSource={tableData}
                    scroll={{ x: (columns.length - 1) * 175 }}
                    onChange={this.handleChange} 
                    pagination={{ showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'] }}
                  />
                </div>
              }
            </Content>
          </Layout>
        </Content>
      </div>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    loading, error, build, data
  } = state.view;
  
  return {
    loading, error, build, data
  };
};

export default connect(mapStateToProps)(View);
