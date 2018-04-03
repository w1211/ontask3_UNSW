import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Form, Input, Select, Button, Alert, Spin, Icon, Checkbox } from 'antd';
import { convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';

import * as WorkflowActionCreators from '../WorkflowActions';

import formItemLayout from '../../shared/FormItemLayout';

const FormItem = Form.Item;
const Option = Select.Option;


class Email extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch, workflow, editorState } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch);

    if (workflow) {
      const currentContent = editorState.getCurrentContent();
      if (!currentContent.hasText()) return;
  
      const payload = {
        html: draftToHtml(convertToRaw(currentContent)),
        plain: currentContent.getPlainText()
      };

      this.boundActionCreators.previewContent(workflow.id, payload, false);
    }

    this.state = { index: 0 };
  };

  handleSubmit = () => {
    const { form, workflow } = this.props;

    form.validateFields((err, values) => {
      if (err) return;

      this.boundActionCreators.sendEmail(workflow.id, values);
    });
  };

  render() {
    const { workflow, loading, error, form, previewLoading, previewContent } = this.props;

    const options = [];
    if (workflow && workflow.view && 'columns' in workflow.view) {
      workflow.view.columns.forEach(column => {
        options.push(column.label ? column.label : column.field);
      });
    }

    return (
      <div>
        <Form layout="horizontal">
          <div>
            <div style={{ maxWidth: 700 }}>
              <FormItem {...formItemLayout} label="Email field">
                {form.getFieldDecorator('emailSettings.field', {
                  rules: [{ required: true, message: 'Email field is required' }],
                  initialValue: workflow && workflow.emailSettings && workflow.emailSettings.field
                })(
                  <Select>
                    { options.map((option, i) => {
                      return <Option value={option} key={i}>{option}</Option>
                    })}
                  </Select>
                )}
              </FormItem>

              <FormItem {...formItemLayout} label="Subject">
                {form.getFieldDecorator('emailSettings.subject', {
                  rules: [{ required: true, message: 'Subject is required' }],
                  initialValue: workflow && workflow.emailSettings && workflow.emailSettings.subject
                })(
                  <Input/>
                )}
              </FormItem>

              <FormItem {...formItemLayout} label="Reply-to">
                {form.getFieldDecorator('emailSettings.replyTo', {
                  rules: [{ required: true, message: 'Reply-to is required' }],
                  initialValue: workflow && workflow.emailSettings && workflow.emailSettings.replyTo ? workflow.emailSettings.replyTo : localStorage.email
                })(
                  <Input/>
                )}
              </FormItem>

              <FormItem {...formItemLayout} label="Scheduled task">
                {form.getFieldDecorator('schedule.enabled', {
                  initialValue: workflow && workflow.schedule && workflow.schedule.enabled
                })(
                  <Checkbox/>
                )}
              </FormItem>  

            </div>


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
                  style={{ maxHeight: 500, overflow: 'scroll' }}
                  dangerouslySetInnerHTML={{__html: previewContent && previewContent[this.state.index]}} 
                />
              }
            </div>
            

          </div>
        </Form>

        <div style={{ marginTop: '10px' }}>
          <Button loading={loading} type="primary" size="large" onClick={this.handleSubmit}>
            { form.getFieldValue('schedule.enabled') ? 
              'Save'
            :
              'Send once-off email'
            }
          </Button>
        </div>

        { error && <Alert message={error} type="error" style={{ marginTop: '10px' }}/>}
      </div>
    );
  };
};

const mapStateToProps = (state) => {
  const {
    loading, error, workflow, editorState, previewLoading, previewContent
  } = state.workflow;
  return {
    loading, error, workflow, editorState, previewLoading, previewContent
  };
};

export default connect(mapStateToProps)(Form.create()(Email));
