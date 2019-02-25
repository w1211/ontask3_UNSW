import React, { Component } from "react";
import { Spin, Form, Select, Switch, notification, Button } from "antd";
import apiRequest from "../../shared/apiRequest";
import SchedulerModal from "../../scheduler/SchedulerModal";

import moment from "moment";

class DataLabDump extends Component {
  state = {
    dataLabs: [],
    fetching: true,
    scheduler: { visible: false, selected: null, data: {} }
  };

  componentDidMount() {
    this.getDataLabs();
  }

  getDataLabs = () => {
    const { history, showNavigation } = this.props;

    apiRequest(`/administration/dump/`, {
      method: "GET",
      onSuccess: res => {
        this.setState({ ...res, fetching: false });
        showNavigation();
      },
      onError: (error, status) => {
        if (status === 403) {
          history.replace("/forbidden");
        } else {
          this.setState({ fetching: false });
        }
      }
    });
  };

  saveDumpSettings = forceDump => {
    const { form } = this.props;

    form.validateFields((err, payload) => {
      if (err) return;

      this.setState({ [forceDump ? "dumping" : "loading"]: true });

      apiRequest(`/administration/dump/${forceDump ? "?force=true" : ""}`, {
        method: "PUT",
        payload: { scheduled: payload.scheduled, datalabs: payload.dump },
        onSuccess: () => {
          notification["success"]({
            message: forceDump
              ? "Data dumped successfully"
              : "Settings successfully updated"
          });
          this.setState({ [forceDump ? "dumping" : "loading"]: false });
        },
        onError: () => {
          notification["error"]({
            message: forceDump
              ? "Failed to dump data"
              : "Failed to update settings"
          });
          this.setState({ [forceDump ? "dumping" : "loading"]: false });
        }
      });
    });
  };

  render() {
    const { form } = this.props;
    const {
      containers,
      dump,
      last_run,
      scheduled,
      scheduler,
      loading,
      dumping
    } = this.state;
    const { getFieldDecorator } = form;

    console.log(this.state);

    return this.state.fetching ? (
      <Spin size="large" />
    ) : (
      <div>
        <h2>DataLabs S3 dump</h2>

        <Form.Item label="Scheduled">
          {getFieldDecorator("scheduled", {
            initialValue: scheduled,
            valuePropName: "checked"
          })(<Switch />)}
        </Form.Item>

        <Form.Item label="DataLabs to dump">
          {getFieldDecorator("dump", {
            initialValue: dump
          })(
            <Select mode="multiple" style={{ maxWidth: 500, width: "100%" }}>
              {containers &&
                Object.entries(containers).map(
                  ([container, dataLabs], index) => (
                    <Select.OptGroup label={container} key={index}>
                      {dataLabs.map(dataLab => (
                        <Select.Option value={dataLab.id} key={dataLab.id}>
                          {dataLab.name}
                        </Select.Option>
                      ))}
                    </Select.OptGroup>
                  )
                )}
            </Select>
          )}
        </Form.Item>

        <SchedulerModal
          {...scheduler}
          onUpdate={this.updateSchedule}
          onDelete={this.deleteSchedule}
          closeModal={this.closeSchedulerModal}
        />

        <div style={{ marginBottom: 10 }}>
          <strong>Last dumped:</strong>{" "}
          {last_run
            ? moment
                .utc(last_run)
                .local()
                .format("YYYY/MM/DD HH:mm")
            : "never"}
        </div>

        <div>
          <Button
            loading={dumping}
            onClick={() => this.saveDumpSettings(true)}
            style={{ marginRight: 10 }}
          >
            Dump now
          </Button>

          <Button
            type="primary"
            loading={loading}
            onClick={() => this.saveDumpSettings()}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }
}

export default Form.create()(DataLabDump);
