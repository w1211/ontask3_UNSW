import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Card, Alert } from 'antd';
import * as StaticPageActionCreators from './StaticPageActions';
const queryString = require('query-string');

class StaticPageStudent extends React.Component {
    constructor(props) {
      super(props);
      const { dispatch } = props;
      this.boundActionCreators = bindActionCreators(StaticPageActionCreators, dispatch)
    }

    componentDidMount(){
        const link_id = queryString.parse(window.location.search).link_id;
        const zid = queryString.parse(window.location.search).zid;
        this.boundActionCreators.searchContent(link_id, zid);
    }

    render(){
        const {
            content, zid, error
        } = this.props;
        return (
            <div style={{justifyContent: 'center', display: 'flex', margin: '10px'}}>
                <Card title={zid} style={{ width: '80%' }}>
                    { error && <Alert message={error} type="error"/>}
                    <div>
                        {content}
                    </div>
                </Card>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {
        content, zid, error
    } = state.staticPage;
    return {
        content, zid, error
    };
  }

export default connect(mapStateToProps)(StaticPageStudent);