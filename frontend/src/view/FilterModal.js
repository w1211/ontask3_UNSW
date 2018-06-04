import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Radio } from 'antd';

import * as ViewActionCreators from './ViewActions';
import { fetchContainers } from '../container/ContainerActions';

const RadioGroup = Radio.Group;

class FilterModal extends React.Component{
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.state = {
      selectedAction: ''
    };
    this.boundActionCreators = bindActionCreators({...ViewActionCreators, fetchContainers}, dispatch);
  };

  render(){
    const { selectedAction } = this.state;
    const { filterModalVisibility, actions, category, value, workflows } = this.props;

    return(
      <Modal width={500}
        visible={filterModalVisibility}
        title={'AddFilter'}
        onCancel={this.boundActionCreators.closeFilterModal}
        onOk={()=>console.log("ok")}
        okText="Save"
        cancelText="Close"
      >
        <div>Apply filter <span style={{color:'#40a9ff'}}> {value} equal {category} </span> to action:</div>
        <RadioGroup 
          onChange={(e) => this.setState({selectedAction: e.target.value})} 
          value={this.state.selectedAction}
          style={{margin:5}}
        >
          {workflows && workflows.map((workflow, i)=>{
            return(
            <Radio key={i} value={workflow.id}>{workflow.name}</Radio>
            )
          })}
        </RadioGroup>
      </Modal>
    )
  };
};

const mapStateToProps = (state) => {
  const { 
    filterModalVisibility, actions, category, value, workflows
  } = state.view;
  
  return { 
    filterModalVisibility, actions, category, value, workflows
  };
};

export default connect(mapStateToProps)(FilterModal);
