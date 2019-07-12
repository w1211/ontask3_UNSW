import React from "react";

/**
 * TODO:
 * Colour Button
 * s
 * s
 * @param {*} options 
 */

function Color(options) {
  const { type, hotkey } = options;

  const isHotkey = isKeyHotkey(hotkey);

  return {
    onKeyDown(event, editor, next) {
      if (isHotkey(event)) {
        editor.toggleMark(type);
      }
      return next();
    },
    renderMark(props, editor, next) {
      const { children, mark, attributes } = props;
      switch (mark.type) {
        case "bold":
          return <strong {...attributes}>{children}</strong>;
        case "code":
          return <code {...attributes}>{children}</code>;
        case "italic":
          return <em {...attributes}>{children}</em>;
        case "underlined":
          return <u {...attributes}>{children}</u>;
        default:
          return next();
      };
    }
  };
};