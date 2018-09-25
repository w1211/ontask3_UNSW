import React from "react";
import { connect } from "react-redux";
import {
  Modal,
  Button,
  Dropdown,
  Menu,
  Icon,
  TreeSelect,
  Tooltip,
  Alert,
  Form,
  Input
} from "antd";
import { Editor } from "slate-react";
import { Value } from "slate";
import _ from "lodash";

import FormItemLayout from "../../shared/FormItemLayout";

const FormItem = Form.Item;
const confirm = Modal.confirm;

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: "block",
        type: "paragraph",
        nodes: [
          {
            object: "text",
            leaves: [
              {
                text: ""
              }
            ]
          }
        ]
      }
    ]
  }
});

class ComputedFieldModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: initialValue,
      error: null,
      treeData: null
    };
  }

  generateTreeData = () => {
    const { datasources, build, stepIndex } = this.props;

    const treeData = [];

    build.steps.slice(0, stepIndex).forEach((step, i) => {
      if (step.type === "datasource") {
        step = step.datasource;

        const name = datasources.find(datasource => datasource.id === step.id)
          .name;
        treeData.push({
          title: (
            <span style={{ color: "#2196F3" }}>
              <Icon type="database" style={{ marginRight: 5 }} />
              {name}
            </span>
          ),
          value: `${i}`,
          children: step.fields.map((field, j) => ({
            title: step.labels[field],
            value: `${i}_${j}`
          }))
        });
      }

      if (step.type === "form") {
        step = step.form;

        treeData.push({
          title: (
            <span style={{ color: "#5E35B1" }}>
              <Icon type="form" style={{ marginRight: 5 }} />
              {step.name}
            </span>
          ),
          value: `${i}`,
          children: step.fields.map((field, j) => ({
            title: field.name,
            value: `${i}_${j}`
          }))
        });
      }
    });

    return treeData;
  };

  componentDidUpdate(prevProps) {
    const { visible, field } = this.props;
    const { value } = this.state;

    const newState = {};

    if (!prevProps.visible && visible)
      newState.treeData = this.generateTreeData();

    if (!prevProps.field && field) {
      // Manually reconstruct the block map
      // Using Value.fromJSON(formula.field) does not work, as functions
      // such as value.endBlock fail to reflect the imported block map
      let change = value.change();
      field.formula.document.nodes.forEach(node => {
        if (node.type !== "paragraph") change = change.insertBlock(node);
      });
      newState.value = change.value;
    }

    if (Object.keys(newState).length > 0) this.setState(newState);
  }

  handleOk = () => {
    const { fieldIndex, updateBuild, field, form } = this.props;
    const { value, error } = this.state;

    const blockMap = value.toJSON();
    const nodes = blockMap.document.nodes;

    if (nodes.length < 2) {
      this.setState({
        error: "Formula cannot be empty"
      });
      return;
    }

    const lastBlock = value.endBlock.type;
    const hasUnclosedParenthesis = this.hasUnclosedParenthesis(value);
    const hasEmptyAggregation = nodes.find(
      node =>
        node.type === "aggregation" &&
        (!("columns" in node.data) || node.data.columns.length < 1)
    );

    if (
      !["aggregation", "field", "close-bracket"].includes(lastBlock) ||
      hasUnclosedParenthesis ||
      hasEmptyAggregation
    ) {
      this.setState({
        error: "Formula is invalid"
      });
      return;
    }

    // Reset the error if one has been set
    if (error) this.setState({ error: null });

    form.validateFields((err, values) => {
      if (err) return;

      values.formula = blockMap;
      if (field) {
        updateBuild(`fields[${fieldIndex}]`, values);
      } else {
        updateBuild("add", values, true);
      }
      this.handleClose();
    });
  };

  handleClose = () => {
    const { closeComputedFieldModal, form } = this.props;

    this.setState({
      value: initialValue,
      error: null,
      treeData: null
    });
    form.resetFields();
    closeComputedFieldModal();
  };

  handleDelete = () => {
    const { fieldIndex, updateBuild } = this.props;

    confirm({
      title: "Confirm field deletion",
      content: "Are you sure you want to delete this computed field?",
      onOk: () => {
        updateBuild("delete", fieldIndex, true);
        this.handleClose();
      }
    });
  };

  renderNode = props => {
    const { attributes, children, node } = props;
    const { value, treeData } = this.state;
    const change = value.change();

    switch (node.type) {
      case "paragraph":
        return (
          <p {...attributes} style={{ display: "inline" }}>
            {children}
          </p>
        );
      case "aggregation": {
        const type = node.data.get("type");
        const columns = node.data.get("columns");
        return (
          <div
            {...attributes}
            style={{
              border: "1px solid #757575",
              borderRadius: 3,
              display: "inline-flex",
              alignItems: "center",
              background: "#FAFAFA",
              margin: "2px 5px 2px 0"
            }}
          >
            <div
              style={{
                padding: "0 5px",
                cursor: "default"
              }}
            >
              {type}:
            </div>
            <div>
              {children}
              <TreeSelect
                treeData={treeData}
                treeCheckable={true}
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                searchPlaceholder={"Click to add columns"}
                style={{ minWidth: 175 }}
                dropdownStyle={{ maxHeight: 250 }}
                className="tree-select"
                value={columns}
                onChange={columns => {
                  change.setNodeByKey(node.key, { data: { type, columns } });
                  this.onChange(change);
                }}
              />
            </div>
          </div>
        );
      }
      case "field": {
        const name = node.data.get("name");
        return (
          <div
            style={{
              display: "inline-block",
              padding: "0 5px",
              border: "1px solid #757575",
              borderRadius: 3,
              margin: "2px 5px 2px 0",
              lineHeight: "2.3em",
              background: "#FAFAFA",
              cursor: "default"
            }}
          >
            {children}
            {name}
          </div>
        );
      }
      case "operator": {
        const type = node.data.get("type");
        const typeMap = {
          "+": "+",
          "-": "−",
          "*": "×",
          "/": "÷"
        };
        return (
          <div
            style={{
              display: "inline-block",
              padding: "0 5px",
              border: "1px solid #757575",
              borderRadius: 3,
              margin: "2px 5px 2px 0",
              lineHeight: "2.3em",
              background: "#FAFAFA",
              cursor: "default"
            }}
          >
            {children}
            {typeMap[type]}
          </div>
        );
      }
      case "open-bracket": {
        return (
          <div
            style={{
              display: "inline-block",
              fontSize: "200%",
              marginRight: 5,
              lineHeight: "unset"
            }}
          >
            (
          </div>
        );
      }
      case "close-bracket": {
        return (
          <div
            style={{
              display: "inline-block",
              fontSize: "200%",
              marginRight: 5,
              lineHeight: "unset"
            }}
          >
            )
          </div>
        );
      }
      default:
        return;
    }
  };

  onChange = ({ value }) => {
    this.setState({ value });
  };

  hasUnclosedParenthesis = formula => {
    let hasUnclosedParenthesis = false;

    formula.toJSON().document.nodes.forEach(block => {
      if (block.type === "open-bracket") hasUnclosedParenthesis = true;
      if (block.type === "close-bracket" && hasUnclosedParenthesis)
        hasUnclosedParenthesis = false;
    });

    return hasUnclosedParenthesis;
  };

  Parentheses = () => {
    const { value } = this.state;
    const change = value.change();

    const lastBlock = value.endBlock.type;
    const hasUnclosedParenthesis = this.hasUnclosedParenthesis(value);

    return (
      <div style={{ display: "inline" }}>
        <Tooltip title="Open parenthesis">
          <Button
            style={{ padding: "0 10px", borderRadius: "4px 0 0 4px" }}
            onClick={() => {
              change.insertBlock({
                type: "open-bracket"
              });
              this.onChange(change);
            }}
            disabled={
              !["paragraph", "operator"].includes(lastBlock) ||
              hasUnclosedParenthesis
            }
          >
            (
          </Button>
        </Tooltip>

        <Tooltip title="Close parenthesis">
          <Button
            style={{
              padding: "0 10px",
              borderRadius: "0 4px 4px 0",
              marginRight: 5
            }}
            onClick={() => {
              change.insertBlock({
                type: "close-bracket"
              });
              this.onChange(change);
            }}
            disabled={
              !["aggregation", "field"].includes(lastBlock) ||
              !hasUnclosedParenthesis
            }
          >
            )
          </Button>
        </Tooltip>
      </div>
    );
  };

  AggregationFunctions = () => {
    const { value } = this.state;
    const change = value.change();

    const handleMenuClick = e => {
      change.insertBlock({
        type: "aggregation",
        data: { type: e.key }
      });
      this.onChange(change);
    };

    const menu = (
      <Menu onClick={handleMenuClick}>
        <Menu.Item key="sum">Sum</Menu.Item>
        <Menu.Item key="average">Average</Menu.Item>
        <Menu.Item key="concat">Concat</Menu.Item>
        <Menu.Item key="last">Last</Menu.Item>
      </Menu>
    );

    const lastBlock = value.endBlock.type;

    return (
      <Dropdown
        overlay={menu}
        trigger={["click"]}
        disabled={
          !["paragraph", "open-bracket", "operator"].includes(lastBlock)
        }
      >
        <Button style={{ marginRight: 5 }}>
          Aggregations <Icon type="down" />
        </Button>
      </Dropdown>
    );
  };

  Columns = () => {
    const { value, treeData } = this.state;
    const change = value.change();

    const handleMenuClick = e => {
      change.insertBlock({
        type: "field",
        data: { name: e.key }
      });
      this.onChange(change);
    };

    const menu = (
      <Menu onClick={handleMenuClick}>
        {treeData &&
          treeData.map((step, i) => (
            <Menu.SubMenu
              key={i}
              title={step.title}
              children={step.children.map((field, j) => (
                <Menu.Item key={field.title}>{field.title}</Menu.Item>
              ))}
            />
          ))}
      </Menu>
    );

    const lastBlock = value.endBlock.type;

    return (
      <Dropdown
        overlay={menu}
        trigger={["click"]}
        disabled={
          !["paragraph", "open-bracket", "operator"].includes(lastBlock)
        }
      >
        <Button style={{ marginRight: 5 }}>
          Fields <Icon type="down" />
        </Button>
      </Dropdown>
    );
  };

  Operators = () => {
    const { value } = this.state;
    const change = value.change();

    const handleMenuClick = e => {
      change.insertBlock({
        type: "operator",
        data: { type: e.key }
      });
      this.onChange(change);
    };

    const menu = (
      <Menu onClick={handleMenuClick}>
        <Menu.Item key="+">Add</Menu.Item>
        <Menu.Item key="-">Subtract</Menu.Item>
        <Menu.Item key="*">Multiply</Menu.Item>
        <Menu.Item key="/">Divide</Menu.Item>
      </Menu>
    );

    const lastBlock = value.endBlock.type;

    return (
      <Dropdown
        overlay={menu}
        trigger={["click"]}
        disabled={
          !["aggregation", "field", "close-bracket"].includes(lastBlock)
        }
      >
        <Button>
          Operation <Icon type="down" />
        </Button>
      </Dropdown>
    );
  };

  DeleteBlock = () => {
    const { value } = this.state;
    const change = value.change();

    return (
      <Tooltip title="Delete last block from formula">
        <Button
          icon="delete"
          type="danger"
          style={{ float: "right" }}
          onClick={() => {
            change.moveToEnd().deleteBackward(1);
            this.onChange(change);
          }}
        />
      </Tooltip>
    );
  };

  render() {
    const { visible, field, usedLabels, form } = this.props;
    const { value, error } = this.state;

    const { getFieldDecorator } = form;

    return (
      <Modal
        className="computed-field-modal"
        visible={visible}
        title={`${field ? "Edit" : "Add"} computed field`}
        onCancel={this.handleClose}
        footer={
          <div>
            <Button onClick={this.handleClose}>Cancel</Button>
            {field && (
              <Button type="danger" onClick={this.handleDelete}>
                Delete
              </Button>
            )}
            <Button type="primary" onClick={this.handleOk}>
              {field ? "Update" : "Add"}
            </Button>
          </div>
        }
      >
        <FormItem
          {...FormItemLayout}
          label={
            <div className="field_label">
              Field name
              <Tooltip title="The name for this field in the DataLab">
                <Icon type="question-circle-o" />
              </Tooltip>
            </div>
          }
        >
          {getFieldDecorator("name", {
            rules: [
              { required: true, message: "Field name is required" },
              {
                message: "Field name is already being used in the DataLab",
                validator: (rule, value, cb) => {
                  if (field && field.name === value) cb();
                  usedLabels.includes(value) ? cb(true) : cb();
                }
              }
            ],
            initialValue: field && field.name
          })(<Input />)}
        </FormItem>

        <div className="toolbar">
          {this.Parentheses()}
          {this.AggregationFunctions()}
          {this.Columns()}
          {this.Operators()}
          {this.DeleteBlock()}
        </div>

        <Editor
          readOnly
          value={value}
          onChange={this.onChange}
          renderNode={this.renderNode}
          placeholder="Create a formula using the buttons above"
          style={{
            border: "2px solid #ddd",
            borderRadius: 5,
            padding: 5,
            minHeight: 60,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            whiteSpace: "normal"
          }}
        />

        {error && (
          <Alert message={error} type="error" style={{ marginTop: "10px" }} />
        )}
      </Modal>
    );
  }
}

const mapStateToProps = state => {
  const { datasources, build } = state.dataLab;

  return { datasources, build };
};

export default _.flow(
  connect(mapStateToProps),
  Form.create()
)(ComputedFieldModal);
