import React from 'react';
import { Spin, Table, Input, Button, Icon, DatePicker, Alert } from 'antd';
import './staticPage.css';

class HistoryTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterDropdownVisibleObj: {},
      filterDropdownTextObj: {}
    }
  }

  onInputChange = (e, field) => {
    let filterDropdownTextObj = {...this.state.filterDropdownTextObj};
    filterDropdownTextObj[field] =  e.target.value;

    this.setState({
      filterDropdownTextObj
    });
  }
    
  onDateChange = (field, date, dateString) => {
    let filterDropdownVisibleObj = {...this.state.filterDropdownVisibleObj};
    filterDropdownVisibleObj[field] = true;

    this.setState({
      'searchDate': dateString, 
      filterDropdownVisibleObj
    });
  }

  //search input text and date picked
  onSearch = (field, onSearchColumn) => {
    let filterDropdownVisibleObj = {...this.state.filterDropdownVisibleObj}
    filterDropdownVisibleObj[field] = false;

    this.setState({
      filterDropdownVisibleObj
    });

    if(field==='timeStamp'){
      const {searchDate} = this.state;

      onSearchColumn(searchDate, field, this.props.data, true);
    }
    else{
      const searchText = this.state.filterDropdownTextObj[field];
      const reg = new RegExp(searchText, 'gi');
      
      onSearchColumn(reg, field, this.props.data, false);
    }
  };

  render(){
    const {
      isFetching, data, matchField, matchReg, columns, error, onSearchColumn, onReset
    } = this.props;
    
    const filteredCols = columns.slice(0,4);
    //create a table column with field name
    const filterWrapper = (field) => {
      return {
        title: field,
        dataIndex: field,
        key: field,
        //drop down window
        filterDropdown: (
          <div className="custom-filter-dropdown">
            { field==='timeStamp'?
              <DatePicker 
                format="YYYY/MM/DD"
                onChange={(date, dateString) => this.onDateChange(field, date, dateString)}
              />
            :
              <Input
                ref={ele => this.searchInput = ele}
                placeholder="Search"
                value={this.state.filterDropdownTextObj[field]}
                onChange={(e)=>this.onInputChange(e, field)}
                onPressEnter={this.onSearch}
              />
            }
            <Button type="primary" onClick={()=>this.onSearch(field, onSearchColumn)}>Search</Button>
          </div>
        ),
        filterIcon: <Icon type="filter"/>,
        //state indicate which filter dropdown window should open
        filterDropdownVisible: this.state.filterDropdownVisibleObj[field],
        //update visible state for current field
        onFilterDropdownVisibleChange: (visible) => {
          let filterDropdownVisibleObj = {...this.state.filterDropdownVisibleObj}
          filterDropdownVisibleObj[field] = visible;

          this.setState(
            { filterDropdownVisibleObj },
            () => this.searchInput && this.searchInput.focus()
          );
        },
        render: (text, record, index) => {
          if(field===matchField){
            return (
              <span>
                { text.split(matchReg).map((content, i) => (
                  i > 0 ? 
                    [ <span className="highlight"> { record[matchField].match(matchReg)[0] } </span>, content ] 
                  : 
                    content
                ))}
              </span>
            )
          }
          return(
            <span>{text}</span>
          )
        }
      }
    };
  
    return (
      <div>
      { error && <Alert message={error} type="error" style={{ marginTop: '10px' }}/>}
      { isFetching ?
          <Spin size="large" />
          : 
          <div style={{ position:'relative', margin:"5px", padding:"5px" }}>
            <Table 
              style={{margin:'10px 20px 0px 20px', backgroundColor:'white'}}
              columns={filteredCols.map((field) => filterWrapper(field))}
              rowKey={(record, i)=>i}
              expandedRowRender={record => 
                <div style={{ margin: 0 }}>
                  <h4>Email body</h4>
                  {record.emailBody}
                </div>
              }
              dataSource={data.map((d, i)=>{return({key:i, ...d})})}
            />
            { data &&
              <Button
                style={{ marginLeft: '30px', position:'absolute', bottom: '15px', zIndex:'2'}} 
                onClick={onReset}>
                Reset
              </Button>
            }
          </div>
      }
      </div>
    );
  }
};

export default HistoryTable;