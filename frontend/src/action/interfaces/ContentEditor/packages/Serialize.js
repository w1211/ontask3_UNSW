import React from 'react';

import Html from "slate-html-serializer";

import { Button } from 'antd';

import FontList from './FontList';

const BLOCK_TAGS = {
  p: "paragraph",
  li: "list-item",
  ul: "bulleted-list",
  ol: "numbered-list",
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
            const fontStack = FontList[obj.data.get("font")]["stack"];
            const fontStackString = fontStack.join(", ");
            return <span style={{fontFamily: fontStackString}}>{children}</span>;
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

function Serialize(options) {
  return {
    queries: {
      generateHtml(editor) {
        const { value } = editor;

        const html = new Html({ rules });
        const output = value.document.nodes.map(node => {
          const pseudoValue = { document: { nodes: [node] } };
          return html.serialize(pseudoValue);
        });
        return [...output];
      },
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

export default Serialize;