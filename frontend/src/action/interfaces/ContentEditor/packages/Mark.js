import React from "react";

import { isKeyHotkey } from "is-hotkey";

function Mark(options) {
  const { type, hotkey } = options;

  const isHotkey = isKeyHotkey(hotkey);

  return {
    queries: {
      hasMark(editor, type) {
        return editor.value.activeMarks.some(mark => mark.type === type);
      },
      renderMarkButton(editor, type, icon) {
        const isActive = editor.hasMark(type);
        return (
          <i
            className={`material-icons ${isActive ? "active" : ""}`}
            onMouseDown={(event) => {
              event.preventDefault();
              editor.toggleMark(type);
            }}
          >
            {icon}
          </i>
        );
      }
    },
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

export default Mark;