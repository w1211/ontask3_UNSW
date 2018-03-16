import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Table, Spin, Layout, Breadcrumb, Icon } from 'antd';

import * as ViewActionCreators from './ViewActions';

const { Content, Sider } = Layout;


class View extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    this.state = {
      filtered: null,
      sorted: null
    };
  }

  handleChange = (pagination, filters, sorter) => {
    this.setState({
      filtered: filters,
      sorted: sorter
    });
  }

  componentDidMount() {
    const { match } = this.props;
    this.boundActionCreators.fetchView(match.params.id);
  };

  render() {
    const { dispatch, loading, error, view } = this.props;
    const { filtered, sorted } = this.state;

    let columns = [];
    let data;

    if (view) {
      columns = view.columns.map((column, i) => {
        const field = column.label ? column.label : column.field;
        return {
          title: field,
          dataIndex: field,
          key: field,
          fixed: i === 0 ? 'left' : undefined,
          filteredValue: filtered && filtered[field],
          onFilter: (value, record) => record[field].includes(value),
          sorter: (a, b) => { 
            a = field in a ? a[field] : '';
            b = field in b ? b[field] : '';
            return a.localeCompare(b);
          },
          sortOrder: sorted && sorted.columnKey === field && sorted.order
        }
      });
  
      data = view.data.map((data, i) => ({...data, key: i }));
    }

    return (
      <div>
        <Content style={{ padding: '0 50px' }}>

          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item><Link to="/">Dashboard</Link></Breadcrumb.Item>
            <Breadcrumb.Item><Link to="/containers">Containers</Link></Breadcrumb.Item>
            <Breadcrumb.Item>View</Breadcrumb.Item>
          </Breadcrumb>

          <Layout style={{ padding: '24px 0', background: '#fff' }}>
            <Content style={{ padding: '0 24px', minHeight: 280 }}>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1em' }}>
                <h1 style={{ display: 'inline-block', margin: 0 }}>{view && view.name}</h1>
                <Link to="/containers">
                  <Icon type="arrow-left" />
                  <span>Back to containers</span>
                </Link>
              </div>
              
              { loading ?
                <Spin size="large" />
              :
                <Table
                  columns={columns}
                  dataSource={data}
                  scroll={{ x: (columns.length - 1) * 175 }}
                  onChange={this.handleChange} 
                />
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
    loading, error, view
  } = state.view;
  
  return {
    loading, error, view
  };
}

export default connect(mapStateToProps)(View)
