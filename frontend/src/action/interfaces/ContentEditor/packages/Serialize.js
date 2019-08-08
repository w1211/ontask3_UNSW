import React from 'react';

import { getEventTransfer } from "slate-react";
import Html from "slate-html-serializer";

import sanitizeHtml from "sanitize-html";

import { Button } from 'antd';

import FontList from './FontList';

const BLOCK_TAGS = {
  p: 'paragraph',
  li: 'list-item',
  ul: 'bulleted-list',
  ol: 'numbered-list',
  blockquote: 'quote',
  pre: 'code',
  h1: 'heading-one',
  h2: 'heading-two',
  h3: 'heading-three',
  h4: 'heading-four',
  h5: 'heading-five',
  h6: 'heading-six',
};

const MARK_TAGS = {
  strong: "bold",
  em: "italic",
  u: "underlined",
  s: "strikethrough",
  code: "code",
  span: "span"
};

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
            return (<pre><code>{children}</code></pre>);
          case "color":
            return <span style={{color: obj.data.get("hex")}}>{children}</span>;
          case "font-family":
            const font = FontList[obj.data.get("font")];
            const fontStackString = font && font["stack"].join(", ");
            return <span style={{fontFamily: fontStackString}}>{children}</span>;
          default:
            return;
        }
      }
    }
  },
  {
    deserialize(el, next) {
      const tag = el.tagName.toLowerCase();
      const block = BLOCK_TAGS[tag];
      const mark = MARK_TAGS[tag];
      if (block) {
        return {
          object: "block",
          type: block,
          nodes: next(el.childNodes)
        };
      }
      if (mark) {
        const style = el.getAttribute("style");
        const property = style && style.slice(0, style.indexOf(':'));
        const value = style && style.slice(style.indexOf(':') + 1, -1);

        switch (property) {
          case 'color':
            return {
              object: "mark",
              type: "color",
              nodes: next(el.childNodes),
              data: { hex: value }
            }
          case 'font-family':
            return {
              object: "mark",
              type: "font-family",
              nodes: next(el.childNodes),
              data: { font: value.split(",")[0].replace(/['"]+/g, '') }
            }
          default:
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
      // Special case for code blocks, which need to grab the nested childNodes.
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
      if (!el.nodeValue || el.nodeValue.trim() === "") return null;
    }
  },
];

function Serialize(options) {
  const serializer = new Html({ rules });
  return {
    queries: {
      generateHtml(editor) {
        const { value } = editor;

        const output = value.document.nodes.map(node => {
          const pseudoValue = { document: { nodes: [node] } };
          return serializer.serialize(pseudoValue);
        });
        return [...output];
      },
      generateDocument(editor, html) {
        return serializer.deserialize(html);
      }
    },
    onPaste(event, editor, next) {
      /**
       * TODO:
       * Bullet Points - Fix the weird symbol
       */
      const transfer = getEventTransfer(event);
      if (transfer.type !== "html") return next();

      const sanitizedHtml = sanitizeHtml(transfer.html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "h1",
          "h2",
          "span",
          "img",
          "u"
        ]),
        allowedAttributes: {
          "*": ["style"],
          a: ["href", "name", "target"],
          img: ["src"]
        },
        allowedStyles: {
          "*": {
            "color": [/^.*$/],
            // "font-size": [/^.*$/],
            "font-family": [/^.*$/]
          }
        },
        transformTags: {
          b: sanitizeHtml.simpleTransform("strong"),
          i: sanitizeHtml.simpleTransform("em")
        }
      });

      const { document } = serializer.deserialize(sanitizedHtml);
      editor.insertFragment(document);

      return true;
    }
  };
};

export function parseStyles(styles) {
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

export const PreviewButton = (props) => {
  return (
    <Button
      loading={props.previewing}
      style={{ marginRight: "10px" }}
      size="large"
      onClick={props.onClick}
    >
      Preview
    </Button>
  );
};

export const SaveButton = (props) => {
  return (
    <Button
      loading={props.saving}
      type="primary"
      size="large"
      onClick={props.onClick}
    >
      Save
    </Button>
  )
}

export default Serialize;