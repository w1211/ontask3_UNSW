import React from "react";

import { Editor } from 'slate-react';
import { Value } from 'slate';
import SoftBreak from "slate-soft-break";

import Mark, { renderMarkButton } from './packages/Mark';
import Block, { renderBlockButton } from './packages/Block';
import Link, { LinkButton } from './packages/Link';
import Image, { ImageButton } from './packages/Image';
import Attribute, { AttributeButton } from './packages/Attribute';
import Color, { ColorButton } from './packages/Color';
import Font, { FontFamilySelect } from './packages/Font';
import Rules from './packages/Rules';
import { UndoButton, RedoButton } from './packages/History';

/**
 * onPaste
 * Preview + Save
 * Drag Drop
 */

// const BLOCK_TAGS = {
//   p: "paragraph",
//   li: "list-item",
//   ul: "bulleted-list",
//   ol: "numbered-list",
//   blockquote: "quote",
//   pre: "code",
//   h1: "heading-one",
//   h2: "heading-two",
// };

// const MARK_TAGS = {
//   strong: "bold",
//   em: "italic",
//   u: "underlined",
//   s: "strikethrough",
//   code: "code",
//   span: "span"
// };

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            text: 'A line of text in a paragraph.',
          },
        ],
      },
    ],
  },
});

class NewContentEditor extends React.Component {
  plugins = [
    Rules({ rules: this.props.rules, types: this.props.types, colours: this.props.colours }),
    Block(),
    Link(),
    Image(),
    Attribute(),
    Mark({ type: "italic", icon: "format_italic", hotkey: "mod+i" }),
    Mark({ type: "italic", icon: "format_italic", hotkey: "mod+i" }),
    Mark({ type: "underlined", icon: "format_underlined", hotkey: "mod+u" }),
    Mark({ type: "code", icon: "code", hotkey: "mod+`" }),
    Color(),
    Font(),
    // Rules({ rules: this.props.rules, types: this.props.types, colours: this.props.colours }),
    SoftBreak({ shift: true })
  ];

  constructor(props) {
    super(props);

    this.state = {
      value: initialValue,
      isInside: false
    };
  };

  componentDidMount = () => {
    // So that "this.editor" is not undefined when changing font, undo, redo, colour, etc.
    this.editor.focus();
  };

  componentDidUpdate = () => {
    this.handleRuleDrag();
  };

  // TODO: FIX NON-RENDERING of RULE BLOCKS
  handleRuleDrag = () => {
    const { mouseEvent, ruleIndex, rules } = this.props;
    const { isInside } = this.state;

    if (mouseEvent) {
      const contentEditor = this.editorDiv.getBoundingClientRect();

      const isInsideX =
        mouseEvent.clientX >= contentEditor.x &&
        mouseEvent.clientX <= contentEditor.x + contentEditor.width;
      const isInsideY =
        mouseEvent.clientY >= contentEditor.y &&
        mouseEvent.clientY <= contentEditor.y + contentEditor.height;

      if (!isInside && isInsideX && isInsideY)
        this.setState({ isInside: true });

      if (isInside && !(isInsideX && isInsideY))
        this.setState({ isInside: false });
    }

    if (ruleIndex !== null && isInside) {
      this.setState({ isInside: false });

      const rule = rules[ruleIndex];

      rule.conditions.forEach(condition => {
        this.editor.insertBlock({
          type: "condition",
          data: {
            conditionId: condition.conditionId,
            ruleIndex
          }
        });
      });

      this.editor.insertBlock({
        type: "condition",
        data: {
          label: "else",
          conditionId: rule.catchAll,
          ruleIndex
        }
      });

      console.log(this.editor.value);
    }
  };

  onChange = ({ value }) => {
    this.setState({ value });
  };

  render() {
    const { value, isInside } = this.state;

    return (
      <div>
        <div className="toolbar">
          <UndoButton editor={this.editor} />
          <RedoButton editor={this.editor} />
          {renderMarkButton(this.editor, value, "bold", "format_bold")}
          {renderMarkButton(this.editor, value, "italic", "format_italic")}
          {renderMarkButton(this.editor, value, "underlined", "format_underlined")}
          {renderMarkButton(this.editor, value, "code", "code")}
          <FontFamilySelect editor={this.editor} value={value}/>
          <ColorButton editor={this.editor} value={value}/>
          <LinkButton editor={this.editor} />
          <ImageButton editor={this.editor} />
          {renderBlockButton(this.editor, value, "heading-one", "looks_one")}
          {renderBlockButton(this.editor, value, "heading-two", "looks_two")}
          {renderBlockButton(this.editor, value, "paragraph", "short_text")}
          {renderBlockButton(this.editor, value, "numbered-list", "format_list_numbered")}
          {renderBlockButton(this.editor, value, "bulleted-list", "format_list_bulleted")}
          <AttributeButton editor={this.editor} order={this.props.order} />
        </div>
        <Editor
          className={`content_editor ${isInside ? "isInside" : ""}`}
          ref={editor => this.editor = editor}
          plugins={this.plugins}
          value={value}
          onChange={this.onChange}
          renderEditor={(props) =>
            <div ref={editorDiv => (this.editorDiv = editorDiv)}>{props.children}</div> // editorDiv to use this.editorDiv.getBoundgetBoundingClientRect
          }
        />
      </div>
    )
  };
};

export default NewContentEditor;