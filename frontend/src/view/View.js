import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Table, Spin, Layout, Breadcrumb, Icon, Menu, Dropdown, Button, Modal } from 'antd';

import * as ViewActionCreators from './ViewActions';

import ColumnModal from './ColumnModal';
import DiscrepenciesModal from './resolve/DiscrepenciesModal';

const { Content } = Layout;
const confirm = Modal.confirm;


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

  handleHeaderDropdownClick = (e, columnIndex) => {
    const { view } = this.props;

    switch (e.key)  {
      case 'edit':
        this.boundActionCreators.openColumnModal(view.columns[columnIndex], columnIndex);
        break;

      case 'delete':
        confirm({
          title: 'Confirm column deletion',
          content: 'Are you sure you want to delete this column?',
          okText: 'Continue with deletion',
          okType: 'danger',
          cancelText: 'Cancel',
          onOk: () => {
            this.boundActionCreators.deleteColumn(view.id, columnIndex);
          }
        });
        break;

      default:
        break;
    };
  };

  render() {
    const { loading, build, data, location, match } = this.props;
    const { filtered, sorted } = this.state;

    // let columns = [];
    // let data;

    const HeaderDropdown = ({ column, label, index }) => (
      <Dropdown trigger={["click"]} overlay={
        // <Menu onClick={(e) => this.handleHeaderDropdownClick(e, index)}>
        <Menu>
          <Menu.Item key="visualise" disabled><Icon type="area-chart" style={{ marginRight: 5 }}/>Visualise</Menu.Item>
          {/* <Menu.Item key="edit"><Icon type="edit" style={{ marginRight: 5 }}/>Edit</Menu.Item> */}
          {/* <Menu.Item key="delete"><Icon type="delete" style={{ marginRight: 5 }}/>Delete</Menu.Item> */}
        </Menu>
      }>
        <a>{label}</a>
      </Dropdown>
    );

    const PrimaryKeyDropdown = ({ text }) => (
      <Dropdown trigger={["click"]} overlay={
        <Menu>
          <Menu.Item key="visualise" disabled><Icon type="area-chart" style={{ marginRight: 5 }}/>Visualise</Menu.Item>
        </Menu>
      }>
        <a>{text}</a>
      </Dropdown>
    );

    let columns = [];

    if (build) {
      build.steps.forEach(step => {
        step.datasource.fields.forEach((field) => {
          const label = step.datasource.labels[field];
          columns.push({
            title: <HeaderDropdown label={label}/>,
            dataIndex: label,
            key: label,
            filteredValue: filtered && filtered[label],
            onFilter: (value, record) => record[label].includes(value),
            sorter: (a, b) => { 
              a = label in a ? a[label] : '';
              b = label in b ? b[label] : '';
              return a.localeCompare(b);
            },
            sortOrder: sorted && sorted.columnKey === label && sorted.order,
            render: (text) => text
          })
        });
        // const field = column.label ? column.label : column.field;
        // return {
        //   title: (i === 0) ? field : <HeaderDropdown column={column} label={field} index={i}/>,
        //   dataIndex: field,
        //   key: field,
        //   fixed: i === 0 ? 'left' : undefined,
        //   filteredValue: filtered && filtered[field],
        //   onFilter: (value, record) => record[field].includes(value),
        //   sorter: (a, b) => { 
        //     a = field in a ? a[field] : '';
        //     b = field in b ? b[field] : '';
        //     return a.localeCompare(b);
        //   },
        //   sortOrder: sorted && sorted.columnKey === field && sorted.order,
        //   render: (text) => ((i === 0) ? PrimaryKeyDropdown({text}) : text)
        // }
      });
  
    };

    const data2 = data && data.map((data, i) => ({...data, key: i }));

    const dataLab = location.state && location.state.fromDataLab;

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
                <Link to={dataLab ? `/datalab/${match.params.id}` : '/containers'} style={{ width: 'fit-content' }}>
                  <Icon type="arrow-left" />
                  <span>Back to {`${dataLab ? 'DataLab' : 'containers'}`}</span>
                </Link>
              </div>

              { loading ?
                <Spin size="large" />
              :
                <div>
                  <div style={{ marginBottom: 10 }}>
                    {/* { view && 'dropDiscrepencies' in view && Object.keys(view.dropDiscrepencies).length > 0 &&
                      <Button size="large" style={{ marginRight: 10 }} onClick={() => this.setState({ discrepenciesModalVisible: true })}>
                        <Icon type="disconnect"/> Manage discrepencies
                      </Button>
                    } */}
{/*                     
                    <Dropdown trigger={["click"]} overlay={
                      <Menu onClick={this.handleAddColumn}>
                        <Menu.Item key="imported">Imported column</Menu.Item>
                        <Menu.Item key="derived" disabled>Derived column</Menu.Item>
                        <Menu.Item key="custom" disabled>Custom column</Menu.Item>
                      </Menu>
                    }>
                      <Button size="large">
                        <Icon type="plus"/> Add column
                      </Button>
                    </Dropdown> */}
                  </div>

                  {/* <ColumnModal/> */}
                  
                  {/* <DiscrepenciesModal
                    visible={this.state.discrepenciesModalVisible}
                    onCancel={() => { this.setState({ discrepenciesModalVisible: false }) }}
                    onOk={this.handleUpdateDiscrepencies}
                    view={view}
                  /> */}
                  
                  <Table
                    columns={columns}
                    dataSource={data2}
                    scroll={{ x: (columns.length - 1) * 175 }}
                    onChange={this.handleChange} 
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
