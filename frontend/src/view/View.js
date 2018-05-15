import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Table, Spin, Layout, Breadcrumb, Icon, Menu, Dropdown, Radio, Input, InputNumber, DatePicker, Checkbox, Select, message } from 'antd';

import * as ViewActionCreators from './ViewActions';

import VisualisationModal from './VisualisationModal';

const { Content } = Layout;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const Option = Select.Option;


const EditableField = ({ field, value, onChange, onOk }) => {
  const type = field.type;

  const onKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) onOk();
  };

  if (type === 'text') {
    return field.textArea ?
        <Input.TextArea autoFocus onKeyPress={onKeyPress} defaultValue={value} onChange={(e) => onChange(e.target.value)}/>
      :
        <Input autoFocus onKeyPress={onKeyPress} defaultValue={value} onChange={(e) => onChange(e.target.value)}/>

  } else if (type === 'number') {
    return <InputNumber autoFocus defaultValue={value} onChange={(e) => onChange(e)}/>;

  } else if (type === 'date') {
    return <DatePicker autoFocus defaultValue={value ? moment(value) : null} onChange={(e) => onChange(e ? moment.utc(e).format() : null)}/>;

  } else if (type === 'checkbox') {
    return <Checkbox defaultChecked={value === 'True'} onChange={(e) => { onChange(e.target.checked) }}/>;

  } else if (type === 'dropdown') {
    return (
      <Select 
        autoFocus defaultValue={value ? value : []}  style={{ width: '100%' }} 
        mode={field.multiSelect ? 'multiple' : 'default'}
        onChange={(e) => onChange(e)}
        allowClear={true}
      >
        { field.options.map(option => 
          <Option key={option.value}>{option.label}</Option>
        )}
      </Select>
    );
  }

  return null;
};

class View extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ViewActionCreators, dispatch);

    this.state = {
      filtered: null,
      sorted: null,
      editable: { }
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

  handleHeaderDropdownClick = (e, stepIndex, field, label) => {
    switch (e.key)  {
      case 'visualise':
        this.boundActionCreators.openVisualisationModal({ stepIndex, field, label });
        break;

      default:
        break;
    };
  };

  editNode = () => {
    const { match } = this.props;
    const { editable } = this.state;
    
    this.boundActionCreators.updateFormNode(
      match.params.id, 
      { ...editable, field: editable.field.name },
      () => this.setState({ editable: { } })
    );
  };

  render() {
    const { history, loading, build, data, match } = this.props;
    const { filtered, sorted, editable } = this.state;

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

      build.steps.forEach((step, stepIndex) => {
        if (step.type === 'datasource') {
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
              key: label,
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
          });
        };

        if (step.type === 'form') {
          step.form.fields.forEach(field => {
            columns.push({
              title: field.name,
              dataIndex: field.name,
              key: field.name,
              render: (text, record, row) => {
                const primary = record[step.form.primary];
                let label;

                if (field.type === 'dropdown') {
                  if (field.multiSelect) {
                    if (field.name in record) record[field.name].forEach((value, i) => {
                      const option = field.options.find(option => option.value === value);
                      if (option) {
                        if (i === 0) label = option.label;
                        if (i > 0) label += `, ${option.label}`
                      };
                    });
                  } else {
                    const option = field.options.find(option => option.value === text);
                    if (option) label = option.label;
                  };
                }

                if (field.type === 'date') {
                  if (text) text = moment(text).format('YYYY-MM-DD');
                }

                if (field.type === 'checkbox') {
                  text = text ? 'True' : 'False';
                }
                
                return (editable.primary === primary && 'field' in editable && editable.field.name === field.name) ?
                  <div className="editable-field">
                    <EditableField 
                      field={field} value={text} 
                      onChange={(e) => this.setState({ editable: { ...editable, text: e } })}
                      onOk={this.editNode}
                    />
                    <Icon type="close" onClick={() => this.setState({ editable: { } })}/>
                    <Icon type="save" onClick={this.editNode}/>
                  </div>
                :
                  <div className="form-field">
                    {label ? label : text}
                    <Icon 
                      size="large" type="edit" 
                      onClick={(e) => {
                        if (record[step.form.primary]) {
                          this.setState({ editable: { stepIndex, field, primary, text } });
                        } else {
                          message.warning(`This form field cannot be edited as the matching field (${step.form.primary}) for this record is empty.`);
                        };
                      }}
                    />
                  </div>
              }  
            });
          });
        };
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
