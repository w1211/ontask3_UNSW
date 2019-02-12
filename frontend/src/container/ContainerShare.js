import React from "react";
import { Modal, Form, Select, Alert, Button, notification } from "antd";
import _ from "lodash";

import apiRequest from "../shared/apiRequest";

const FormItem = Form.Item;

class ContainerShare extends React.Component {
  state = { loading: null, error: null };

  validateEmail = values => {
    const { form } = this.props;
    const value = values[values.length - 1];

    if (!value) return;

    const isValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
    if (!isValid) {
      form.setFieldsValue({ sharing: values.pop() });
      notification["error"]({
        message: "Invalid email",
        description: "The provided email was invalid."
      });
    }
  };

  handleOk = () => {
    const { form, selected, closeModal, fetchDashboard } = this.props;

    const payload = form.getFieldsValue();
    this.setState({ loading: true });

    apiRequest(`/container/${selected.id}/`, {
      method: "PATCH",
      payload,
      onSuccess: () => {
        notification["success"]({
          message: "Container sharing updated"
        });
        this.setState({ loading: false, error: null });
        form.resetFields();
        closeModal();
        fetchDashboard();
      },
      onError: () => {
        notification["error"]({
          message: "Failed to update sharing"
        });
        this.setState({ loading: false, error: null });
      }
    });
  };

  handleCancel = () => {
    const { form, closeModal } = this.props;

    this.setState({ loading: null, error: null });
    form.resetFields();
    closeModal();
  };

  render() {
    const { visible, selected, form } = this.props;
    const { loading, error } = this.state;

    const { getFieldDecorator, setFieldsValue } = form;

    return (
      <Modal
        visible={visible}
        title="Share container"
        okText="Update"
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          <FormItem label="Access granted">
            {getFieldDecorator("sharing", {
              initialValue: selected && selected.sharing ? selected.sharing : []
            })(
              <Select
                mode="tags"
                dropdownStyle={{ display: "none" }}
                placeholder="Grant access to this container by entering a user's email"
                onChange={this.validateEmail}
              />
            )}

            <Button
              className="clear"
              size="small"
              onClick={() => setFieldsValue({ sharing: [] })}
              onChange={e => this.validateEmail(e, "sharing")}
            >
              Clear
            </Button>
          </FormItem>

          {error && <Alert message={error} type="error" />}
        </Form>
      </Modal>
    );
  }
}

export default Form.create()(ContainerShare);
