import React from 'react';
import { Form, Divider, Button, Select, DatePicker, InputNumber, Row, Col, TimePicker, Popover, Modal, Input, Alert, notification } from 'antd';

const confirm = Modal.confirm;
const { RangePicker } = DatePicker;
const Option = Select.Option;
const FormItem = Form.Item;

class Action extends React.Component {
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     update: false
  //   };
  // }

  handleSubmit = () => {
    const { form, onSendEmail } = this.props;
    form.validateFieldsAndScroll((err, values) => {
      if (err) return;
      onSendEmail(values);
    });
  }

  // updateSchedule = () => {
  //   this.setState({update: !this.state.update});
  // }

  // confirmScheduleDelete = () => {
  //   let deleteSchedule = this.props.onDelete;
  //   confirm({
  //     title: 'Confirm schedule deletion',
  //     okText: 'Continue with deletion',
  //     okType: 'danger',
  //     cancelText: 'Cancel',
  //     onOk() {
  //       deleteSchedule();
  //     }
  //   });
  // }

  componentWillReceiveProps(nextProps) {
    if (nextProps.emailSuccess) {
      notification['success']({
        message: 'Emails sent',
        description: 'All emails have been successfully sent.'
      });
    }
  }
  
  render() {
    const { 
      form, emailLoading, emailError, emailSuccess, onSendEmail,
      emailSettings, details
    } = this.props;

    const options = [];
    if (details) {
      options.push(details.primaryColumn.field);
      details.secondaryColumns.map(secondaryColumn => {
        options.push(secondaryColumn.field);
      });
    }
    
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 4 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 20 },
      },
    };

    // const { getFieldDecorator } = this.props.form;
    // const { currentSchedule } = this.props;
    // const actions = {
    //   edit: "Edit",
    //   delete: "Delete",
    // };
    // const formItemLayout = {
    //   labelCol: {
    //     xs: { span: 24 },
    //     sm: { span: 8 },
    //   },
    //   wrapperCol: {
    //     xs: { span: 24 },
    //     sm: { span: 16 },
    //   },
    // };
    // const panelLayout = {
    //   padding: '20px 50px 20px 20px',
    //   background: '#fbfbfb',
    //   border: '1px solid #d9d9d9',
    //   borderRadius: '6px',
    //   maxWidth: '800px',
    //   marginBottom: '20px'
    // };

    return (
      <div>
        <h3>Email</h3>

        <Form layout="horizontal">
          <FormItem
            {...formItemLayout}
            label="Subject"
            style={{ maxWidth: 750 }}
          >
            {form.getFieldDecorator('subject', {
              initialValue: emailSettings ? emailSettings.subject : null
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="Email field"
            style={{ maxWidth: 750 }}
          >
            {form.getFieldDecorator('field', {
              initialValue: emailSettings ? emailSettings.field : null,
              rules: [{ required: true, message: 'Email field is required' }]
            })(
              <Select>
                { options.map((option) => {
                  return <Option value={option} key={option}>{option}</Option>
                })}
              </Select>
            )}
          </FormItem>
          { emailError && <Alert style={{ display: 'inline-block' }} message={emailError} type="error"/>}
        </Form>
        <div style={{ marginTop: '10px' }}>
          <Button loading={emailLoading} type="primary" size="large" onClick={() => { this.handleSubmit() }}>Send once-off email</Button>
        </div>
        {/* <Divider dashed />

        <h3>URL</h3> */}


        {/* { currentSchedule ?
          <div>
          <h3>Current Schedule</h3>
          <Row style={{ background: '#fafafa', padding: '10px 10px 0px 10px', "border-bottom": '1px solid #e8e8e8'}}>
            <Col className="gutter-row" span={6}>
              <h4>Date range:</h4>
            </Col>
            <Col span={5}>
              <h4>Time:</h4>
            </Col>
            <Col className="gutter-row" span={5}>
              <h4>Frequency:</h4>
            </Col>
            <Col className="gutter-row" span={6}>
              <h4>Actions:</h4>
            </Col>
          </Row>
          <Row type="flex" align="middle" style={{ padding: '5px 10px', "border-bottom": '1px solid #e8e8e8', hight:'100px'}}>
            <Col className="gutter-row" span={6}>
              {currentSchedule["startDate"]} ~ {currentSchedule["endDate"]}
            </Col>
            <Col className="gutter-row" span={5}>
              At {currentSchedule["time"]}
            </Col>
            <Col className="gutter-row" span={5}>
              Every
              {currentSchedule["frequency"]===1?
                " day"
              :
                " "+currentSchedule["frequency"]+" days"
              }
            </Col>
            <Col className="gutter-row" span={6}>
              <Popover content={actions.edit} trigger="hover">
                <Button onClick={this.updateSchedule} style={{ marginRight: '10px' }} icon="edit" shape="circle"/>
              </Popover>
              <Popover content={actions.delete} trigger="hover">
                <Button onClick={this.confirmScheduleDelete} icon="delete" type="danger" shape="circle"/>
              </Popover>
            </Col>
          </Row>
        </div>
      :
      <div></div>
    }
    { this.state.update && currentSchedule && <Divider dashed /> }
    { this.state.update || !currentSchedule ?
      <div>
        <h3>New Schedule</h3>
        <Form style={{...panelLayout}}>
          <FormItem
            label="DateRange"
            {...formItemLayout}
          >
            {getFieldDecorator('RangePicker', {
              rules: [{ required: true, message: 'Date range is required' }]
            })(
              <RangePicker onChange={this.onDateChange}/>
            )}
          </FormItem>
          <FormItem
            label="Time"
            {...formItemLayout}>
            {getFieldDecorator('TimePicker', {
              rules: [{ required: true, message: 'Time is required' }]
            })(
              <TimePicker format='HH:mm' onChange={this.onTimeChange}/>
            )}
          </FormItem>
          <FormItem
            label="Frequency"
            {...formItemLayout}
          >
            {getFieldDecorator('Frequency', {
              rules: [{ required: true, message: 'Frequency is required' }]
            })(
              <span>
                <InputNumber min={1} max={1000} style = {{ width: '15%', marginRight: '2%' }}/>
                <Select
                  defaultValue="day"
                  style = {{ width: '20%'}}
                >
                  <Option value="day">day</Option>
                </Select>
              </span>
            )}
          </FormItem>
          <FormItem
            wrapperCol={{
              xs: { span: 24, offset: 0 },
              sm: { span: 16, offset: 8 },
            }}
          >
            <Button style = {{ marginRight: '2%' }}>Preview</Button>
            <Button type="primary" onClick={this.handleSubmit}>Schedule</Button>
          </FormItem>
        </Form>
      </div>
        :
      <div></div>
} */}
      </div>
)}}

export default Form.create()(Action)
