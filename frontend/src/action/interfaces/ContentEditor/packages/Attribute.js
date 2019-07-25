import React from "react";

import { Select } from "antd";

/**
 * TODO
 * The attribute text shouldn't be able to be edited (can be deleted in one go)
 */

function Attribute(options) {
  return {
    queries: {
      renderAttributeButton(editor, order) {
        return (
          <Select
            placeholder="Add a field"
            size="small"
            value={undefined}
            onChange={field => {
              editor
                .insertText(field)
                .moveFocusBackward(field.length)
                .wrapInline({
                  type: "attribute",
                  data: { field }
                });
            }}
            className="attribute_select"
            dropdownMatchSelectWidth={false}
          >
            {order.map((item, i) => (
              <Select.Option value={item} key={i}>
                {item}
              </Select.Option>
            ))}
          </Select>
        );
      }
    },
    renderInline(props, editor, next) {
      const { attributes, children, node } = props;

      switch (node.type) {
        case "attribute":
          return (
            <span
              {...attributes}
              style={{
                display: "inline-block",
                padding: "0 5px",
                lineHeight: "1.25em",
                background: "#eee"
              }}
            >
              {children}
            </span>
          );
        default:
          return next();
      };
    }
  };
};

export default Attribute;