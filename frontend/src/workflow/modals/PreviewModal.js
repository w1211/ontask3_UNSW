import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Button, Icon } from 'antd';

import * as WorkflowActionCreators from '../WorkflowActions';


class PreviewModal extends React.Component {
    
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch);

    this.state = { index: 0 };
  }

  handleClose = () => {
    this.boundActionCreators.closePreviewContent();
    this.setState({ index: 0 });
  }
  render() {
      const { previewModalVisible, previewContent } = this.props;
    
      return (
        <Modal
          visible={previewModalVisible}
          title={`Preview content: ${this.state.index + 1}`}
          onCancel={this.handleClose}
          footer={null}
        >
        { previewContent &&
          <div style={{ display: 'flex', flexDirection: 'column'}}>
            <Button.Group size="large" style={{ marginBottom: '10px', textAlign: 'center' }}>
              <Button type="primary" disabled={this.state.index === 0 || previewContent.length === 0}
                onClick={() => {
                  this.setState(prevState => {
                    return { index: prevState.index - 1 }
                  })
                }}
              >
                <Icon type="left" />Previous
              </Button>
              
              <Button type="primary" disabled={this.state.index === previewContent.length - 1 || previewContent.length === 0}
                onClick={() => {
                  this.setState(prevState => {
                    return { index: prevState.index + 1 }
                  })
                }}
              >
                Next<Icon type="right" />
              </Button>
            </Button.Group>
            
            { previewContent.length > 0 ?
              <div style={{ padding: '10px', border: '1px solid #F1F1F1' }}
                dangerouslySetInnerHTML={{__html: previewContent[this.state.index]}}
              />
            :
              <div style={{ padding: '10px', border: '1px solid #F1F1F1', textAlign: 'center' }}>
                After filtering, no results were returned from your view.
              </div>
            }
          </div>
        }
        </Modal>
      );
    };
  };
  
const mapStateToProps = (state) => {
  const { 
    previewModalVisible, previewContent
  } = state.workflow;
  
  return { 
    previewModalVisible, previewContent
  };
};

export default connect(mapStateToProps)(PreviewModal);
