import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as StaticPageActionCreators from './StaticPageActions';
import BindWorkflowForm from './BindWorkflowForm';
import { Redirect } from 'react-router-dom';
import { Alert } from 'antd';
const queryString = require('query-string');

class StaticPageStaff extends React.Component {
    constructor(props) {
      super(props);
      const { dispatch } = props;
      this.boundActionCreators = bindActionCreators(StaticPageActionCreators, dispatch)
    }

    componentDidMount(){
        const link_id = queryString.parse(window.location.search).link_id;
        this.boundActionCreators.searchWorkflow(link_id);
    }

    render(){
        const {
            isWorkflowFound, error, containers, linkId, bindWorkflowSuccess, workflowId
        } = this.props;
        
        return(
            <div>
                { error && <Alert message={error} type="error"/>}
                {isWorkflowFound ?
                    <Redirect to={"/workflow/"+workflowId}/>
                :
                    <BindWorkflowForm containers={containers} onBind={this.boundActionCreators.bindWorkflow} linkId={linkId} bindWorkflowSuccess={bindWorkflowSuccess}/>
                }
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {
        isWorkflowFound, containers, linkId, bindWorkflowSuccess, workflowId
    } = state.staticPage;
    return {
        isWorkflowFound, containers, linkId, bindWorkflowSuccess, workflowId
    };
  }

export default connect(mapStateToProps)(StaticPageStaff);