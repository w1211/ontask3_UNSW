import React from "react";

const DEFAULT_NODE = "paragraph";

/**
 * TODO
 * Nested Lists? (icon shouldn't be active if the case)
 */

function Block(options) {
  return {
    queries: {
      hasBlock(editor, type) {
        return editor.value.blocks.some(node => node.type === type);
      },
      renderBlockButton(editor, type, icon) {
        let isActive = editor.hasBlock(type);

        if (["numbered-list", "bulleted-list"].includes(type)) {
          const { document, blocks } = editor.value;

          if (blocks.size > 0) {
            const parent = document.getParent(blocks.first().key);
            isActive = editor.hasBlock("list-item") && parent && parent.type === type;
          }
        }

        return (
          <i
            className={`material-icons ${isActive ? "active" : ""}`}
            onMouseDown={event => {editor.onClickBlock(event, type)}}
          >
            {icon}
          </i>
        );
      }
    },
    commands: {
      onClickBlock(editor, event, type) {
        event.preventDefault();
        const { document } = editor.value;

        // Handle everything but list buttons.
        if (type !== "bulleted-list" && type !== "numbered-list") {
          const isActive = editor.hasBlock(type);
          const isList = editor.hasBlock("list-item");

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
          const isList = editor.hasBlock("list-item");
          const isType = editor.value.blocks.some(block => {
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
      }
    },
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

export default Block;