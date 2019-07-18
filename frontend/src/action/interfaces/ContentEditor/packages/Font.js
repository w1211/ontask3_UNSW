import React from "react";

import { Select } from "antd";

import FontList from './FontList';

const { Option } = Select;

/**
 * TODO: FontSize
 * TODO: Default Change Default Font to Arial?
 * Keep Text Highlighting after clicking on Font Select

 */

const defaultFont = "Arial";

function Font(options) {
  return {
    renderMark(props, editor, next) {
      const { children, mark, attributes } = props;
      switch (mark.type) {
        case "font-family":
          const fontStack = FontList[mark.data.get("font")]["stack"];
          const fontStackString = fontStack.join(", ");
          return <span style={{fontFamily: fontStackString}} {...attributes}>{children}</span>;
        default:
          return next();
      };
    }
  };
};

// TODO
export function onChangeFontSize() {
};

//TODO
export function FontSizeSelect() {

};

export function onChangeFontFamily(editor, value, font) {
  value.activeMarks
    .filter(mark => mark.type === "font-family")
    .forEach(mark => editor.removeMark(mark));
  // Remove Current fontfamily
  value.activeMarks
    .filter(mark => mark.type === "font-family")
    .forEach(mark => editor.removeMark(mark));

  // Add new fontfamily
  editor
    .addMark({ type: "font-family", data: { font: font } })
    .focus();
};

export const FontFamilySelect = (props) => {
  const { editor, value } = props;

  const mark = value.activeMarks.find(mark => mark.type === "font-family" && mark.data.get("font"));
  const currMark = (typeof mark !== 'undefined') ? mark.data.get("font") : defaultFont;

  const options = Object.keys(FontList).map((key, index) =>
    <Option value={key} key={index}>{key}</Option>
  );

  return (
    <Select
      showSearch
      autoFocus
      size="small"
      value={currMark}
      placeholder="Select a font"
      className="attribute_select"
      optionFilterProp="children"
      onChange={(font) => onChangeFontFamily(editor, value, font)}
      filterOption={(input, option) =>
        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {options}
    </Select>
  );
};

export default Font;