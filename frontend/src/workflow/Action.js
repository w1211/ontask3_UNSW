import React from 'react';
import { Link, Route } from 'react-router-dom';
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

  componentDidMount() {
    const { match } = this.props;
  };
  
  render() {
    const { 
      form, emailLoading, emailError, emailSuccess, onSendEmail,
      emailSettings, details, workflowId
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

    //temporary put static page entry here, will integrate this part after current interface changing finished 
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
        <Divider/>
        <h3>Static Page</h3>
        <div>
        <Link to={`/staticPageHistoryStaff/${workflowId}/`}>
          Email history
        </Link>
        </div>
      </div>
)}}

export default Form.create()(Action)
