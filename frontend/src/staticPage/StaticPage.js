import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Spin, List, Card, Row, Col } from 'antd';

import * as StaticPageActionCreators from './StaticPageActions';

class StaticPage extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    this.boundActionCreators = bindActionCreators(StaticPageActionCreators, dispatch)
  }

  componentDidMount() { 
    const { match } = this.props;
    this.boundActionCreators.fetchEmailHistory(match.params.id);
  };

  render() {
    const {
      isFetching, emailHistory
    } = this.props;

    return (
      <div>
      { isFetching ?
        <Spin size="large" />
      :
          <List
            dataSource={emailHistory}
            renderItem={email => (
              <List.Item>
                <Card style={{width:'80%', margin:'auto'}} title={email.emailSubject} extra={email.timeStamp}>
                <Row gutter={32}>
                  <Col span={12}><b>Sender</b>: {email.creator} </Col>
                  <Col span={12}><b>Receiver</b>: {email.receiver} </Col>
                  <div>{email.emailBody}</div>
                </Row>
                </Card>
              </List.Item>
            )}
          />
      }
      </div>
    );
  };
};

const mapStateToProps = (state) => {
  const {
    isFetching, emailHistory
  } = state.staticPage;
  return {
    isFetching, emailHistory
  };
}

export default connect(mapStateToProps)(StaticPage)
