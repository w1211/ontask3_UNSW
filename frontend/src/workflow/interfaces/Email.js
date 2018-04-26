import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Form, Input, Select, Button, Alert, Spin, Icon, Checkbox, Tooltip, Row, Col} from 'antd';
import { convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import moment from 'moment';

import * as WorkflowActionCreators from '../WorkflowActions';
import { openSchedulerModal } from '../../scheduler/SchedulerActions';

import {narrowFormItemLayout} from '../../shared/FormItemLayout';

import SchedulerModal from '../../scheduler/SchedulerModal';

const FormItem = Form.Item;
const Option = Select.Option;

class Email extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch, workflow, editorState } = props;

    this.boundActionCreators = bindActionCreators({
      ...WorkflowActionCreators, openSchedulerModal}, dispatch);

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

  handleSubmit = () => {
    const { form, workflow } = this.props;
    let isSchedule = (workflow.schedule) ? true: false;
    
    form.validateFields((err, values) => {
      if (err) return;
      this.boundActionCreators.sendEmail(workflow.id, values, isSchedule);
    });
  };

  onChange = (checkValue) => {
    const { workflow} = this.props;
    if(checkValue.target.checked){
      this.boundActionCreators.openSchedulerModal(workflow.id, workflow.schedule);
    }
  }

  onDelete = () => {
    const {workflow} = this.props;
    this.boundActionCreators.deleteSchedule(workflow.id);
  }

  onUpdate =() => {
    const {workflow} = this.props;
    this.boundActionCreators.openSchedulerModal(workflow.id, workflow.schedule);
  }

  updateEmailSettings=()=>{
    const { form, workflow } = this.props;

    form.validateFields((err, values) => {
      if (err) return;
      console.log(values);
      this.boundActionCreators.updateEmailSettings(workflow.id, values);
    });
  }

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
        <SchedulerModal
          onUpdate={this.boundActionCreators.updateSchedule}
          onDelete={this.boundActionCreators.deleteSchedule}
          allowFutureStart={true}
        />
        <Form layout="horizontal">
          <div>
          { workflow && workflow.schedule ?
                <div>
                  <h3 style={{marginBottom:"1em"}}>Current schedule</h3>
                  <div style={{ backgroundColor: "#fafafa", padding: '1em 3em', margin: '1em 0', border: "1px dashed #e9e9e9", borderRadius: '5px', display: 'block' }}>
                    <div style={{textAlign:"right"}}>
                    <Tooltip title="Update current schedule">
                      <Button shape="circle" icon="edit" size="small" onClick={this.onUpdate}/>
                      </Tooltip>
                      </div>
                    <Row>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }} ><h4>Start Time:</h4> </Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }} >{moment(workflow.schedule.startTime).format("YYYY/MM/DD HH:mm:ss")}</Col>
                    </Row>
                    <Row>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }} ><h4>End Time: </h4></Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }}>{moment(workflow.schedule.endTime).format("YYYY/MM/DD HH:mm:ss")}</Col>
                    </Row>
                    <Row>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }}><h4>Time: </h4></Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }}>{moment(workflow.schedule.time).format("HH:mm")}</Col>
                    </Row>
                    <Row>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }}><h4>Frequency: </h4></Col>
                        {workflow.schedule.frequency == "daily"?
                          <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }} >Every {workflow.schedule.dayFrequency} {workflow.schedule.dayFrequency=="1"?"day":"days"}</Col>
                        :
                          <Col style={{paddingLeft: 10}}>{workflow.schedule.frequency}</Col>
                        }
                    </Row>
                    { workflow.schedule.frequency == "weekly" && 
                    <Row gutter={8}>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }} ><h4>DayOfWeek: </h4></Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }}>{workflow.schedule.dayOfWeek.map((day,i)=><span>{day} </span>)}</Col>
                    </Row>
                    }
                    { workflow.schedule.frequency == "monthly" && 
                    <Row gutter={8}>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }} ><h4>DayOfMonth: </h4></Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }}>{moment(workflow.schedule.dayOfMonth).format("DD")}</Col>
                    </Row>
                    }
                  </div>
                </div>
              :
                <div style={{ maxWidth: 700 }}>
                  <FormItem {...narrowFormItemLayout} label="Scheduled task">
                    {form.getFieldDecorator('schedule.enabled', {
                      initialValue: workflow && workflow.schedule
                    })(
                      <Checkbox onChange={this.onChange} checked={workflow && workflow.schedule ? true : false}/>
                    )}
                  </FormItem>
                </div>
              }
            </div>

            <div style={{ border: "1px dashed #e9e9e9", borderRadius: "6px", backgroundColor: "#fafafa" , padding: '1em 3em', margin: '1em 0', display: 'block' }}>
              <FormItem {...narrowFormItemLayout} label="Email field">
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

              <FormItem {...narrowFormItemLayout} label="Subject">
                {form.getFieldDecorator('emailSettings.subject', {
                  rules: [{ required: true, message: 'Subject is required' }],
                  initialValue: workflow && workflow.emailSettings && workflow.emailSettings.subject
                })(
                  <Input/>
                )}
              </FormItem>

              <FormItem {...narrowFormItemLayout} label="Reply-to">
                {form.getFieldDecorator('emailSettings.replyTo', {
                  rules: [{ required: true, message: 'Reply-to is required' }],
                  initialValue: workflow && workflow.emailSettings && workflow.emailSettings.replyTo ? workflow.emailSettings.replyTo : localStorage.email
                })(
                  <Input/>
                )}
              </FormItem>
              
              { workflow && workflow.emailSettings &&
                <div style={{textAlign: "right"}}><Button loading={loading} onClick={this.updateEmailSettings}>Update</Button></div>
              }
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
        </Form>
        {!(workflow && workflow.schedule && (workflow.schedule.taskName || workflow.schedule.asyncTasks.length!==0)) &&
          <div style={{ marginTop: '10px' }}>
            <Button loading={loading} type="primary" size="large" onClick={this.handleSubmit}> 
              { workflow && workflow.schedule ? 
                'Save'
              :
                'Send once-off email'
              }
            </Button>
          </div>
        }

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
