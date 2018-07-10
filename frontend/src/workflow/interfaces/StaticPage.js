import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Form, Button, Alert, Spin, Icon, Divider} from 'antd';
import { convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';

import * as WorkflowActionCreators from '../WorkflowActions';


class StaticPage extends React.Component{
  constructor(props) {
    super(props);
    const { dispatch, workflow, editorState } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch);

    this.state = { index: 0 };

    if (workflow) {
      const currentContent = editorState.getCurrentContent();
      if (!currentContent.hasText()) return;
  
      const payload = {
        html: draftToHtml(convertToRaw(currentContent)),
        plain: currentContent.getPlainText()
      };

      this.boundActionCreators.previewContent(workflow.id, payload, false);
    }
  };

  render(){
    const { workflow, loading, error, previewLoading, previewContent } = this.props;
    return(
      <div>
        <h3>
          View auditing history
          { workflow &&
            <Link target="_blank" to={`/staticPageHistoryStaff/${workflow.id}`}>
              <Button style={{ marginLeft: '10px' }} shape="circle" icon="link"/>
            </Link>
          }
        </h3>
        <Divider dashed />
        <h3>
          Preview static page
        </h3>
        <Form>
            <div className="ant-form-item-label" style={{ display: 'flex' }}>
              <label>Content preview</label> ({this.state.index + 1})
              { previewContent && 
                <div style={{ flex: 1 }}>
                  <Button.Group style={{ marginBottom: '10px', textAlign: 'center' }}>
                    <Button disabled={this.state.index === 0 || previewContent.length === 0}
                      onClick={() => {
                        this.setState(prevState => {
                          return { index: prevState.index - 1 }
                        })
                      }}
                    >
                      <Icon type="left" />Previous
                    </Button>
                    
                    <Button disabled={this.state.index === previewContent.length - 1 || previewContent.length === 0}
                      onClick={() => {
                        this.setState(prevState => {
                          return { index: prevState.index + 1 }
                        })
                      }}
                    >
                      Next<Icon type="right" />
                    </Button>
                  </Button.Group>
                </div>
              }
            </div> 

            <div className={ previewLoading ? 'previewLoading' : '' } style={{ border: '1px solid #d9d9d9', borderRadius: 4, padding: '4px 11px', minHeight: 200 }}>
              { previewLoading ?
                <Spin size="large" />
              :
                <div 
                  style={{ maxHeight: 500 }}
                  dangerouslySetInnerHTML={{__html: previewContent && previewContent[this.state.index]}} 
                />
              }
            </div>
        </Form>
        <Button style={{ marginTop: '10px' }} loading={loading} type="primary" size="large" onClick={this.handleSubmit}>Save</Button>

        { error && <Alert message={error} type="error" style={{ marginTop: '10px' }}/>}
      </div>
    );
  };
}

const mapStateToProps = (state) => {
  const {
    loading, error, workflow, editorState, previewLoading, previewContent
  } = state.workflow;
  return {
    loading, error, workflow, editorState, previewLoading, previewContent
  };
};

export default connect(mapStateToProps)(Form.create()(StaticPage));