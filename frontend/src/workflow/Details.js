import React from 'react';

import { Table, Tag, Cascader, Form, Button } from 'antd';
// import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
// import HTML5Backend from 'react-dnd-html5-backend';
// import update from 'immutability-helper';

// import { Form, Alert, Cascader, Row, Select, Divider, Button, Modal } from 'antd';

import './Details.css';

// const confirm = Modal.confirm;
// const FormItem = Form.Item;
// const Option = Select.Option;

// const formItemLayout = {
//   style: { marginBottom: '10px' },
//   labelCol: {
//     xs: { span: 24 },
//     sm: { span: 3 }
//   },
//   wrapperCol: {
//     xs: { span: 24 },
//     sm: { span: 21 }
//   },
// };

// const panelLayout = {
//   padding: '20px 50px 20px 20px',
//   background: '#fbfbfb',
//   border: '1px solid #d9d9d9',
//   borderRadius: '6px',
//   maxWidth: '600px',
//   marginBottom: '20px',
//   position: 'relative'
// };

// const secondaryColumnRender = (labels, selectedOptions) => labels.map((label, i) => {
//   const option = selectedOptions[i];
//   if (i === labels.length - 1) {
//     return <span key={option.value}>({label})</span>;
//   } else if (i === labels.length - 2) {
//     return <span key={option.value}>{label} </span>;
//   }
//   return <span key={option.value}>{label} / </span>;
// });


// const handleUpdate = (form, onUpdate) => {
//   form.validateFields((err, values) => {
//     if (err) {
//       return;
//     }
//     // Map the cascader values to the API's expected input
//     let details = {
//       primaryColumn: {
//         datasource: values.primaryColumn.field[0],
//         field: values.primaryColumn.field[1],
//         type: values.primaryColumn.type
//       },
//       secondaryColumns: values.secondaryColumns ? values.secondaryColumns.map(secondaryColumn => {
//         return {
//           datasource: secondaryColumn.field[0],
//           field: secondaryColumn.field[1],
//           matchesWith: secondaryColumn.field[2],
//           type: secondaryColumn.type
//         }
//       }) : []
//     } 
//     onUpdate(details);
//   });
// }

// const handleClear = (form) => {
//   confirm({
//     title: 'Confirm form reset',
//     content: 'All changes made will be lost.',
//     okText: 'Reset',
//     okType: 'danger',
//     cancelText: 'Cancel',
//     onOk() {
//       form.resetFields();
//     }
//   });
// }

// const Details = ({ 
//   form, loading, error,
//   datasources, details,
//   addSecondaryColumn, deleteSecondaryColumn, onUpdate
// }) => (
//   <Form layout="horizontal">
//     <h3>Primary column</h3>
//     <Row style={{ ...panelLayout }}>
//       <FormItem
//         {...formItemLayout}
//         label="Field"
//       >
//         {form.getFieldDecorator('primaryColumn.field', {
//           initialValue: details ? [details.primaryColumn.datasource, details.primaryColumn.field] : [],
//           rules: [{ required: true, message: 'Field is required' }]
//         })(
//           <Cascader placeholder='' options={[
//             { value: 'Datasource', label: 'Datasource', disabled: true },
//             ...datasources.map((datasource) => {
//               return { 
//                 value: datasource.id, 
//                 label: datasource.name, 
//                 children: [
//                   { value: 'field', label: 'Field', disabled: true },
//                   ...datasource.fields.map(field => { return { value: field, label: field } } )
//                 ]
//               }
//             })
//             ]}>
//           </Cascader>
//         )}
//       </FormItem>
//       <FormItem
//         {...formItemLayout}
//         label="Type"
//       >
//         {form.getFieldDecorator('primaryColumn.type', {
//           initialValue: details ? details.primaryColumn.type: null,
//           rules: [{ required: true, message: 'Type is required' }]
//         })(
//           <Select>
//             <Option value="number">Number</Option>
//             <Option value="text">Text</Option>
//           </Select>
//         )}
//       </FormItem>
//     </Row>

//     <Divider dashed />

