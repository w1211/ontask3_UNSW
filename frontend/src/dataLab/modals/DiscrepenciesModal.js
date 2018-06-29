import React from "react";
import { Modal, Icon, Table, Radio, Form } from "antd";
import _ from "lodash";

const RadioGroup = Radio.Group;

class DiscrepenciesModal extends React.Component {
  handleOk = () => {
    const { form, onResolve, closeDiscrepenciesModal } = this.props;

    form.validateFields((err, values) => {
      if (err) return;

      onResolve(values);
      closeDiscrepenciesModal();
    });
  };

  handleCancel = () => {
    const { form, onCancel, closeDiscrepenciesModal } = this.props;

    form.resetFields();
    if (onCancel) onCancel();
    closeDiscrepenciesModal();
  };

  render() {
    const { visible, form, discrepencies, datasource } = this.props;

    if (!discrepencies) return null;

    return (
      <Modal
        className="discrepencies"
        visible={visible}
        title={
          <div className="title">
            <Icon type="exclamation-circle" />
            Resolve Match Conflict
          </div>
        }
        onCancel={this.handleCancel}
        onOk={this.handleOk}
      >
        <p>
          Record mismatches have been detected between this datasource ({
            datasource
          }) and the DataLab. How should these discrepencies be handled?
        </p>

        {discrepencies.primary && (
          <div className="conflict">
            <p>
              The following records occur in this datasource but not in the
              DataLab:
            </p>

            <Table
              size="small"
              pagination={{ size: "small", pageSize: 5 }}
              dataSource={discrepencies.primary.map((record, index) => ({
                key: index,
                record: record
              }))}
              columns={[
                { title: "Record", dataIndex: "record", key: "record" }
              ]}
            />
            {form.getFieldDecorator(`primary`, {
              rules: [{ required: true }],
              initialValue: _.get(discrepencies, "values.primary", true)
            })(
              <RadioGroup className="options">
                <Radio value={false}>Ignore</Radio>
                <Radio value={true}>Add</Radio>
              </RadioGroup>
            )}
          </div>
        )}

        {discrepencies.matching && (
          <div className="conflict">
            <p>
              The following records occur in the DataLab but not in this
              datasource:
            </p>

            <Table
              size="small"
              pagination={{ size: "small", pageSize: 5 }}
              dataSource={discrepencies.matching.map((record, index) => ({
                key: index,
                record: record
              }))}
              columns={[
                { title: "Record", dataIndex: "record", key: "record" }
              ]}
            />
            {form.getFieldDecorator(`matching`, {
              rules: [{ required: true }],
              initialValue: _.get(discrepencies, "values.matching", true)
            })(
              <RadioGroup className="options">
                <Radio value={false}>Drop</Radio>
                <Radio value={true}>Keep</Radio>
              </RadioGroup>
            )}
          </div>
        )}

        {(form.getFieldError("primary") || form.getFieldError("matching")) && (
          <span style={{ color: "#f5222d" }}>
            Conflicts must be resolved before continuing
          </span>
        )}
      </Modal>
    );
  }
}

export default Form.create()(DiscrepenciesModal);
