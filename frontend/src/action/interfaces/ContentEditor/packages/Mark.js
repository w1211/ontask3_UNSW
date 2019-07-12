import React from "react";

import { isKeyHotkey } from "is-hotkey";

function Mark(options) {
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

export function hasMark(value, type) {
  return value.activeMarks.some(mark => mark.type === type);
};

export function renderMarkButton(editor, value, type, icon) {
  const isActive = hasMark(value, type);

  return (
    <i
      className={`material-icons ${isActive ? "active" : ""}`}
      onMouseDown={(event) => onClickMark(event, editor, type)}
    >
      {icon}
    </i>
  );
};

export function onClickMark(event, editor, type) {
  event.preventDefault();
  editor.toggleMark(type);
};

export default Mark;