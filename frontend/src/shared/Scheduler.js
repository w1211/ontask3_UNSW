import React from "react";
import {
  Modal,
  Form,
  Input,
  Alert,
  Select,
  DatePicker,
  Button,
  TimePicker
} from "antd";
import moment from "moment";

import formItemLayout from "./FormItemLayout";

const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;

class Scheduler extends React.Component {
  state = { updateLoading: false, deleteLoading: false, error: null };

  handleOk = () => {
    const { form, onUpdate } = this.props;

    form.validateFields((err, payload) => {
      if (err) return;

      this.setState({ updateLoading: true, error: null });

      onUpdate({
        payload,
        onError: error => this.setState({ updateLoading: false, error }),
        onSuccess: () => {
          this.setState({ updateLoading: false, error: null });
          form.resetFields();
        }
      });
    });
  };

  handleDelete = () => {
    const { form, onDelete } = this.props;

    confirm({
      title: "Confirm schedule removal",
      content: "Are you sure you want to remove the schedule?",
      okText: "Yes, remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({ deleteLoading: true, error: null });

        onDelete({
          onError: error => this.setState({ deleteLoading: false, error }),
          onSuccess: () => {
            this.setState({ deleteLoading: false, error: null });
            form.resetFields();
          }
        });
      }
    });
  };

  // User can not select days before today, today and one year after
  disabledDate = current => {
    if (current < moment().startOf("day") || current > moment().add(1, "y")) {
      return true;
    }
    return false;
  };

  render() {
    const { form, schedule } = this.props;
    const { updateLoading, deleteLoading, error } = this.state;

    const { getFieldDecorator, getFieldValue } = form;

    return (
      <Form layout="horizontal" style={{ maxWidth: 500, overflow: "hidden" }}>
        <FormItem {...formItemLayout} label="Time">
          {getFieldDecorator("time", {
            initialValue: schedule ? moment.utc(schedule.time).local() : null,
            rules: [{ required: true, message: "Time is required" }]
          })(<TimePicker format={"HH:mm"} />)}
        </FormItem>

        <FormItem {...formItemLayout} label="Frequency">
          {getFieldDecorator("frequency", {
            initialValue: schedule ? schedule.frequency : null,
            rules: [{ required: true, message: "Frequency is required" }]
          })(
            <Select>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          )}
        </FormItem>

        {getFieldValue("frequency") === "daily" && (
          <FormItem {...formItemLayout} label="When">
            {getFieldDecorator("dayFrequency", {
              initialValue:
                schedule && schedule.dayFrequency
                  ? schedule.dayFrequency.toString()
                  : null,
              rules: [
                { required: true, message: "When is required" },
                { pattern: "^[1-9][0-9]*$", message: "Must be an integer" }
              ]
            })(
              <Input
                addonBefore="Every"
                addonAfter={
                  form.getFieldValue("dayFrequency") > 1 ? "days" : "day"
                }
              />
            )}
          </FormItem>
        )}

        {getFieldValue("frequency") === "weekly" && (
          <FormItem {...formItemLayout} label="When">
            {getFieldDecorator("dayOfWeek", {
              initialValue: schedule ? schedule.dayOfWeek : [],
              rules: [{ required: true, message: "When is required" }]
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
        )}

        {getFieldValue("frequency") === "monthly" && (
          <FormItem {...formItemLayout} label="When">
            {getFieldDecorator("dayOfMonth", {
              initialValue:
                schedule && schedule.dayOfMonth
                  ? moment.utc(schedule.dayOfMonth).local()
                  : null,
              rules: [{ required: true, message: "When is required" }]
            })(<DatePicker format={"Do"} />)}
          </FormItem>
        )}

        <FormItem {...formItemLayout} label="Active from">
          {getFieldDecorator("startTime", {
            initialValue:
              schedule && schedule.startTime
                ? moment.utc(schedule.startTime).local()
                : undefined
          })(<DatePicker showTime format="DD/MM/YYYY HH:mm" />)}
        </FormItem>

        <FormItem {...formItemLayout} label="Active to">
          {getFieldDecorator("endTime", {
            initialValue:
              schedule && schedule.endTime
                ? moment.utc(schedule.endTime).local()
                : undefined
          })(<DatePicker showTime format="DD/MM/YYYY HH:mm" />)}
        </FormItem>

        <div>
          {schedule && (
            <Button
              key="delete"
              type="danger"
              onClick={this.handleDelete}
              loading={deleteLoading}
              style={{ marginRight: 10 }}
            >
              Delete
            </Button>
          )}

          <Button
            type="primary"
            onClick={this.handleOk}
            loading={updateLoading}
          >
            {schedule ? "Update" : "Submit"}
          </Button>
        </div>

        {error && <Alert message={error} type="error" />}
      </Form>
    );
  }
}

export default Form.create()(Scheduler);
