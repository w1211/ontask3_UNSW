import React from "react";

import { Select } from "antd";

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
              editor.insertInline({
                type: "attribute",
                data: { field },
                isVoid: true
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
      const { attributes, node } = props;

      switch (node.type) {
        case "attribute":
          const field = node.data.get("field");
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
              {field}
            </span>
          );
        default:
          return next();
      };
    }
  };
};

// export const AttributeButton = (props) => {
//   return (
//     <Select
//       placeholder="Add a field"
//       size="small"
//       value={undefined}
//       onChange={field => {
//         props.editor.insertInline({
//           type: "attribute",
//           data: { field },
//           isVoid: true
//         });
//       }}
//       className="attribute_select"
//       dropdownMatchSelectWidth={false}
//     >
//       {props.order.map((item, i) => (
//         <Select.Option value={item} key={i}>
//           {item}
//         </Select.Option>
//       ))}
//     </Select>
//   );
// };

export default Attribute;