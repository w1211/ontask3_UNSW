import React from "react";

const DEFAULT_NODE = "paragraph";

/**
 * TODO: [!HIGH PRIORITY] Fix issue where heading converted to paragraph deletes the block
 * TODO: Press Enter on Heading -> Convert to Paragraph
 */

function Block(options) {
  return {
    queries: {
      hasBlock(editor, type) {
        return editor.value.blocks.some(node => node.type === type);
      },
      hasParentType(editor, type) {
        const { value } = editor;
        return value.blocks.some(
          block => !!value.document.getClosest(block.key, parent => parent.type === type)
        );
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
          // const isCondition = editor.hasBlock("condition");
          const isType = editor.hasParentType(type);

          if (isList && isType) {
            // Is a list and of the same type
            editor
              .setBlocks(DEFAULT_NODE)
              .unwrapBlock("bulleted-list")
              .unwrapBlock("numbered-list");
          } else if (isList) {
            // Is a list, but of the opposite type
            editor
              .unwrapBlock(type === "bulleted-list" ? "numbered-list" : "bulleted-list")
              .wrapBlock(type);
          } else {
            // Not a list
            editor
              .setBlocks("list-item")
              .wrapBlock(type);
          }
        }
      },
      applyUnorderedList(editor) {
        editor
          .setBlocks('list-item')
          .wrapBlock('bulleted-list');
      },
      applyOrderedList(editor) {
        editor
          .setBlocks('list-item')
          .wrapBlock('numbered-list');
      },
      onlyRemoveUnorderedList(editor) {
        editor.unwrapBlock('bulleted-list');
      },
      onlyRemoveOrderedList(editor) {
        editor.unwrapBlock('numbered-list');
      },
      increaseListDepth(editor) {
        const isList = editor.hasBlock("list-item");
        if (!isList) return editor;
        if (editor.hasParentType('bulleted-list')) editor.applyUnorderedList();
        if (editor.hasParentType('numbered-list')) editor.applyOrderedList();
      },
      decreaseListDepth(editor) {
        const isList = editor.hasBlock("list-item");
        if (!isList) return editor;
        if (editor.hasParentType('bulleted-list')) editor.onlyRemoveUnorderedList();
        if (editor.hasParentType('numbered-list')) editor.onlyRemoveOrderedList();
      }
    },
    onKeyDown(event, editor, next) {
      const getCurrentBlock = editor.value.blocks.get(0);
      if (event.key === 'Tab') {
        event.preventDefault();
        if (event.shiftKey) editor.decreaseListDepth();
        else editor.increaseListDepth();
      }
      // // Press Enter

      // if (event.key === "Enter") {
      //   if (getCurrentBlock.type === "heading-one" || getCurrentBlock.type === "heading-two" ) {
      //     editor
      //       .splitBlock()
      //       .setBlocks('paragraph');
      //   }
      // }
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

export default Block;