import React from "react";

import { Popover } from "antd";
import { SketchPicker } from 'react-color';

/**
 * TODO: Change cursor color + text mark when color is changed on empty text
 */

const defaultColor = "#000000";

function Color(options) {
  return {
    renderMark(props, editor, next) {
      const { children, mark, attributes } = props;
      switch (mark.type) {
        case "color":
          return <span style={{color: mark.data.get("hex")}} {...attributes}>{children}</span>;
        default:
          return next();
      };
    }
  };
};

export function onChangeColor(editor, value, color, event) {
  // Remove Current Color
  value.activeMarks
    .filter(mark => mark.type === "color")
    .forEach(mark => editor.removeMark(mark));

  // Add new color
  editor
    .addMark({ type: "color", data: { hex: color.hex } })
    .focus()
};

export const ColorButton = (props) => {
  const { editor, value } = props;

  const mark = value.activeMarks.find(mark => mark.type === "color" && mark.data.get("hex"));
  const currHex = (typeof mark !== 'undefined') ? mark.data.get("hex") : defaultColor;

  return (
    <Popover
      content={
        <SketchPicker
          color={currHex}
          onChangeComplete={(color, event) => onChangeColor(editor, value, color, event)}
        />
      }
    >
      <i
        className="material-icons"
        style={{ color: currHex }}
      >
        format_color_text
      </i>
    </Popover>
  );
};

export default Color;