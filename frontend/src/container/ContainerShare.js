import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Modal, Form, Select, Alert, Button, notification } from "antd";
import _ from "lodash";

import * as ContainerActionCreators from "./ContainerActions";

const FormItem = Form.Item;

class ContainerShare extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      ContainerActionCreators,
      dispatch
    );

    this.state = { loading: null, error: null };
  }

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
    const { form, selected, closeModal } = this.props;

    const payload = form.getFieldsValue();
    this.setState({ loading: true });

    this.boundActionCreators.updateContainer({
      containerId: selected.id,
      payload,
      onError: error => this.setState({ loading: false, error }),
      onSuccess: () => {
        this.setState({ loading: false, error: null });
        form.resetFields();
        closeModal();
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

    const { getFieldDecorator, getFieldsValue, resetFields } = form;
    const { sharing } = getFieldsValue();

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

            {sharing &&
              sharing.length > 0 && (
                <Button
                  className="clear"
                  size="small"
                  onClick={() => resetFields("sharing")}
                  onChange={e => this.validateEmail(e, "sharing")}
                >
                  Clear
                </Button>
              )}
          </FormItem>

          {error && <Alert message={error} type="error" />}
        </Form>
      </Modal>
    );
  }
}

export default _.flow(
  connect(),
  Form.create()
)(ContainerShare);
