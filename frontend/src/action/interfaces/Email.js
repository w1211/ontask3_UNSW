import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Form, Input, Select, Button, Alert, Spin, Icon, Tooltip, Row, Col} from 'antd';
import { convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import moment from 'moment';
import _ from 'lodash';

import * as ActionActionCreators from '../ActionActions';

import {narrowFormItemLayout} from '../../shared/FormItemLayout';

import SchedulerModal from '../../scheduler/SchedulerModal';

const FormItem = Form.Item;
const Option = Select.Option;

class Email extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch, action, editorState } = props;

    this.boundActionCreators = bindActionCreators(ActionActionCreators, dispatch);

    this.state = { 
      index: 0,
      scheduler: { visible: false, selected: null, data: {} }
    };

    if (action) {
      const currentContent = editorState.getCurrentContent();
      if (!currentContent.hasText()) return;
  
      const payload = {
        html: draftToHtml(convertToRaw(currentContent)),
        plain: currentContent.getPlainText()
      };

      this.boundActionCreators.previewContent(action.id, payload, false);
    }
  };

  handleSubmit = () => {
    const { form, action } = this.props;
    let isSchedule = (action.schedule) ? true: false;
    
    form.validateFields((err, values) => {
      if (err) return;
      this.boundActionCreators.sendEmail(action.id, values, isSchedule);
    });
  };

  onChange = (checkValue) => {
    const { action } = this.props;
    if(checkValue.target.checked){
      this.boundActionCreators.openSchedulerModal(action.id, action.schedule);
    }
  }

  onDelete = () => {
    const {action} = this.props;
    this.boundActionCreators.deleteSchedule(action.id);
  }

  onUpdate =() => {
    const {action} = this.props;
    this.boundActionCreators.openSchedulerModal(action.id, action.schedule);
  }

  updateEmailSettings=()=>{
    const { form, action } = this.props;

    form.validateFields((err, values) => {
      if (err) return;
      this.boundActionCreators.updateEmailSettings(action.id, values);
    });
  }

  openScheduleModal = () => {
    const { action } = this.props;

    this.setState({
      scheduler: { visible: true, selected: action.id, data: { schedule: action.schedule } }
    });
  }

  render() {
    const { action, loading, error, form, previewLoading, previewContent } = this.props;
    const { scheduler } = this.state;

    let options = [];
    action && action.datalab.steps.forEach(step => {
      if (step.type === 'datasource') {
        step = step.datasource;
        step.fields.forEach(field => {
          const label = step.labels[field];
          options.push(label);
        });
      };
    });

    return (
      <div>
        <SchedulerModal
          {...scheduler}
          onUpdate={this.boundActionCreators.updateSchedule}
          onDelete={this.boundActionCreators.deleteSchedule}
          closeModal={() => this.setState({ scheduler: { visible: false, selected: null, data: {} } })}
        />

        <Form layout="horizontal">
          <div>
          { action && action.schedule ?
                <div>
                  <h3 style={{marginBottom:"1em"}}>Current schedule</h3>
                  <div style={{ backgroundColor: "#fafafa", padding: '1em 3em', margin: '1em 0', border: "1px dashed #e9e9e9", borderRadius: '5px', display: 'block' }}>
                    <div style={{textAlign:"right"}}>
                    <Tooltip title="Update current schedule">
                      <Button shape="circle" icon="edit" size="small" onClick={this.openScheduleModal}/>
                      </Tooltip>
                      </div>
                    {_.get(action, 'schedule.startTime') && <Row>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }} ><h4>Start Time:</h4> </Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }} >{moment(action.schedule.startTime).format("YYYY/MM/DD HH:mm:ss")}</Col>
                    </Row>}
                    {_.get(action, 'schedule.endTime') && <Row>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }} ><h4>End Time: </h4></Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }}>{moment(action.schedule.endTime).format("YYYY/MM/DD HH:mm:ss")}</Col>
                    </Row>}
                    <Row>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }}><h4>Time: </h4></Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }}>{moment(action.schedule.time).format("HH:mm")}</Col>
                    </Row>
                    <Row>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }}><h4>Frequency: </h4></Col>
                        {action.schedule.frequency === "daily"?
                          <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }} >Every {action.schedule.dayFrequency} {action.schedule.dayFrequency==="1"?"day":"days"}</Col>
                        :
                          <Col style={{paddingLeft: 10}}>{action.schedule.frequency}</Col>
                        }
                    </Row>
                    { action.schedule.frequency === "weekly" && 
                    <Row gutter={8}>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }} ><h4>DayOfWeek: </h4></Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }}>{action.schedule.dayOfWeek.map((day,i)=><span key={i}>{day} </span>)}</Col>
                    </Row>
                    }
                    { action.schedule.frequency === "monthly" && 
                    <Row gutter={8}>
                        <Col style={{textAlign:"right", marginBottom:5}} xs={{ span: 24 }} sm={{ span: 5 }} ><h4>DayOfMonth: </h4></Col>
                        <Col style={{paddingLeft: 10}} xs={{ span: 24 }} sm={{ span: 19 }}>{moment(action.schedule.dayOfMonth).format("DD")}</Col>
                    </Row>
                    }
                  </div>
                </div>
              :
                <Button icon="schedule" onClick={this.openScheduleModal}>Schedule email sending</Button>
              }
            </div>

            <div style={{ border: "1px dashed #e9e9e9", borderRadius: "6px", backgroundColor: "#fafafa" , padding: '1em 3em', margin: '1em 0', display: 'block' }}>
              <FormItem {...narrowFormItemLayout} label="Email field">
                {form.getFieldDecorator('emailSettings.field', {
                  rules: [{ required: true, message: 'Email field is required' }],
                  initialValue: action && action.emailSettings && action.emailSettings.field
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
                  initialValue: action && action.emailSettings && action.emailSettings.subject
                })(
                  <Input/>
                )}
              </FormItem>

              <FormItem {...narrowFormItemLayout} label="Reply-to">
                {form.getFieldDecorator('emailSettings.replyTo', {
                  rules: [{ required: true, message: 'Reply-to is required' }],
                  initialValue: action && action.emailSettings && action.emailSettings.replyTo ? action.emailSettings.replyTo : localStorage.email
                })(
                  <Input/>
                )}
              </FormItem>
              
              { action && action.emailSettings &&
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
                  style={{ maxHeight: 500 }}
                  dangerouslySetInnerHTML={{__html: previewContent && previewContent[this.state.index]}} 
                />
              }
            </div>
        </Form>
        {!(action && action.schedule && (action.schedule.taskName || action.schedule.asyncTasks.length!==0)) &&
          <div style={{ marginTop: '10px' }}>
            <Button loading={loading} type="primary" size="large" onClick={this.handleSubmit}> 
              { action && action.schedule ? 
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
    loading, error, action, editorState, previewLoading, previewContent
  } = state.action;
  return {
    loading, error, action, editorState, previewLoading, previewContent
  };
};

export default connect(mapStateToProps)(Form.create()(Email));
