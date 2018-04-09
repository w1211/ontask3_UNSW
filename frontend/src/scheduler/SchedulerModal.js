import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Input, Alert, Select, DatePicker, Button, TimePicker } from 'antd';
import moment from 'moment';

import formItemLayout from '../shared/FormItemLayout';
import * as SchedulerActionCreators from './SchedulerActions';

const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;
const { RangePicker } = DatePicker;


class SchedulerModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(SchedulerActionCreators, dispatch);
  }

  handleOk = () => {
    const { form, selectedId, schedule, onUpdate } = this.props;

    form.validateFields((err, values) => {
      if (err) return;

      values.time = values.time.utc().format();
      if ('dayOfMonth' in values) values.dayOfMonth = values.dayOfMonth.format();
      const isCreate = schedule ? true : false;
      onUpdate(selectedId, values, isCreate);
    })

  };

  onCancel = () => { 
    const { form } = this.props;
    
    form.resetFields(); 
    this.boundActionCreators.closeSchedulerModal(); 
  };

  onDelete = () => {
    const { selectedId, onDelete } = this.props;

    confirm({
      title: 'Confirm schedule removal',
      content: 'Are you sure you want to remove the schedule?',
      okText: 'Yes, remove',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        onDelete(selectedId);
      }
    });

  }

  // User can not select days before today, today and one year after
  disabledDate = (current) => {
    if (current < moment().endOf('day') || current > moment().add(1,'y')) {
      return true;
    };
    return false;
  }

  render() {
    const { form, visible, schedule, allowFutureStart, error } = this.props;
    const { getFieldDecorator } = form;
      
    return(
      <Modal
        title={ schedule ? 'Update schedule' : 'Create schedule' }
        visible={visible}
        onCancel={this.onCancel}
        footer = { schedule ? [
          <Button key="cancel" onClick={this.onCancel}>Cancel</Button>, 
          <Button key="delete" type="danger" onClick={this.onDelete}>Delete</Button>, 
          <Button key="update" type="primary" onClick={this.handleOk}>Update</Button>
        ] : [
          <Button key="cancel" onClick={this.onCancel}>Cancel</Button>, 
          <Button key="create" type="primary" onClick={this.handleOk}>Create</Button>
        ] }
      >
        <Form layout="horizontal">
          <FormItem {...formItemLayout} label="Time">
            { getFieldDecorator('time', {
                initialValue: schedule ? moment.utc(schedule.time).local() : null,
                rules: [{ required: true, message: 'Time is required' }]
            })(
              <TimePicker format={'HH:mm'}/>
            )}
          </FormItem>
          
          <FormItem {...formItemLayout} label="Frequency">
            { getFieldDecorator('frequency', {
              initialValue: schedule ? schedule.frequency : 'daily',
              rules: [{ required: true, message: 'Frequency is required' }]
            })(
              <Select style={{ maxWidth: 250 }}>
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="monthly">Monthly</Option>
              </Select>
            )}
          </FormItem>
        
          { form.getFieldValue('frequency') === "daily" &&
            <FormItem {...formItemLayout} label="When">
              { getFieldDecorator('dayFrequency', {
                initialValue: schedule ? schedule.dayFrequency : null,
                rules: [
                  { required: true, message: 'When is required' },
                  { pattern: '^[1-9][0-9]*$', message: 'Must be an integer' }
                ]
              })(
                <Input style={{ maxWidth: 250 }} addonBefore='Every' addonAfter={form.getFieldValue('dayFrequency') > 1 ? 'days' : 'day' }/>
              )}
            </FormItem>
          }

          { form.getFieldValue('frequency') === "weekly" &&
            <FormItem {...formItemLayout} label="When">
              { getFieldDecorator('dayOfWeek', {
                initialValue: schedule ? schedule.dayOfWeek : undefined,
                rules: [{ required: true, message: 'When is required' }]
              })(
                <Select mode="multiple" style={{ maxWidth: 250 }}>
                  <Option value="mon">Monday</Option>
                  <Option value="tue">Tuesday</Option>
                  <Option value="wed">Wednesday</Option>
                  <Option value="thu">Thursday</Option>
                  <Option value="fri">Friday</Option>
                  <Option value="sat">Saturday</Option>
                  <Option value="sun">Sunday</Option>
                </Select>
              )}
            </FormItem>
          }

          { form.getFieldValue('frequency') === "monthly" &&
            <FormItem {...formItemLayout} label="When">
              { getFieldDecorator('dayOfMonth', {
                initialValue: schedule && schedule.dayOfMonth ? moment(schedule.dayOfMonth) : null,
                rules: [{ required: true, message: 'When is required' }]
              })(
                <DatePicker style={{ maxWidth: 250 }} format={'DD'}/>
              )}
            </FormItem>
          }

          { allowFutureStart &&
            <FormItem {...formItemLayout} label="Active between">
              { form.getFieldDecorator('dateRange', {
                initialValue: schedule ? [moment(schedule.startTime),moment(schedule.endTime)] : null
              })(
                <RangePicker 
                  showTime 
                  style={{ minWidth:"100%" }} 
                  disabledDate={this.disabledDate}
                  format="YYYY/MM/DD HH:mm:ss"
                />
              )}
            </FormItem>
          }

          { error && <Alert message={error} type="error"/>}
        </Form>
      </Modal>
    )
  }
}

const mapStateToProps = (state) => {
    const {
      visible, selectedId, schedule, allowFutureStart, error
    } = state.scheduler;
    
    return {
      visible, selectedId, schedule, allowFutureStart, error
    };
}

export default connect(mapStateToProps)(Form.create()(SchedulerModal))