//     <h3>
//       Secondary columns
//       <Button onClick={() => addSecondaryColumn()} style={{ marginLeft: '10px' }} shape="circle" icon="plus" />
//     </h3>
//     { details && details.secondaryColumns.length > 0 ?
//       details.secondaryColumns.map((secondaryColumn, i) => {
//         return <Row style={{ ...panelLayout, marginTop:'10px' }} key={i}>
//           <FormItem
//             {...formItemLayout}
//             label="Field"
//           >
//             {form.getFieldDecorator(`secondaryColumns[${i}].field`, {
//               initialValue: secondaryColumn.datasource && secondaryColumn.field ? [secondaryColumn.datasource, secondaryColumn.field, secondaryColumn.matchesWith] : [],
//               rules: [{ required: true, message: 'Field is required' }]
//             })(
//               <Cascader displayRender={secondaryColumnRender} placeholder='' options={[
//                 { value: 'datasource', label: 'Datasource', disabled: true },
//                 ...datasources.map((datasource) => {
//                   let children = datasource.fields.map(field => { return { 
//                     value: field, 
//                     label: field
//                   }});
//                   return {
//                     value: datasource.id, 
//                     label: datasource.name,
//                     children: [
//                       { value: 'field', label: 'Field', disabled: true },
//                       ...children.map(child => {
//                         return {
//                           ...child, 
//                           children: [
//                             { value: 'match', label: 'Matches With', disabled: true },
//                             ...children.filter(innerChild => innerChild.value !== child.value)
//                           ]
//                         }
//                       })
//                     ]
//                   }
//                 })
//               ]}>
//               </Cascader>
//             )}
//           </FormItem>
//           <FormItem
//             {...formItemLayout}
//             label="Type"
//           >
//             {form.getFieldDecorator(`secondaryColumns[${i}].type`, {
//               initialValue: secondaryColumn.type,
//               rules: [{ required: true, message: 'Type is required' }]
//             })(
//               <Select>
//                 <Option value="number">Number</Option>
//                 <Option value="text">Text</Option>
//                 <Option value="date">Date</Option>
//               </Select>
//             )}
//           </FormItem>
//           <Button onClick={() => deleteSecondaryColumn(i)} shape="circle" icon="delete" type="danger" style={{ position: 'absolute', top: 10, right: 10 }}/>
//         </Row>
//       })
//     : 
//       <p style={{ margin: '1em 0' }}>Get started by adding the first secondary column.</p>
//     }

//     <Divider dashed />

//     { error && <Alert message={error} type="error"/>}
//     <Button style={{ marginRight: '10px' }} size="large" onClick={() => handleClear(form)}>Clear Changes</Button>
//     <Button loading={loading} type="primary" size="large" onClick={() => handleUpdate(form, onUpdate)}>Update Details</Button>
//   </Form>
// )

// export default Form.create()(Details)

// function dragDirection(
//   dragIndex,
//   hoverIndex,
//   initialClientOffset,
//   clientOffset,
//   sourceClientOffset,
// ) {
//   const hoverMiddleY = (initialClientOffset.y - sourceClientOffset.y) / 2;
//   const hoverClientY = clientOffset.y - sourceClientOffset.y;
//   if (dragIndex < hoverIndex && hoverClientY > hoverMiddleY) {
//     return 'downward';
//   }
//   if (dragIndex > hoverIndex && hoverClientY < hoverMiddleY) {
//     return 'upward';
//   }
// }

// let BodyRow = (props) => {
//   const {
//     isOver,
//     connectDragSource,
//     connectDropTarget,
//     moveRow,
//     dragRow,
//     clientOffset,
//     sourceClientOffset,
//     initialClientOffset,
//     ...restProps
//   } = props;
//   const style = { ...restProps.style, cursor: 'move' };

//   let className = restProps.className;
//   if (isOver && initialClientOffset) {
//     const direction = dragDirection(
//       dragRow.index,
//       restProps.index,
//       initialClientOffset,
//       clientOffset,
//       sourceClientOffset
//     );
//     if (direction === 'downward') {
//       className += ' drop-over-downward';
//     }
//     if (direction === 'upward') {
//       className += ' drop-over-upward';
//     }
//   }

//   return connectDragSource(
//     connectDropTarget(
//       <tr
//         {...restProps}
//         className={className}
//         style={style}
//       />
//     )
//   );
// };

// const rowSource = {
//   beginDrag(props) {
//     return {
//       index: props.index,
//     };
//   },
// };

// const rowTarget = {
//   drop(props, monitor) {
//     const dragIndex = monitor.getItem().index;
//     const hoverIndex = props.index;

//     // Don't replace items with themselves
//     if (dragIndex === hoverIndex) {
//       return;
//     }

//     // Time to actually perform the action
//     props.moveRow(dragIndex, hoverIndex);

