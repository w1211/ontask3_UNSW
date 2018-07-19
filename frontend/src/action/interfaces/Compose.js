import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Button, Divider, Menu, Dropdown, Alert } from "antd";
import {
  convertToRaw,
  EditorState,
  EditorBlock,
  ContentBlock,
  genKey,
  DefaultDraftBlockRenderMap,
  convertFromRaw
} from "draft-js";
import Immutable from "immutable";
import _ from "lodash";

import { stateToHTML } from "draft-js-export-html";

import { Editor } from "react-draft-wysiwyg";
import Draggable from "react-draggable";

import * as ActionActionCreators from "../ActionActions";

import FilterModal from "../modals/FilterModal";
import ConditionGroupModal from "../modals/ConditionGroupModal";
import PreviewModal from "../modals/PreviewModal";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
const { List, Map } = Immutable;

const addNewBlockAt = (
  editorState,
  pivotBlockKey,
  newBlockType,
  initialData = new Map({})
) => {
  const content = editorState.getCurrentContent();
  const { blockMap } = content;
  const block = blockMap.get(pivotBlockKey);

  if (!block) {
    throw new Error(
      `The pivot key - ${pivotBlockKey} is not present in blockMap.`
    );
  }

  const blocksBefore = blockMap.toSeq().takeUntil(v => v === block);
  const blocksAfter = blockMap
    .toSeq()
    .skipUntil(v => v === block)
    .rest();
  const newBlockKey = genKey();

  const newBlock = new ContentBlock({
    key: newBlockKey,
    type: newBlockType,
    text: "",
    depth: 0,
    characterList: new List(),
    data: initialData
  });

  const newBlockMap = blocksBefore
    .concat([[pivotBlockKey, block], [newBlockKey, newBlock]], blocksAfter)
    .toOrderedMap();

  const selection = editorState.getSelection();

  const newContent = content.merge({
    blockMap: newBlockMap,
    selectionBefore: selection,
    selectionAfter: selection.merge({
      anchorKey: newBlockKey,
      anchorOffset: 0,
      focusKey: newBlockKey,
      focusOffset: 0,
      isBackward: false
    })
  });

  return EditorState.push(editorState, newContent, "split-block");
};

const generateColours = size => {
  let colours = new Array(size);

  const sin_to_hex = (i, phase) => {
    const sin = Math.sin((Math.PI / size) * 2 * i + phase);
    const int = Math.floor(sin * 127) + 128;
    const hex = int.toString(16);

    return hex.length === 1 ? "0" + hex : hex;
  };

  for (var i = 0; i < size; i++) {
    var red = sin_to_hex(i, (0 * Math.PI * 2) / 3); // 0   deg
    var blue = sin_to_hex(i, (1 * Math.PI * 2) / 3); // 120 deg
    var green = sin_to_hex(i, (2 * Math.PI * 2) / 3); // 240 deg

    colours[i] = "#" + red + green + blue;
  }

  return colours;
};

