import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Modal, Form, Input, Alert } from "antd";
import _ from "lodash";

import * as ContainerActionCreators from "./ContainerActions";

import formItemLayout from "../shared/FormItemLayout";

const FormItem = Form.Item;
const { TextArea } = Input;

class ContainerModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      ContainerActionCreators,
      dispatch
    );

    this.state = { loading: null, error: null };
  }

  handleOk = () => {
    const { form, selected, closeModal } = this.props;

    form.validateFields((err, payload) => {
      if (err) return;

      this.setState({ loading: true });

      const callFn = selected ? 'updateContainer' : 'createContainer';
      this.boundActionCreators[callFn]({
        containerId: selected && selected.id,
        payload,
        onError: error => this.setState({ loading: false, error }),
        onSuccess: () => {
          this.setState({ loading: false, error: null });
          form.resetFields();
          closeModal();
        }
      });
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

    const { getFieldDecorator } = form;

    return (
      <Modal
        visible={visible}
        title={selected ? "Update container" : "Create container"}
        okText={selected ? "Update" : "Create"}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          <FormItem {...formItemLayout} label="Code">
            {getFieldDecorator("code", {
              initialValue: selected ? selected.code : null,
              rules: [{ required: true, message: "Code is required" }]
            })(<Input />)}
          </FormItem>

          <FormItem {...formItemLayout} label="School">
            {getFieldDecorator("school", {
              initialValue: selected ? selected.school : null
            })(<Input />)}
          </FormItem>

          <FormItem {...formItemLayout} label="Faculty">
            {getFieldDecorator("faculty", {
              initialValue: selected ? selected.faculty : null
            })(<Input />)}
          </FormItem>

          <FormItem {...formItemLayout} label="Description">
            {getFieldDecorator("description", {
              initialValue: selected ? selected.description : null
            })(<TextArea rows={4} />)}
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
)(ContainerModal);
