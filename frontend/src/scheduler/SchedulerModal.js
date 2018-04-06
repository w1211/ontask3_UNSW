import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Input, Alert, Select, DatePicker, 
        Button, Row, InputNumber, TimePicker, Tooltip, Divider, Col } from 'antd';
import formItemLayout from '../shared/FormItemLayout';
import * as SchedulerActionCreators from './SchedulerActions';
import moment from 'moment';


const FormItem = Form.Item;
const Option = Select.Option;
const {WeekPicker, RangePicker} = DatePicker;
const LOCAL_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

class SchedulerModal extends React.Component {
    constructor(props) {
      super(props);
      const { dispatch } = props;
      this.boundActionCreators = bindActionCreators(SchedulerActionCreators, dispatch);
    }

    checkFields = (rule, value, callback) => {
        // If the provided value is already in the list of fields for this view, then show an error
        if (value!=parseInt(value,10)) {
          callback('Input must be integer');
        }
        // Otherwise return no errors
        callback();
        return;
    };

    handleOk = (form) =>{
        form.validateFields((err, values) => {
            if (err) return;
            let data = {
                frequency: this.state.frequency,
                frequencyUnit: this.state.frequencyUnit,
                time: values.timePicker.format(),
                startTime: values.dateRange[0].format(),
                endTime:values.dateRange[1].format(),
            };
            if(this.state.frequencyUnit=='week'){
                data.dayOfWeek = values.dayOfWeek;
            }
            else if(this.state.frequencyUnit=='month'){
                data.dayOfMonth = values.dayOfMonth.format();
            }
        this.boundActionCreators.createSchedule(this.props.datasourceId, data);
        })
    }


    onDelete = () => {
        this.boundActionCreators.deleteSchedule(this.props.datasourceId);
    }

    optionOnChange = (name, value) => {
        this.setState({[name]: value});
    }

    // User can not select days before today, today and one year after
    disabledDate = (current) => {
        if (current < moment().endOf('day') || current > moment().add(1,'y')){
            return true;
        }
        return false;
    }

    onCancel= (form) => { form.resetFields(); this.boundActionCreators.closeSchedulerModal(); }

    //TODO: format the schedule display
    render() {
        const {form, visible, datasourceId, schedule, scheduleType} = this.props;
        const {getFieldDecorator} = form;
        const suffix = scheduleType=="email" ? null : form.getFieldValue('frequency') == "1"? "day" : "days";
        
        return(
    <Modal
        title='Scheduler'
        visible={visible}
        onCancel={()=>this.onCancel(form)}
        footer = {schedule ? [
            <Button onClick={()=>this.onCancel(form)}>Cancel</Button>, 
            <Button type="danger" onClick={this.onDelete}>Delete</Button>, 
            <Button type="primary" onClick={()=>this.handleOk(form)}>Update</Button>]
        :
            [<Button onClick={()=>this.onCancel(form)}>Cancel</Button>, 
            <Button type="primary" onClick={()=>this.handleOk(form)}>Create</Button>]}        
    >
        <Form layout="horizontal">
        <h3 style={{marginBottom:"1em"}}>Create schedule</h3>
        <FormItem {...formItemLayout} label="Time">
            {getFieldDecorator('timePicker', {
                initialValue: schedule ? moment(schedule.time) : null,
                rules: [{ required: true, message: 'Time is required' }]
            })(
            <TimePicker style = {{ width: '50%'}} format={'HH:mm'}/>
            )}
        </FormItem>
        <FormItem {...formItemLayout} label="Frequency">
            {getFieldDecorator('frequency', {
                initialValue: schedule ? schedule.frequency : null,
                rules: [{ required: true, message: 'Frequency is required' },
                        { validator: this.checkFields } ]
            })(
            <Input style = {{ width:'50%'}} suffix={suffix}/>
            )}
        </FormItem>
        {scheduleType=="email" &&
        <div>
        <FormItem {...formItemLayout} label="Frequency unit">
            {getFieldDecorator('frequencyUnit', {
                initialValue: schedule ? schedule.frequencyUnit : null,
                rules: [{ required: true, message: 'Frequency unit is required' }]
            })(
            <Select defaultValue="day" style = {{ width: '50%'}} onChange={(value) => {this.optionOnChange("frequencyUnit", value)}}>
                <Option value="day">
                {form.getFieldValue('frequency') == "1"? "day" : "days"}</Option>
                {scheduleType=="email" &&
                    <div>
                    <Option value="week">week</Option>
                    <Option value="month">month</Option>
                    </div>
                }
            </Select>
            )}
        </FormItem>
        
        { form.getFieldValue('frequencyUnit') == "week" &&
            <FormItem {...formItemLayout} label="DayOfWeek">
            {getFieldDecorator('dayOfWeek', {
                initialValue: schedule ? schedule.dayOfWeek : null,
                rules: [{ required: true, message: 'Day is required' }]
                })(
                <Select mode="multiple">
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
        { form.getFieldValue('frequencyUnit') == "month" &&
            <FormItem {...formItemLayout} label="DayOfMonth">
            {getFieldDecorator('dayOfMonth', {
                initialValue: schedule ? moment(schedule.dayOfMonth).format('DD') : null,
                rules: [{ required: true, message: 'Day is required' }]
                })(
                    <DatePicker format={'DD'} disabledDate={this.disabledDate}/>
            )}
            </FormItem>
        }
        
            <FormItem {...formItemLayout} label="DateRange">
                {form.getFieldDecorator('dateRange', {
                    initialValue: schedule ? [moment(schedule.startTime),moment(schedule.endTime)] : null,
                    rules: [{ required: true, message: 'Date range is required' }]
                })(
                    <RangePicker 
                        showTime 
                        style={{minWidth:"100%"}} 
                        disabledDate={this.disabledDate}
                        format="YYYY/MM/DD HH:mm:ss"
                    />
                )}
            </FormItem>
            </div>
        }
    </Form>
</Modal>
        )
    }
}

const mapStateToProps = (state) => {
    const {
      visible, datasourceId, schedule
    } = state.scheduler;
    
    return {
      visible, datasourceId, schedule
    };
}

export default connect(mapStateToProps)(Form.create()(SchedulerModal))