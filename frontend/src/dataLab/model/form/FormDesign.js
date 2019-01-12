import React from "react";
import { Modal, Button, Radio, List, notification, message, Form } from "antd";
import _ from "lodash";

import FieldDesign from "./FieldDesign";
import Field from "../../../shared/Field";

import ModelContext from "../ModelContext";

const confirm = Modal.confirm;

class FormDesign extends React.Component {
  static contextType = ModelContext;

  constructor(props) {
    super(props);
    const { fields } = props;

    this.state = {
      mode: "design",
      fieldKeys: fields.map(() => _.uniqueId()),
      // Make a clone of the fields in the module. If the user deletes a field,
      // or a field's options, then the step/module in the build must also be
      // deleted, as it is used for populating the initial values of the fields.
      fields
    };
  }

  addField = () => {
    const { fieldKeys } = this.state;

    this.setState({
      fieldKeys: [...fieldKeys, _.uniqueId()],
      confirmOnClose: true
    });
  };

  deleteField = fieldIndex => {
    const { stepIndex, form } = this.props;
    const { hasDependency } = this.context;
    const { fieldKeys } = this.state;
    const { getFieldValue, setFieldsValue } = form;

    const field = getFieldValue(`fields[${fieldIndex}]`);

    if (hasDependency(stepIndex, field.name)) {
      message.error(
        `'${
          field.name
        }' cannot be removed as it is being used as a matching field.`
      );
    } else {
      confirm({
        title: "Confirm field deletion",
        content: `Are you sure you want to delete this field from the form?
          Any data entered in the form for this field will be lost.`,
        onOk: () => {
          const fields = getFieldValue("fields");

          fieldKeys.splice(fieldIndex, 1);
          fields.splice(fieldIndex, 1);

          this.setState({ fieldKeys, confirmOnClose: true, fields });
          setFieldsValue({ fields });
        }
      });
    }
  };

  handleOk = () => {
    const { closeModal, form, onOk } = this.props;

    form.validateFields((err, values) => {
      if (err) {
        notification["error"]({
          message: "Invalid form design",
          description:
            "All errors must be resolved before the form design can be saved."
        });
        this.setState({ mode: "design" });
        return;
      }

      onOk(values);
      closeModal();
      this.setState({ confirmOnClose: false });
    });
  };

  handleCancel = () => {
    const { closeModal, fields, form } = this.props;
    const { confirmOnClose } = this.state;

    const performCancel = () => {
      form.resetFields();
      closeModal();
      // Since new uniqueId's are generated, a re-render of fields is forced. Thus,
      // if a field or option in a field is deleted, then cancelling the form design
      // changes  will revert the state back to the original values (if editing the
      // DataLab)
      this.setState({
        fieldKeys: fields.map(() => _.uniqueId()),
        confirmOnClose: false,
        // Reset the cloned fields to the original state
        fields
      });
    };

    if (form.isFieldsTouched() || confirmOnClose) {
      confirm({
        title: "Cancel form design",
        content: `Are you sure you wish to cancel? If you proceed, 
            any changes made to the form design will be lost.`,
        onOk: () => {
          performCancel();
        }
      });
    } else {
      performCancel();
    }
  };

  render() {
    const { visible, form } = this.props;
    const { mode, fieldKeys, fields } = this.state;
    const { getFieldValue } = form;
    
    return (
      <Modal
        className="formField"
        visible={visible}
        title="Edit form design"
        onCancel={this.handleCancel}
        onOk={this.handleOk}
      >
        <Button
          icon="plus"
          type="primary"
          onClick={this.addField}
          style={{ marginRight: 10 }}
        >
          Add new field
        </Button>

        <Radio.Group
          value={mode}
          onChange={e => this.setState({ mode: e.target.value })}
        >
          <Radio.Button value="design">Design</Radio.Button>
          <Radio.Button value="preview">Preview</Radio.Button>
        </Radio.Group>

        <div>
          <List
            size="large"
            bordered
            dataSource={fieldKeys}
            style={{ marginTop: 10, overflowY: "scroll", maxHeight: "50vh" }}
            locale={{ emptyText: "No fields have been added yet." }}
            renderItem={(key, fieldIndex) => {
              return (
                <List.Item>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "100%"
                    }}
                  >
                    <FieldDesign
                      key={key}
                      visible={mode === "design"}
                      field={fields[fieldIndex]}
                      fieldIndex={fieldIndex}
                      form={form}
                      deleteField={() => this.deleteField(fieldIndex)}
                      confirmOnClose={() =>
                        this.setState({ confirmOnClose: true })
                      }
                      updateClonedField={field => {
                        const updatedFields = [...fields];
                        updatedFields[fieldIndex] = field;
                        this.setState({ fields: updatedFields });
                      }}
                    />
                    {mode === "preview" && (
                      <Field
                        showName
                        field={getFieldValue(`fields[${fieldIndex}]`)}
                      />
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      </Modal>
    );
  }
}

export default Form.create()(FormDesign);
