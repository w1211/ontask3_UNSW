import React from "react";

function History(options) {
  return {
    queries: {
      renderUndoButton(editor) {
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
      },
      renderRedoButton(editor) {
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
      }
    }
  };
};

export default History;