import React from "react";
import {
  Modal,
  Form,
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
    const { form, onUpdate, onSuccess, closeModal } = this.props;

    form.validateFields((err, payload) => {
      if (err) return;

      // Format the time fields to be in UTC
      ["time", "active_from", "active_to", "day_of_month"].forEach(field => {
        if (field in payload && payload[field])
          payload[field] = payload[field].utc();
      });

      this.setState({ updateLoading: true, error: null });

      onUpdate({
        payload,
        onError: error => this.setState({ updateLoading: false, error }),
        onSuccess: response => {
          this.setState({ updateLoading: false, error: null });
          form.resetFields();
          if (onSuccess) onSuccess(response);
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
    const { form, onDelete, onSuccess, closeModal } = this.props;

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
          onSuccess: response => {
            this.setState({ deleteLoading: false, error: null });
            form.resetFields();
            if (onSuccess) onSuccess(response);
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

          {getFieldValue("frequency") === "weekly" && (
            <FormItem {...formItemLayout} label="When">
              {getFieldDecorator("day_of_week", {
                initialValue: schedule ? schedule.day_of_week : [],
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
              {getFieldDecorator("day_of_month", {
                initialValue:
                  schedule && schedule.day_of_month
                    ? moment.utc(schedule.day_of_month).local()
                    : null,
                rules: [{ required: true, message: "When is required" }]
              })(<DatePicker format={"Do"} />)}
            </FormItem>
          )}

          <FormItem {...formItemLayout} label="Active from">
            {getFieldDecorator("active_from", {
              initialValue:
                schedule && schedule.active_from
                  ? moment.utc(schedule.active_from).local()
                  : undefined
            })(<DatePicker showTime format="DD/MM/YYYY HH:mm" />)}
          </FormItem>

          <FormItem {...formItemLayout} label="Active to">
            {getFieldDecorator("active_to", {
              initialValue:
                schedule && schedule.active_to
                  ? moment.utc(schedule.active_to).local()
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
