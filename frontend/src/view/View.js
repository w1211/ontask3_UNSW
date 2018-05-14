import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Table, Spin, Layout, Breadcrumb, Icon, Menu, Dropdown, Radio } from 'antd';

import * as ViewActionCreators from './ViewActions';

import VisualisationModal from './VisualisationModal';

const { Content } = Layout;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;


class View extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    this.state = {
      filtered: null,
      sorted: null,
      discrepenciesModalVisible: false
    };
  };

  componentDidMount() {
    const { match } = this.props;
    this.boundActionCreators.retrieveDataLab(match.params.id);
  };

  handleChange = (pagination, filters, sorter) => {
    this.setState({
      filtered: filters,
      sorted: sorter
    });
  };

  handleUpdateDiscrepencies = (dropDiscrepencies) => {
    const { view } = this.props;
    this.boundActionCreators.updateDiscrepencies(view.id, dropDiscrepencies);
    this.setState({ discrepenciesModalVisible: false });
  };

  handleAddColumn = (e) => {
    switch (e.key) {
      case 'imported':
        this.boundActionCreators.openColumnModal();
        break;
      default:
        break;
    };
  };

  handleHeaderDropdownClick = (e, stepIndex, field, label) => {
    switch (e.key)  {
      case 'visualise':
        this.boundActionCreators.openVisualisationModal({ stepIndex, field, label });
        break;

      default:
        break;
    };
  };

  render() {
    const { history, loading, build, data, match } = this.props;
    const { filtered, sorted } = this.state;

    let columns = [];
    let tableData = data && data.map((data, i) => ({...data, key: i }));

    const HeaderDropdown = ({ stepIndex, field, label }) => (
      <Dropdown trigger={["click"]} overlay={
        <Menu onClick={(e) => this.handleHeaderDropdownClick(e, stepIndex, field, label)}>
          <Menu.Item key="visualise">
            <Icon type="area-chart" style={{ marginRight: 5 }}/>Visualise
          </Menu.Item>
        </Menu>
      }>
        <a>{label}</a>
      </Dropdown>
    );
    
    if (build) {
      // First non-primary field in the first module, assuming its a datasource
      const defaultField = build.steps[0].datasource.fields.filter(field => field !== build.steps[0].datasource.primary)[0];
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

      let index = 1;
      build.steps.forEach((step, stepIndex) => {
        if (step.type !== 'datasource') return;
        
        step.datasource.fields.forEach((field) => {
          const label = step.datasource.labels[field];
          columns.push({
            title: (
              step[step.type].matching !== field && step[step.type].primary !== field ?
                <HeaderDropdown stepIndex={stepIndex} field={field} label={label}/>
              :
                field
            ),
            dataIndex: label,
            key: index,
            filteredValue: filtered && filtered[label],
            onFilter: (value, record) => record[label].includes(value),
            sorter: (a, b) => {
              a = label in a ? a[label] : '';
              b = label in b ? b[label] : '';
              return a.localeCompare(b);
            },
            sortOrder: sorted && sorted.field === label && sorted.order,
            render: (text) => text
          })

          index++;
        });
      });
  
    };

    return (
      <div>
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