class Compose extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      ActionActionCreators,
      dispatch
    );

    this.state = {
      isInside: false,
      editorState: null,
      preview: { visible: false, loading: false, data: [] },
      visible: { filter: false, conditionGroup: false },
      contentLoading: false
    };
  }

  static getDerivedStateFromProps(props, state) {
    const { action } = props;
    const { editorState, colours } = state;

    const newState = {};

    if (!action) return null;

    if (!colours || action.conditionGroups.length > colours.length)
      newState.colours = generateColours(action.conditionGroups.length);

    if (!editorState) {
      if (action["content"]) {
        const contentState = convertFromRaw(action.content);
        newState.editorState = EditorState.createWithContent(contentState);
      } else {
        newState.editorState = EditorState.createEmpty();
      }
    }

    return Object.keys(newState).length > 0 ? newState : null;
  }

  handleConditionGroupMenuClick = (e, conditionGroup, index) => {
    const { action, updateAction } = this.props;
    const { visible } = this.state;

    switch (e.key) {
      case "edit":
        this.setState({ visible: { ...visible, conditionGroup: true } });
        this.boundActionCreators.openConditionGroupModal(conditionGroup);
        break;
      case "delete":
        this.boundActionCreators.deleteConditionGroup({
          actionId: action.id,
          index,
          onSuccess: action => updateAction(action)
        });
        break;
      default:
        break;
    }
  };

  isInsideContent(mouseEvent, editor) {
    const contentEditor = editor.editorContainer.parentElement.parentElement.getBoundingClientRect();
    const isInsideX =
      mouseEvent.clientX >= contentEditor.x &&
      mouseEvent.clientX <= contentEditor.x + contentEditor.width;
    const isInsideY =
      mouseEvent.clientY >= contentEditor.y &&
      mouseEvent.clientY <= contentEditor.y + contentEditor.height;

    // isInside flag is consumed by:
    //   The conditional css class on the content editor (darkens the border)
    //   Determining whether to add the dragged condition group to the content editor after drag stops
    this.setState({ isInside: isInsideX && isInsideY ? true : false });
  }

  stopDrag(conditionGroup, index) {
    const { isInside, editorState } = this.state;
    if (!isInside) return;

    const selection = editorState.getSelection();

    let newEditorState = editorState;
    conditionGroup.conditions.reverse().forEach(condition => {
      newEditorState = addNewBlockAt(
        newEditorState,
        selection.getAnchorKey(),
        "ConditionBlock",
        new Map({ name: condition.name, group: index })
      );
    });

    this.setState({ editorState: newEditorState });
  }

  handleContent = fn => {
    const { action, updateAction } = this.props;
    const { editorState, preview } = this.state;

    const currentContent = editorState.getCurrentContent();
    const blockMap = convertToRaw(currentContent);
    const html = stateToHTML(currentContent);

    if (fn === "preview") {
      this.setState({ preview: { ...preview, loading: true } });
      this.boundActionCreators.previewContent({
        actionId: action.id,
        payload: { blockMap, html },
        onError: error =>
          this.setState({ preview: { ...preview, loading: false }, error }),
        onSuccess: populatedContent =>
          this.setState({
            preview: {
              ...preview,
              visible: true,
              loading: false,
              data: populatedContent
            },
            error: null
          })
      });
    } else if (fn === "submit") {
      this.setState({ contentLoading: true });
      this.boundActionCreators.updateContent({
        actionId: action.id,
        payload: { blockMap, html },
        onError: error => this.setState({ contentLoading: false, error }),
        onSuccess: action => {
          this.setState({ contentLoading: false, error: null });
          updateAction(action);
        }
      });
    }
  };

  blockRendererFn = contentBlock => {
    const type = contentBlock.getType();

    if (type === "ConditionBlock") {
      return {
        component: this.ConditionBlock,
        props: {}
      };
    }
  };

  extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(
    Immutable.Map({
      ConditionBlock: {
        element: "section",
        wrapper: this.ConditionBlock
      }
    })
  );

  ConditionBlock = props => {
    const { block } = props;
    const { colours } = this.state;

    const data = block.getData();

    const name = data.get("name");
    const group = data.get("group");

    return (
      <div className="condition_block" style={{ borderColor: colours[group] }}>
        <span
          contentEditable={false}
          readOnly
          className="condition_name"
          style={{ color: colours[group] }}
        >
          If <strong>{name}</strong>:
        </span>
        <EditorBlock {...props} />
      </div>
    );
  };

  render() {
    const { action, updateAction } = this.props;
    const {
      editorState,
      preview,
      visible,
      contentLoading,
      error,
      colours
    } = this.state;

    return (
      <div>
        <h3>
          Filter
          <Button
            style={{ marginLeft: "10px" }}
            shape="circle"
            icon="edit"
            onClick={() => {
              this.boundActionCreators.openFilterModal(action.filter);
              this.setState({ visible: { ...visible, filter: true } });
            }}
          />
        </h3>

        {_.get(action, "filter.formulas", []).length > 0
          ? `${action.filtered_count} records selected out of ${
              action.datalab.data.length
            } (${action.datalab.data.length -
              action.filtered_count} filtered out)`
          : "No filter is currently being applied"}

        <FilterModal
          action={action}
          updateAction={updateAction}
          visible={visible.filter}
          closeModal={() => {
            this.boundActionCreators.closeFilterModal();
            this.setState({ visible: { ...visible, filter: false } });
          }}
        />

        <Divider dashed />

        <h3>
          Condition groups
          <Button
            style={{ marginLeft: "10px" }}
            shape="circle"
            icon="plus"
            onClick={() => {
              this.boundActionCreators.openConditionGroupModal();
              this.setState({ visible: { ...visible, conditionGroup: true } });
            }}
          />
        </h3>

        <ConditionGroupModal
          action={action}
          updateAction={updateAction}
          visible={visible.conditionGroup}
          closeModal={() => {
            this.boundActionCreators.closeConditionGroupModal();
            this.setState({ visible: { ...visible, conditionGroup: false } });
          }}
        />

        {action && action.conditionGroups && action.conditionGroups.length > 0
          ? action.conditionGroups.map((conditionGroup, i) => {
              return (
                <Draggable
                  key={i}
                  position={{ x: 0, y: 0 }}
                  onDrag={e => {
                    this.isInsideContent(e, this.editor);
                  }}
                  onStop={() => {
                    this.stopDrag(conditionGroup, i);
                  }}
                  onMouseDown={e => {
                    e.preventDefault();
                  }} // Keeps the content editor in focus when user starts to drag a condition group
                >
                  <Dropdown.Button
                    overlay={
                      <Menu
                        onClick={e =>
                          this.handleConditionGroupMenuClick(
                            e,
                            conditionGroup,
                            i
                          )
                        }
                      >
                        <Menu.Item key="edit">Edit</Menu.Item>
                        <Menu.Item key="delete">Delete</Menu.Item>
                      </Menu>
                    }
                    className="conditionGroupBtn"
                    key={i}
                    trigger={["click"]}
                    style={{
                      marginRight: "5px",
                      zIndex: 10
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        background: colours[i],
                        marginRight: 5,
                        display: "inline-block"
                      }}
                    />
                    {conditionGroup.name}
                  </Dropdown.Button>
                </Draggable>
              );
            })
          : "No condition groups have been added yet."}

        <Divider dashed />

        <h3>Content</h3>
        <Editor
          toolbar={{
            options: [
              "inline",
              "blockType",
              "fontSize",
              "fontFamily",
              "textAlign",
              "colorPicker",
              "link",
              "history",
              "list"
            ],
            inline: {
              options: [
                "bold",
                "italic",
                "underline",
                "strikethrough",
                "monospace"
              ]
            }
          }}
          wrapperClassName="editor-wrapper"
          editorClassName={{ editor: true, isInside: this.state.isInside }}
          editorState={editorState}
          editorRef={el => {
            this.editor = el;
          }}
          blockRenderMap={this.extendedBlockRenderMap}
          blockRendererFn={this.blockRendererFn}
          onEditorStateChange={editorState => this.setState({ editorState })}
        />

        <PreviewModal
          preview={preview}
          onClose={() =>
            this.setState({
              preview: { loading: false, visible: false, data: [] }
            })
          }
        />

        <div style={{ marginTop: "10px" }}>
          <Button
            loading={preview.loading}
            style={{ marginRight: "10px" }}
            size="large"
            onClick={() => {
              this.handleContent("preview");
            }}
          >
            Preview
          </Button>
          <Button
            loading={contentLoading}
            type="primary"
            size="large"
            onClick={() => {
              this.handleContent("submit");
            }}
          >
            Save
          </Button>
        </div>

        {error && (
          <Alert message={error} type="error" style={{ marginTop: "10px" }} />
        )}
      </div>
    );
  }
}

export default connect()(Compose);
