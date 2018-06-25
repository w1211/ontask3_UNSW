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

import formItemLayout from "../shared/FormItemLayout";

const FormItem = Form.Item;
const Option = Select.Option;
const confirm = Modal.confirm;

class SchedulerModal extends React.Component {
  state = { updateLoading: false, deleteLoading: false, error: null };

  handleOk = () => {
    const { form, onUpdate, selected, data, closeModal } = this.props;
    const { schedule } = data;

    form.validateFields((err, payload) => {
      if (err) return;

      // Format the time fields to be in UTC
      ["time", "startTime", "endTime", "dayOfMonth"].forEach(field => {
        if (field in payload && payload[field])
          payload[field] = payload[field].utc();
      });

      this.setState({ updateLoading: true, error: null });

      onUpdate({
        selected,
        payload,
        isCreate: !schedule,
        onError: error => this.setState({ updateLoading: false, error }),
        onSuccess: () => {
          this.setState({ updateLoading: false, error: null });
          form.resetFields();
          closeModal();
        }
      });
    });
  };

  handleCancel = () => {
    const { form, closeModal } = this.props;

    this.setState({ deleteLoading: false, updateLoading: false, error: null });
    form.resetFields();
    closeModal();
  };

  handleDelete = () => {
    const { form, selected, onDelete, closeModal } = this.props;

    confirm({
      title: "Confirm schedule removal",
      content: "Are you sure you want to remove the schedule?",
      okText: "Yes, remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        this.setState({ deleteLoading: true, error: null });

        onDelete({
          selected,
          onError: error => this.setState({ deleteLoading: false, error }),
          onSuccess: () => {
            this.setState({ deleteLoading: false, error: null });
            form.resetFields();
            closeModal();
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
    const { visible, data, form } = this.props;
    const { updateLoading, deleteLoading, error } = this.state;
    const { schedule } = data;

    const { getFieldDecorator, getFieldValue } = form;

    return (
      <Modal
        title={schedule ? "Update schedule" : "Create schedule"}
        visible={visible}
        onCancel={this.handleCancel}
        footer={
          schedule
            ? [
                <Button key="cancel" onClick={this.handleCancel}>
                  Cancel
                </Button>,

                <Button
                  key="delete"
                  type="danger"
                  onClick={this.handleDelete}
                  loading={deleteLoading}
                >
                  Delete
                </Button>,

                <Button
                  key="update"
                  type="primary"
                  onClick={this.handleOk}
                  loading={updateLoading}
                >
                  Update
                </Button>
              ]
            : [
                <Button key="cancel" onClick={this.handleCancel}>
                  Cancel
                </Button>,

                <Button
                  key="create"
                  type="primary"
                  onClick={this.handleOk}
                  loading={updateLoading}
                >
                  Create
                </Button>
              ]
        }
      >
        <Form layout="horizontal">
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

          {error && <Alert message={error} type="error" />}
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(SchedulerModal);
