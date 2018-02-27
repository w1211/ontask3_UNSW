import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Spin, Table, Input, Button, Icon, DatePicker } from 'antd';
import './staticPage.css';


import * as StaticPageActionCreators from './StaticPageActions';

class StaticPage extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.boundActionCreators = bindActionCreators(StaticPageActionCreators, dispatch)
    this.state = {
      filterDropdownVisibleObj: {}
    }
  }

  componentDidMount() { 
    const { match } = this.props;
    this.boundActionCreators.fetchEmailHistory(match.params.id);//get audits with workflowId
  };

  //srote input
  onInputChange = (e) => {
    this.setState({ searchText: e.target.value });
  }
  
  //store date picked
  onDateChange = (value, dateString, field) => {
    this.setState({ searchDate: dateString });
  }

  //search input text and date picked
  onSearch = (field) => {
    //TODO: need to change the hard coding thing
    let filterDropdownVisibleObj = {...this.state.filterDropdownVisibleObj}
    filterDropdownVisibleObj[field] = false;
    this.setState({filterDropdownVisibleObj});
    if(field==='timeStamp'){
      const {searchDate} = this.state;
      this.boundActionCreators.onSearchColumn(searchDate, field, this.props.data, true);
    }
    else{
      const { searchText } = this.state;
      const reg = new RegExp(searchText, 'gi');
      this.boundActionCreators.onSearchColumn(reg, field, this.props.data, false);
    }
  }

  render() {
    const {
      isFetching, data, matchField, matchReg, columns
    } = this.props;

    //create a table column with field name
    const filterWrapper = (field) => {
      return {
        title: field,
        dataIndex: field,
        key: field,
        filterDropdown: (
          <div className="custom-filter-dropdown">
          {field==='timeStamp'?
            <DatePicker 
              format="YYYY/MM/DD"
              onChange={() => this.onDateChange(field)}
            />
            :
            <Input
              ref={ele => this.searchInput = ele}
              placeholder="Search"
              value={this.state.searchText}
              onChange={this.onInputChange}
              onPressEnter={this.onSearch}
            />
          }
          <Button type="primary" onClick={()=> this.onSearch(field)}>Search</Button>
          </div>
        ),
        filterIcon: <Icon type="search"/>,
        filterDropdownVisible: this.state.filterDropdownVisibleObj[field],
        onFilterDropdownVisibleChange: (visible) => {
          let filterDropdownVisibleObj = {...this.state.filterDropdownVisibleObj}
          filterDropdownVisibleObj[field] = visible;
          this.setState({filterDropdownVisibleObj}, () => this.searchInput && this.searchInput.focus());
        },
        render: (text, record, index) => {
          if(field===matchField){
            return (
              <span>
                {text.split(matchReg).map((content, i) => (
                  i > 0 ? [<span className="highlight">{record[matchField].match(matchReg)[0]}</span>, content] : content
                ))}
              </span>
            )
          }
          return(<span>{text}</span>)    
        }
      }
    };

    return (
      <div>
      { isFetching ?
        <Spin size="large" />
      :
        <Table 
          style={{padding:'0px 20px'}}
          columns={columns.map((field) => filterWrapper(field))}
          dataSource={data}
        />
      }
      </div>
    );
  };
};

const mapStateToProps = (state) => {
  const {
    isFetching, data, matchField, matchReg, columns
  } = state.staticPage;
  return {
    isFetching, data, matchField, matchReg, columns
  };
}

export default connect(mapStateToProps)(StaticPage);