//     // Note: we're mutating the monitor item here!
//     // Generally it's better to avoid mutations,
//     // but it's good here for the sake of performance
//     // to avoid expensive index searches.
//     monitor.getItem().index = hoverIndex;
//   },
// };

// BodyRow = DropTarget('row', rowTarget, (connect, monitor) => ({
//   connectDropTarget: connect.dropTarget(),
//   isOver: monitor.isOver(),
//   sourceClientOffset: monitor.getSourceClientOffset(),
// }))(
//   DragSource('row', rowSource, (connect, monitor) => ({
//     connectDragSource: connect.dragSource(),
//     dragRow: monitor.getItem(),
//     clientOffset: monitor.getClientOffset(),
//     initialClientOffset: monitor.getInitialClientOffset(),
//   }))(BodyRow)
// );

class Details extends React.Component {
  constructor(props) {
    super(props);
    const { details, datasources, formState } = props;

    if (formState && formState.columns) {
      console.log(formState)

      // const fields = [details.primaryColumn, ...details.secondaryColumns];
      this.data = formState.columns.map((column, index) => {
        return {
          key: index,
          field: column.field.value,
          type: column.type.value
        }
      });
    }

    if (datasources) {
      this.options = [
        { value: 'datasource', label: 'Datasource', disabled: true },
        ...datasources.map((datasource) => {
          let children = datasource.fields.map(field => { return { 
            value: field, 
            label: field
          }});
          return {
            value: datasource.id, 
            label: datasource.name,
            children: [
              { value: 'field', label: 'Field', disabled: true },
              ...children.map(child => {
                return {
                  ...child, 
                  children: [
                    { value: 'match', label: 'Matches With', disabled: true },
                    ...children.filter(innerChild => innerChild.value !== child.value)
                  ]
                }
              })
            ]
          }
        })
      ]
    }

  }

  // components = {
  //   body: {
  //     row: BodyRow,
  //   },
  // }

  columns = [{
    width: '50%',
    title: 'Field',
    dataIndex: 'field',
    key: 'field',
    render: (text, record, index) => {
      const datasource = this.options.find(datasource => { return datasource.value === record.field[0]});
      return (
      <span>
        {this.props.form.getFieldDecorator(`columns[${index}].field`, {
          rules: [{ required: true, message: 'Field is required' }]
        })(
          <Cascader options={this.options}>
            <a href="">{record.field[1]}</a>
          </Cascader>
        )}
        <Tag style={{ marginLeft: 7.5 }}>From: {datasource.label}</Tag>
        { (index > 0) && <Tag>Via: {record.field[2]}</Tag> }
        {(index === 0) && <Tag color="#108ee9">Primary</Tag>}
      </span>
    )}
  }, {
    title: 'type',
    dataIndex: 'type',
    key: 'type',
  }];

  // moveRow = (dragIndex, hoverIndex) => {
  //   const { data } = this.state;
  //   const dragRow = data[dragIndex];

  //   this.setState(
  //     update(this.state, {
  //       data: {
  //         $splice: [[dragIndex, 1], [hoverIndex, 0, dragRow]],
  //       },
  //     }),
  //   );
  // }

  // onChange = (value, selectedOptions) => {
  //   this.setState({
  //     text: selectedOptions.map(o => o.label).join(', '),
  //   });
  // }

  render() {
    const {
      loading, error,
      datasources, details,
      addSecondaryColumn, deleteSecondaryColumn, onUpdate
    } = this.props;

    return (
      <div>
      <Table
        columns={this.columns}
        dataSource={this.data}
        // components={this.components}
        // onRow={(record, index) => ({
        //   index,
        //   moveRow: this.moveRow,
        // })}
      />
      <Button onClick={() => { console.log(this.props); console.log(this.props.formState) }}>test</Button>
      </div>
    );
  }
}

export default Form.create({
  onFieldsChange(props, payload) {
    props.updateFormState(payload);
  },
  mapPropsToFields(props) {
    let fields = {}
    if (props.formState) {
      props.formState.columns.forEach((field, i) => {
        fields[`columns[${i}].field`] = Form.createFormField({
          ...props.formState.columns[i].field,
          value: props.formState.columns[i].field.value
        });

        fields[`columns[${i}].type`] = Form.createFormField({
          ...props.formState.columns[i].field,
          value: props.formState.columns[i].field.value
        });
      })
    }
    return fields;
  }
})(Details)
