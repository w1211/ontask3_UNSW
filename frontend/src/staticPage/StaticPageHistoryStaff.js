import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import './staticPage.css';
import HistoryTable from './HistoryTable';

import * as StaticPageActionCreators from './StaticPageActions';

class StaticPageHistoryStaff extends React.Component {
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
    if(match.params.id){
      this.boundActionCreators.fetchWorkflowEmailHistory(match.params.id);//get audits with workflowId
    }
  };

  onReset = () => {
    const { match } = this.props;
    this.boundActionCreators.fetchWorkflowEmailHistory(match.params.id);
  };

  render() {
    const {
      isFetching, data, matchingData, columns, error
    } = this.props;

    return (
        <HistoryTable
            isFetching={isFetching}
            data={data}
            matchingData={matchingData}
            columns={columns}
            error={error}
            onSearchColumn={this.boundActionCreators.onSearchColumn}
            onReset={this.onReset}
        />
    );
  };
};

const mapStateToProps = (state) => {
  const {
    isFetching, data, matchField, matchReg, columns, error, matchingData
  } = state.staticPage;
  return {
    isFetching, data, matchField, matchReg, columns, error, matchingData
  };
}

export default connect(mapStateToProps)(StaticPageHistoryStaff);
