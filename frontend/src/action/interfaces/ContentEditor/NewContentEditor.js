import React from "react";

import { Editor } from 'slate-react';
import { Value } from 'slate';
import SoftBreak from "slate-soft-break";
import Html from "slate-html-serializer";


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

const rules = [
  {
    serialize(obj, children) {
      if (["block", "inline"].includes(obj.object)) {
        switch (obj.type) {
          case "heading-one":
            return <h1>{children}</h1>;
          case "heading-two":
            return <h2>{children}</h2>;
          case "paragraph":
            return <p>{children}</p>;
          case "numbered-list":
            return <ol>{children}</ol>;
          case "bulleted-list":
            return <ul>{children}</ul>;
          case "list-item":
            return <li>{children}</li>;
          case "link":
            return (
              <a
                href={obj.data.get("href")}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          case "image":
            return (
              <img
                src={obj.data.get("src")}
                alt={obj.data.get("alt")}
                style={{ maxWidth: "100%" }}
              />
            );
          case "attribute":
            return <attribute field={obj.data.get("field")}>{children}</attribute>;
          case "condition-wrapper":
            return <div index={obj.data.get("ruleIndex")}>{children}</div>
          case "condition":
            return <div>{children}</div>;
          default:
            return;
        }
      }
    }
  },
  {
    serialize(obj, children) {
      if (obj.object === "mark") {
        switch (obj.type) {
          case "span":
            return (
              <span style={parseStyles(obj.data.get("style"))}>{children}</span>
            );
          case "bold":
            return <strong>{children}</strong>;
          case "italic":
            return <em>{children}</em>;
          case "underlined":
            return <u>{children}</u>;
          case "code":
            return (
              <pre>
                <code>{children}</code>
              </pre>
            );
          default:
            return;
        }
      }
    }
  },
  {
    deserialize(el, next) {
      const block = BLOCK_TAGS[el.tagName.toLowerCase()];

      if (block) {
        return {
          object: "block",
          type: block,
          nodes: next(el.childNodes)
        };
      }
    }
  },
  {
    deserialize(el, next) {
      const mark = MARK_TAGS[el.tagName.toLowerCase()];

      if (mark) {
        return {
          object: "mark",
          type: mark,
          nodes: next(el.childNodes),
          data:
            mark === "span"
              ? {
                  style: el.getAttribute("style")
                }
              : undefined
        };
      }
    }
  },
  {
    // Special case for code blocks, which need to grab the nested childNodes.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() === "pre") {
        const code = el.childNodes[0];
        const childNodes =
          code && code.tagName.toLowerCase() === "code"
            ? code.childNodes
            : el.childNodes;

        return {
          object: "block",
          type: "code",
          nodes: next(childNodes)
        };
      }
    }
  },
  {
    // Special case for images, to grab their src.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() === "img") {
        return {
          object: "block",
          type: "image",
          isVoid: true,
          nodes: next(el.childNodes),
          data: {
            src: el.getAttribute("src")
          }
        };
      }
    }
  },
  {
    // Special case for links, to grab their href.
    deserialize(el, next) {
      if (el.tagName.toLowerCase() === "a") {
        return {
          object: "inline",
          type: "link",
          nodes: next(el.childNodes),
          data: {
            href: el.getAttribute("href")
          }
        };
      }
    }
  },
  {
    deserialize(el, next) {
      if (!el.nodeValue || el.nodeValue.trim() === "") return null;
    }
  }
];

const BLOCK_TAGS = {
  p: "paragraph",
  li: "list-item",
  ul: "bulleted-list",
  ol: "numbered-list",
  blockquote: "quote",
  pre: "code",
  h1: "heading-one",
  h2: "heading-two",
};

const MARK_TAGS = {
  strong: "bold",
  em: "italic",
  u: "underlined",
  s: "strikethrough",
  code: "code",
  span: "span"
};

const parseStyles = styles => {
  return styles
    ? styles
        .split(";")
        .filter(style => style.split(":")[0] && style.split(":")[1])
        .map(style => [
          style
            .split(":")[0]
            .trim()
            .replace(/-./g, c => c.substr(1).toUpperCase()),
          style.split(":")[1].trim()
        ])
        .reduce(
          (styleObj, style) => ({
            ...styleObj,
            [style[0]]: style[1]
          }),
          {}
        )
    : styles;
};

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

  generateHtml = () => {
    const { value } = this.state;

    const html = new Html({ rules });
    const output = value.document.nodes.map(node => {
      const pseudoValue = { document: { nodes: [node] } };
      return html.serialize(pseudoValue);
    });

    return [...output];
  };

  handleRuleClick(ruleIndex, rules) {
    this.editor.insertRule(ruleIndex, rules[ruleIndex]);
  };

  onChange = ({ value }) => {
    this.setState({ value });
  };

  onKeyDown = (event, editor, next) => {
    // TODO: REMOVE (DEBUGGING ONLY)
    if (event.key === '.') {
      event.preventDefault();
      const html = this.generateHtml();
      // console.log(editor.value.blocks.some(node => {
      //   if (node.type === "condition") {
      //     console.log(node);
      //   }
      // }))
      console.log(html);
      console.log(editor.value.document.toJSON());
      console.log(editor.value.marks.toJSON());
    }
    return next();
  }

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
          onKeyDown={this.onKeyDown}
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