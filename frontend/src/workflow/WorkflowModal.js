import React from "react";
import { withRouter } from "react-router";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Modal, Form, Input, Alert, Select } from "antd";
import _ from "lodash";

import * as WorkflowActionCreators from "./WorkflowActions";

import formItemLayout from "../shared/FormItemLayout";

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;

class WorkflowModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      WorkflowActionCreators,
      dispatch
    );

    this.state = { loading: false, error: null };
  }

  handleOk = () => {
    const { form, data, closeModal, history } = this.props;
    const { containerId } = data;

    form.validateFields((err, payload) => {
      if (err) return;

      this.boundActionCreators.createAction({
        containerId,
        payload,
        onError: error => this.setState({ loading: false, error }),
        onSuccess: (action) => {
          this.setState({ loading: false, error: null });
          form.resetFields();
          closeModal();
          // Redirect to workflow interface
          history.push({ pathname: `/workflow/${action.id}` });
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
    const { visible, form, data } = this.props;
    const { loading, error } = this.state;

    const dataLabs = _.get(data, 'dataLabs', []);

    return (
      <Modal
        visible={visible}
        title="Create action"
        okText="Create"
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          <FormItem {...formItemLayout} label="Name">
            {form.getFieldDecorator("name", {
              rules: [{ required: true, message: "Name is required" }]
            })(<Input />)}
          </FormItem>

          <FormItem {...formItemLayout} label="Description">
            {form.getFieldDecorator("description")(<TextArea rows={4} />)}
          </FormItem>

          <FormItem {...formItemLayout} label="DataLab">
            {form.getFieldDecorator("datalab", {
              rules: [{ required: true, message: "DataLab is required" }]
            })(
              <Select>
                {dataLabs &&
                  dataLabs.map((dataLab, i) => {
                    return (
                      <Option value={dataLab.id} key={i}>
                        {dataLab.name}
                      </Option>
                    );
                  })}
              </Select>
            )}
          </FormItem>

          {error && <Alert message={error} type="error" />}
        </Form>
      </Modal>
    );
  }
}

export default _.flow(
  withRouter,
  connect(),
  Form.create()
)(WorkflowModal);
