import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import './staticPage.css';
import HistoryTable from './HistoryTable';


import * as StaticPageActionCreators from './StaticPageActions';

class StaticPageHistoryStudent extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.boundActionCreators = bindActionCreators(StaticPageActionCreators, dispatch)
    this.state = {
      filterDropdownVisibleObj: {}
    }
  }

  componentDidMount() {
      this.boundActionCreators.fetchEmailHistory();
  };

  onReset = () => {
    this.boundActionCreators.fetchEmailHistory();
  };

  render() {
    const {
      isFetching, data, matchField, matchReg, columns, error
    } = this.props;

    return (
        <HistoryTable
            isFetching={isFetching}
            data={data}
            matchField={matchField}
            matchReg={matchReg}
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
    isFetching, data, matchField, matchReg, columns, error
  } = state.staticPage;
  return {
    isFetching, data, matchField, matchReg, columns, error
  };
}

export default connect(mapStateToProps)(StaticPageHistoryStudent);
