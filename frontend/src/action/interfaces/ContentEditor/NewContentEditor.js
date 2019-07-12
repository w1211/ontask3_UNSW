import React from "react";

import { Editor } from 'slate-react';
import { Value } from 'slate';

import Mark, { renderMarkButton } from './packages/Mark';
import Block, { renderBlockButton } from './packages/Block';

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

const boldPlugin = Mark({ type: "italic", icon: "format_italic", hotkey: "mod+i" });
const italicPlugin = Mark({ type: "bold", icon: "format_bold", hotkey: "mod+b" });
const underlinedPlugin = Mark({ type: "underlined", icon: "format_underlined", hotkey: "mod+u" });
const codePlugin = Mark({ type: "code", icon: "code", hotkey: "mod+`" });

const plugins = [
  Block(),
  boldPlugin,
  italicPlugin,
  underlinedPlugin,
  codePlugin
];


// Define our app...
class NewContentEditor extends React.Component {
  // Set the initial value when the app is first constructed.
  constructor(props) {
    super(props);

    this.state = {
      value: initialValue
    };
  };

  onChange = ({ value }) => {
    this.setState({ value })
  };

  render() {
    return (
      <div>
        <div className="toolbar">
          {renderMarkButton(this.editor, this.state.value, "bold", "format_bold")}
          {renderMarkButton(this.editor, this.state.value, "italic", "format_italic")}
          {renderMarkButton(this.editor, this.state.value, "underlined", "format_underlined")}
          {renderMarkButton(this.editor, this.state.value, "code", "code")}
          {renderBlockButton(this.editor, this.state.value, "heading-one", "looks_one")}
          {renderBlockButton(this.editor, this.state.value, "heading-two", "looks_two")}
          {renderBlockButton(this.editor, this.state.value, "paragraph", "short_text")}
          {renderBlockButton(this.editor, this.state.value, "numbered-list", "format_list_numbered")}
          {renderBlockButton(this.editor, this.state.value, "bulleted-list", "format_list_bulleted")}
        </div>
        <Editor
          ref={editor => this.editor = editor}
          plugins={plugins}
          value={this.state.value}
          onChange={this.onChange}
        />
      </div>
    )
  };
};

export default NewContentEditor;