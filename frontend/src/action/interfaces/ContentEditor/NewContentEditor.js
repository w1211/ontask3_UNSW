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
import Serialize, { PreviewButton } from './packages/Serialize';

/**
 * onPaste
 * Preview + Save
 * Drag Drop
 */

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            text: '',
          },
        ],
      },
    ],
  },
});

class NewContentEditor extends React.Component {
  schema = {
    document: {
      nodes: [
        { match: { type: 'paragraph' } },
        { match: { type: 'list-item' } },
        { match: { type: 'bulleted-list' } },
        { match: { type: 'numbered-list' } },
        { match: { type: 'code' } },
        { match: { type: 'heading-one' } },
        { match: { type: 'heading-two' } },
        { match: { type: 'link' } },
        { match: { type: 'image' } },
        { match: { type: 'attribute' } },
        { match: { type: 'condition-wrapper' } },
        { match: { type: 'condition' } }
      ],
    },
  };

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
    Serialize(),
    SoftBreak({ shift: true })
  ];

  constructor(props) {
    super(props);

    this.state = {
      value: initialValue,
      isInside: false,
      previewing: false,
      error: null
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

  previewContent = () => {
    const { onPreview } = this.props;

    const content = {
      blockMap: this.editor.value.toJSON(),
      html: this.editor.generateHtml()
    };

    console.log(content);

    this.setState({ error: null, previewing: true });

    onPreview({
      content,
      onSuccess: () => this.setState({ previewing: false }),
      onError: error => this.setState({ error })
    });
  };

  onChange = ({ value }) => {
    this.setState({ value });
  };

  onKeyDown = (event, editor, next) => {
    // TODO: REMOVE (DEBUGGING ONLY)
    if (event.key === '.') {
      event.preventDefault();
      const html = editor.generateHtml();
      console.log(html);
      console.log(editor.value.document.toJSON());
      console.log(editor.value.marks.toJSON());
    }
    return next();
  }

  render() {
    const { order } = this.props;
    const { value, isInside, previewing } = this.state;

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
          schema={this.schema}
          plugins={this.plugins}
          value={value}
          onKeyDown={this.onKeyDown}
          onChange={this.onChange}
          renderEditor={(props) =>
            <div ref={editorDiv => (this.editorDiv = editorDiv)}>{props.children}</div> // editorDiv to use this.editorDiv.getBoundgetBoundingClientRect
          }
        />
        <div style={{ marginTop: "10px" }}>
          <PreviewButton loading={previewing} onClick={this.previewContent} />
          {/* <Button
            loading={loading}
            type="primary"
            size="large"
            onClick={this.updateContent}
          >
            Save
          </Button> */}
        </div>
      </div>
    )
  };
};

export default NewContentEditor;