import React from "react";

import { Tooltip } from 'antd';

const DEFAULT_NODE = "paragraph";

function Blocks(options) {
  return {
    schema: {
      blocks: {
        "list-item": {
          parent: [{ type: 'bulleted-list' }, { type: 'numbered-list' }],
          normalize: (editor, { code, node, child, index }) => {
            if (code === "parent_type_invalid") editor.setNodeByKey(node.key, { type: 'paragraph' });
          }
        },
      }
    },
    queries: {
      hasBlock(editor, type) {
        return editor.value.blocks.some(node => node.type === type);
      },
      getParentType(editor) {
        const { value } = editor;
        return value.document.getParent(value.anchorBlock.key).type;
      },
      getCurrentParent(editor) {
        const { value } = editor;
        return value.document.getParent(value.anchorBlock.key)
      },
      renderBlockButton(editor, type, title, icon) {
        let isActive = editor.hasBlock(type);

        if (["numbered-list", "bulleted-list"].includes(type)) {
          const { document, blocks } = editor.value;

          if (blocks.size > 0) {
            const parent = document.getParent(blocks.first().key);
            isActive = editor.hasBlock("list-item") && parent && parent.type === type;
          }
        }

        return (
          <Tooltip title={title}>
            <i
              className={`material-icons ${isActive ? "active" : ""}`}
              onMouseDown={event => {editor.onClickBlock(event, type)}}
            >
              {icon}
            </i>
          </Tooltip>
        );
      }
    },
    commands: {
      onClickBlock(editor, event, type) {
        event.preventDefault();
        const parentType = editor.getParentType();

        // Handle everything but list buttons.
        if (type !== "bulleted-list" && type !== "numbered-list") {
          const isActive = editor.hasBlock(type);
          const isList = editor.hasBlock("list-item");

          if (isList) {
            // Set from List to Paragraph/Heading
            editor
              .setBlocks(isActive ? DEFAULT_NODE : type)
              .unwrapBlock(parentType);
          } else {
            // Swap Paragraph/List
            editor.setBlocks(isActive ? DEFAULT_NODE : type);
          }
        } else {
          // Handle the extra wrapping required for list buttons.
          const isList = editor.hasBlock("list-item");
          const parentType = editor.getParentType();

          if (isList && (parentType === type)) {
            // Is a list and of the same type
            editor
              .setBlocks(DEFAULT_NODE)
              .unwrapBlock(parentType);
          } else if (isList) {
            editor.setNodeByKey(editor.getCurrentParent().key, type)
          } else {
            // Not a list
            editor
              .wrapBlock(type)
              .setBlocks("list-item");
          }
        }
      },
    },
    onKeyDown(event, editor, next) {
      const { value } = editor;
      const { selection, anchorBlock } = value;
      const { start } = selection;
      const parentType = editor.getParentType();

      // List depth
      if (event.key === 'Tab') {
        event.preventDefault();
        if (editor.hasBlock("list-item")) {
          if (event.shiftKey) {
            editor.unwrapBlock(parentType);
          }
          else {
            editor
              .setBlocks('list-item')
              .wrapBlock(parentType);
          }
        }
        else {
          editor.insertText("\t");
        }
      }

      // Removes leftover bulleted-list & numbered-list blocks
      if (event.key === 'Backspace') {
        event.preventDefault();
        const type = anchorBlock.type;
        const parentType = editor.getParentType();
        const offset = start.offset;

        if (type !== "list-item" && ["bulleted-list", "numbered-list"].includes(parentType) && offset === 0) {
          editor.unwrapBlock(parentType);
        }
      }

      // Enter on Heading Block to remove heading style
      if (event.key === "Enter") {
        if (["heading-one", "heading-two"].includes(anchorBlock.type)) {
          editor
            .splitBlock()
            .setBlocks('paragraph');
          return null; // Prevent 'Enter' from creating a new block
        }
      }
      return next();
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

export default Blocks;