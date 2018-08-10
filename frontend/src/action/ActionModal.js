import React from "react";
import { withRouter } from "react-router";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Modal, Form, Input, Alert, Select, Tooltip } from "antd";
import _ from "lodash";

import * as ActionActionCreators from "./ActionActions";

import formItemLayout from "../shared/FormItemLayout";

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;

class ActionModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      ActionActionCreators,
      dispatch
    );

    this.state = { loading: false, error: null };
  }

  handleOk = () => {
    const { selected, form, data, closeModal, history } = this.props;

    form.validateFields((err, payload) => {
      if (err) return;

      const callFn = selected ? "updateAction" : "createAction";
      this.boundActionCreators[callFn]({
        containerId: data && data.containerId,
        actionId: selected && selected.id,
        payload,
        onError: error => this.setState({ loading: false, error }),
        onSuccess: action => {
          this.setState({ loading: false, error: null });
          form.resetFields();
          closeModal();
          // Redirect to action interface
          history.push({ pathname: `/action/${action.id}` });
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
    const { selected, visible, form, data } = this.props;
    const { loading, error } = this.state;
    const { getFieldDecorator } = form;

    const dataLabs = _.get(data, "dataLabs", []);

    return (
      <Modal
        visible={visible}
        title={selected ? "Update action" : "Create action"}
        okText={selected ? "Update" : "Create"}
        onCancel={this.handleCancel}
        onOk={this.handleOk}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          <FormItem {...formItemLayout} label="Name">
            {getFieldDecorator("name", {
              initialValue: _.get(selected, "name"),
              rules: [{ required: true, message: "Name is required" }]
            })(<Input />)}
          </FormItem>

          <FormItem {...formItemLayout} label="Description">
            {getFieldDecorator("description", {
              initialValue: _.get(selected, "description")
            })(<TextArea rows={4} />)}
          </FormItem>

          {selected ? (
            <FormItem {...formItemLayout} label="DataLab">
              <Tooltip
                title={
                  selected
                    ? "DataLab cannot be modified after an action is created"
                    : ""
                }
              >
                <Select disabled={true} value={selected.datalab} />
              </Tooltip>
            </FormItem>
          ) : (
            <FormItem {...formItemLayout} label="DataLab">
              {getFieldDecorator("datalab", {
                initialValue: _.get(selected, "datalab"),
                rules: [
                  { required: !selected, message: "DataLab is required" }
                ]
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
          )}

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
)(ActionModal);
