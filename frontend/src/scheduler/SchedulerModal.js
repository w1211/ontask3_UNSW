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
      this.state = {
        frequencyUnit: "day",
        update: false
      };
    }

    handleOk = () =>{
        const { form } = this.props;
        form.validateFields((err, values) => {
            let data = {
                frequency: this.state.frequency,
                frequencyUnit: this.state.frequencyUnit,
                time: values.timePicker.format(),
                startDate: values.dateRange[0].format(),
                endDate:values.dateRange[1].format(),
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

    onUpdate = () => {
        this.setState({update: !this.state.update});
    }

    onDelete = () => {
        this.boundActionCreators.deleteSchedule(this.props.datasourceId);
    }


    optionOnChange = (name, value) => {
        this.setState({[name]: value});
    }
    //TODO: format the schedule display
    render() {
        const {form, visible, datasourceId, schedule} = this.props;
        const {frequencyUnit, update} = this.state;
        const {getFieldDecorator} = form;
        return(
    <Modal
        title='Scheduler'
        visible={visible}
        onCancel={() => { form.resetFields(); this.boundActionCreators.closeSchedulerModal(); }}
        onOk={this.handleOk}
    >
        { schedule &&
            <div>
            <h3 style={{marginBottom:"1em"}}>Current schedule</h3>
            <div style={{ background: '#eeeeee', padding: '1em', margin: '0.5em 0', border: '1px dashed #cccccc', borderRadius: '5px', display: 'block' }}>
                <span style={{position: "relative", float: "right", zIndex: "2"}}>
                <Tooltip title="Update current schedule">
                <Button shape="circle" icon="edit" size="small" style={{marginRight: '0.5em'}} onClick={this.onUpdate}/>
                </Tooltip>
                <Tooltip title="Delete current schedule">
                <Button type="danger" icon="delete" shape="circle" size="small" onClick={this.onDelete}/>
                </Tooltip>
                </span>
                <Row gutter={8}>
                    <Col span={5} ><h4>Start Date: </h4></Col>
                    <Col span={10} >{moment(schedule.startDate).format("YYYY-MM-DD")}</Col>
                </Row>
                <Row gutter={8}>
                    <Col span={5} ><h4>End Date: </h4></Col>
                    <Col span={10} >{moment(schedule.endDate).format("YYYY-MM-DD")}</Col>
                </Row>
                <Row gutter={8}>
                    <Col span={5} ><h4>Time: </h4></Col>
                    <Col span={10} >{moment(schedule.time).format("HH:mm")}</Col>
                </Row>
                <Row gutter={8}>
                    <Col span={5} ><h4>Frequency: </h4></Col>
                    <Col span={10} >Every {schedule.frequency} {schedule.frequencyUnit}</Col>
                </Row>
                {schedule.frequencyUnit == "week" && 
                <Row gutter={8}>
                    <Col span={5} ><h4>DayOfWeek: </h4></Col>
                    <Col span={10} >{schedule.dayOfWeek}</Col>
                </Row>
                }
                {schedule.frequencyUnit == "month" && 
                <Row gutter={8}>
                    <Col span={5} ><h4>DayOfMonth: </h4></Col>
                    <Col span={10} >{moment(schedule.dayOfMonth).format("DD")}</Col>
                </Row>
                }
            </div>
            </div>
        }
        { (update && schedule) && <Divider/>}
        { (update || !schedule) &&
            <Form layout="horizontal">
            <h3 style={{marginBottom:"1em"}}>Update schedule</h3>
                <FormItem {...formItemLayout} label="Time">
                    {getFieldDecorator('timePicker', {
                        rules: [{ required: true, message: 'Time is required' }]
                    })(
                    <TimePicker style = {{ width: '50%'}} format={'HH:mm'}/>
                    )}
                </FormItem>
                <FormItem {...formItemLayout} label="Frequency">
                    {getFieldDecorator('Frequency', {
                    rules: [{ required: true, message: 'Frequency is required' }]
                    })(
                    <span>
                    Every
                    <InputNumber min={1} max={100} style = {{ width:'25%', marginRight:'2%', marginLeft:'2%'}} onChange={(value) => {this.optionOnChange("frequency", value)}}/>
                    <Select defaultValue="day" style = {{ width: '30%'}} onChange={(value) => {this.optionOnChange("frequencyUnit", value)}}>
                        <Option value="day">day</Option>
                        <Option value="week">week</Option>
                        <Option value="month">month</Option>
                    </Select>
                    </span>
                    )}
                </FormItem>
                { frequencyUnit == "week" &&
                    <FormItem {...formItemLayout} label="DayOfWeek">
                    {getFieldDecorator('dayOfWeek', {
                        rules: [{ required: true, message: 'Day is required' }]
                        })(
                        <Select defaultValue="Monday">
                            <Option value="Monday">Monday</Option>
                            <Option value="Tuesday">Tuesday</Option>
                            <Option value="Wednesday">Wednesday</Option>
                            <Option value="Thursday">Thursday</Option>
                            <Option value="Friday">Friday</Option>
                        </Select>
                    )}
                    </FormItem>
                }
                { frequencyUnit == "month" &&
                    <FormItem {...formItemLayout} label="DayOfMonth">
                    {getFieldDecorator('dayOfMonth', {
                        rules: [{ required: true, message: 'Day is required' }]
                        })(
                            <DatePicker format={'DD'}/>
                    )}
                    </FormItem>
                }
                <FormItem {...formItemLayout} label="DateRange">
                    {form.getFieldDecorator('dateRange', {
                        rules: [{ required: true, message: 'Date range is required' }]
                    })(
                        <RangePicker style={{minWidth:"100%"}}/>
                    )}
                </FormItem>
            </Form>
        }
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