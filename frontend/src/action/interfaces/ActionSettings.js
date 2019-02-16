import React from "react";
import apiRequest from "../../shared/apiRequest";
import {
  Button,
  Form,
  Input,
  Alert,
  Select,
  Tooltip,
  notification
} from "antd";
import _ from "lodash";

import formItemLayout from "../../shared/FormItemLayout";

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;

class ActionSettings extends React.Component {
  state = {};

  handleSave = () => {
    const { form, action, history, location, updateAction } = this.props;

    form.validateFields((err, payload) => {
      if (err) return;

      this.setState({ loading: true });

      const containerId = _.get(location, "state.containerId");
      if (containerId) payload.container = containerId;

      apiRequest(action ? `/workflow/${action.id}/` : "/workflow/", {
        method: action ? "PATCH" : "POST",
        payload,
        onSuccess: action => {
          notification["success"]({
            message: `Action ${action ? "updated" : "created"}`,
            description: `The action was successfully ${
              action ? "updated" : "created"
            }.`
          });
          this.setState({ loading: false });
          updateAction(action);
          if (!action)
            history.push({ pathname: `/action/${action.id}/settings` });
        },
        onError: () => {
          this.setState({ loading: false });
        }
      });
    });
  };

  render() {
    const { action, form, location } = this.props;
    const { loading, error } = this.state;

    const { getFieldDecorator } = form;

    const dataLabs = _.get(location, "state.dataLabs");

    return (
      <Form layout="horizontal" style={{ maxWidth: 500 }}>
        <FormItem {...formItemLayout} label="Name">
          {getFieldDecorator("name", {
            initialValue: _.get(action, "name"),
            rules: [{ required: true, message: "Name is required" }]
          })(<Input />)}
        </FormItem>

        <FormItem {...formItemLayout} label="Description">
          {getFieldDecorator("description", {
            initialValue: _.get(action, "description")
          })(<TextArea rows={4} />)}
        </FormItem>

        {action ? (
          <FormItem {...formItemLayout} label="DataLab">
            <Tooltip
              title={
                action
                  ? "DataLab cannot be modified after an action is created"
                  : ""
              }
            >
              <Select disabled={true} value={action.datalab_name} />
            </Tooltip>
          </FormItem>
        ) : (
          <FormItem {...formItemLayout} label="DataLab">
            {getFieldDecorator("datalab", {
              initialValue: _.get(action, "datalab"),
              rules: [{ required: !action, message: "DataLab is required" }]
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

        <Button type="primary" onClick={this.handleSave} loading={loading}>
          {action ? "Save" : "Submit"}
        </Button>
      </Form>
    );
  }
}

export default Form.create()(ActionSettings);
