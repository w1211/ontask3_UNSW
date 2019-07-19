import React from "react";

import { Editor } from 'slate-react';
import { Value } from 'slate';
import SoftBreak from "slate-soft-break";

import Mark from './packages/Mark';
import Block from './packages/Block';
import Link, { LinkButton } from './packages/Link';
import Image, { ImageButton } from './packages/Image';
import Attribute from './packages/Attribute';
import Color from './packages/Color';
import Font from './packages/Font';
import Rules from './packages/Rules';
import History from './packages/History';

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
    Block(),
    Link(),
    Image(),
    Attribute(),
    Mark({ type: "bold", icon: "format_bold", hotkey: "mod+b" }),
    Mark({ type: "italic", icon: "format_italic", hotkey: "mod+i" }),
    Mark({ type: "underlined", icon: "format_underlined", hotkey: "mod+u" }),
    Mark({ type: "code", icon: "code", hotkey: "mod+`" }),
    Color(),
    Font(),
    Rules({ rules: this.props.rules, types: this.props.types, colours: this.props.colours }),
    History(),
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

  /**
   * TODO: Fix strange issue where this.editor.<function> does not work
   * in the if (ruleIndex !== null && isInside) condition block, but pretty much
   * elsewhere.
   */
  componentDidUpdate = () => {
    this.handleRuleDrag();
  };

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

      this.editor.insertRule(ruleIndex, rules[ruleIndex]);
    }
  };

  handleRuleClick(ruleIndex, rules) {
    this.editor.insertRule(ruleIndex, rules[ruleIndex]);
  };

  onChange = ({ value }) => {
    this.setState({ value });
  };

  render() {
    const { order } = this.props;
    const { value, isInside } = this.state;

    return (
      <div>
        <div className="toolbar">
          {this.editor && this.editor.renderUndoButton()}
          {this.editor && this.editor.renderRedoButton()}
          {this.editor && this.editor.renderMarkButton("bold", "format_bold")}
          {this.editor && this.editor.renderMarkButton("italic", "format_italic")}
          {this.editor && this.editor.renderMarkButton("underlined", "format_underlined")}
          {this.editor && this.editor.renderMarkButton("code", "code")}
          {this.editor && this.editor.renderFontFamilySelect()}
          {this.editor && this.editor.renderColorButton()}
          {<LinkButton editor={this.editor} />}
          <ImageButton editor={this.editor} />
          {this.editor && this.editor.renderBlockButton("heading-one", "looks_one")}
          {this.editor && this.editor.renderBlockButton("heading-two", "looks_two")}
          {this.editor && this.editor.renderBlockButton("paragraph", "short_text")}
          {this.editor && this.editor.renderBlockButton("numbered-list", "format_list_numbered")}
          {this.editor && this.editor.renderBlockButton("bulleted-list", "format_list_bulleted")}
          {this.editor && this.editor.renderAttributeButton(order)}
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