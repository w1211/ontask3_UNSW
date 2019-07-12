import React from "react";

import { isKeyHotkey } from "is-hotkey";

const DEFAULT_NODE = "paragraph";

/**
 * TODO
 * Nested Lists? (icon shouldn't be active if the case)
 */

function Block(options) {
  return {
    renderBlock(props, editor, next) {
        const { attributes, children, node } = props;

        switch (node.type) {
          case "paragraph":
            return <p {...attributes}>{children}</p>;
          case "bulleted-list":
            return <ul {...attributes}>{children}</ul>;
          case "heading-one":
            return <h1 {...attributes}>{children}</h1>;
          case "heading-two":
            return <h2 {...attributes}>{children}</h2>;
          case "list-item":
            return <li {...attributes}>{children}</li>;
          case "numbered-list":
            return <ol {...attributes}>{children}</ol>;
          default:
            return next();
        };
    }
  };
};

export function hasBlock(value, type) {
  return value.blocks.some(node => node.type === type);
};

export function renderBlockButton(editor, value, type, icon) {
  let isActive = hasBlock(value, type);

  if (["numbered-list", "bulleted-list"].includes(type)) {
    const { document, blocks } = value;

    if (blocks.size > 0) {
      const parent = document.getParent(blocks.first().key);
      isActive = hasBlock(value, "list-item") && parent && parent.type === type;
    }
  }

  return (
    <i
      className={`material-icons ${isActive ? "active" : ""}`}
      onMouseDown={event => onClickBlock(event, editor, value, type)}
    >
      {icon}
    </i>
  );
};

export function onClickBlock(event, editor, value, type) {
  event.preventDefault();
  const { document } = value;

  // Handle everything but list buttons.
  if (type !== "bulleted-list" && type !== "numbered-list") {
    const isActive = hasBlock(value, type);
    const isList = hasBlock(value, "list-item");

    if (isList) {
      editor
        .setBlocks(isActive ? DEFAULT_NODE : type)
        .unwrapBlock("bulleted-list")
        .unwrapBlock("numbered-list");
    } else {
      editor.setBlocks(isActive ? DEFAULT_NODE : type);
    }
  } else {
    // Handle the extra wrapping required for list buttons.
    const isList = hasBlock(value, "list-item");
    const isType = value.blocks.some(block => {
      return !!document.getClosest(block.key, parent => parent.type === type);
    });

    if (isList && isType) {
      editor
        .setBlocks(DEFAULT_NODE)
        .unwrapBlock("bulleted-list")
        .unwrapBlock("numbered-list");
    } else if (isList) {
      editor
        .unwrapBlock(
          type === "bulleted-list" ? "numbered-list" : "bulleted-list"
        )
        .wrapBlock(type);
    } else {
      editor.setBlocks("list-item").wrapBlock(type);
    }
  }
};

export default Block;