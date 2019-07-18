import React from "react";

export const UndoButton = (props) => {
  const { editor } = props;

  return (
    <i
      className={"material-icons"}
      onMouseDown={(event) => {
        event.preventDefault();
        editor.undo();
      }}
    >
      undo
    </i>
  );
};

export const RedoButton = (props) => {
  const { editor } = props;

  return (
    <i
      className={"material-icons"}
      onMouseDown={(event) => {
        event.preventDefault();
        editor.redo();
      }}
    >
      redo
    </i>
  );
};