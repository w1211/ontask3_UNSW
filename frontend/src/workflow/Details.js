import React from 'react';

import { Table, Tag, Cascader, Form, Button, Alert } from 'antd';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import update from 'immutability-helper';

import './Details.css';

// const confirm = Modal.confirm;

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

function dragDirection(
  dragIndex,
  hoverIndex,
  initialClientOffset,
  clientOffset,
  sourceClientOffset,
) {
  const hoverMiddleY = (initialClientOffset.y - sourceClientOffset.y) / 2;
  const hoverClientY = clientOffset.y - sourceClientOffset.y;
  if (dragIndex < hoverIndex && hoverClientY > hoverMiddleY) {
    return 'downward';
  }
  if (dragIndex > hoverIndex && hoverClientY < hoverMiddleY) {
    return 'upward';
  }
}

let BodyRow = (props) => {
  const {
    isOver,
    connectDragSource,
    connectDropTarget,
    moveRow,
    dragRow,
    clientOffset,
    sourceClientOffset,
    initialClientOffset,
    ...restProps
  } = props;
  const style = { ...restProps.style, cursor: 'move' };

  let className = restProps.className;
  if (isOver && initialClientOffset) {
    const direction = dragDirection(
      dragRow.index,
      restProps.index,
      initialClientOffset,
      clientOffset,
      sourceClientOffset
    );
    if (direction === 'downward') {
      className += ' drop-over-downward';
    }
    if (direction === 'upward') {
      className += ' drop-over-upward';
    }
  }

  return connectDragSource(
    connectDropTarget(
      <tr
        {...restProps}
        className={className}
        style={style}
      />
    )
  );
};

const rowSource = {
  beginDrag(props) {
    return {
      index: props.index,
    };
  },
};

const rowTarget = {
  drop(props, monitor) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Time to actually perform the action
    props.moveRow(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  },
};

BodyRow = DropTarget('row', rowTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  sourceClientOffset: monitor.getSourceClientOffset(),
}))(
  DragSource('row', rowSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    dragRow: monitor.getItem(),
    clientOffset: monitor.getClientOffset(),
    initialClientOffset: monitor.getInitialClientOffset(),
  }))(BodyRow)
);

const handleUpdate = (form, onUpdate) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    onUpdate(values);
  });
}

class Details extends React.Component {
  constructor(props) {
    super(props);
    const { datasources, formState } = props;

    if (formState && formState.columns) {
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
        // First item is an uneditable header with the label 'Datasources'
        { value: 'datasource', label: 'Datasource', disabled: true },
        // Iterate over the datasources
        ...datasources.map((datasource) => {
          // For each datasource, create a list of objects that each represent a field from the datasource
          let children = datasource.fields.map(field => { return { 
            value: field, 
            label: field
          }});

          // Return an object representing this datasource of the form:
          // { value: value, label: label, children: []}
          // Children is a list of objects that each represent a field belonging to this particular datasource
          return {
            value: datasource.id, 
            label: datasource.name,
            children: [
              // First item is an uneditable header with the label 'Field'
              { value: 'field', label: 'Field', disabled: true },
              // For each field, create a list of objects that represent the REMAINING fields in the same datasource
              // I.e. fields from the same datasource other than the one currently being iterated
              ...children.map(child => {
                return {
                  ...child, 
                  children: [
                    // First item is an uneditable header with the label 'Matches With'
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

  componentWillReceiveProps(nextProps) {
    let formState = nextProps.formState;
    if (formState && formState.columns) {
      this.data = formState.columns.map((column, index) => {
        return {
          key: index,
          field: column.field.value,
          type: column.type.value
        }
      });
    }
  }

  components = {
    body: {
      row: BodyRow,
    }
  }

  columns = [
    {
      width: '50%',
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      render: (text, record, index) => {
        const datasource = record.field.length > 0 ? this.options.find(datasource => { return datasource.value === record.field[0]}) : undefined;
        // Do not show matching fields in the cascader of the primary field
        let primaryFieldOptions;
        if (index == 0) {
          // Deep clone the list of options
          primaryFieldOptions = JSON.parse(JSON.stringify(this.options));
          primaryFieldOptions.forEach(datasource => {
            // Skip the header row
            if (!datasource.children) return;
            // Delete the children of each field, so that choosing a field does not prompt the user to then choose a matching field
            datasource.children.forEach(field => {
              if (field.children) delete field.children;
            })
          })
        }

        return (
          <span>
            {this.props.form.getFieldDecorator(`columns[${index}].field`, {
              rules: [{ required: true, message: 'Field is required' }]
            })(
              <Cascader options={(index > 0) ? this.options : primaryFieldOptions}>
                <a>{record.field[1] ? record.field[1] : 'UNSPECIFIED'}</a>
              </Cascader>
            )}
            { (record.field[0]) && <Tag style={{ marginLeft: 7.5 }}>From: {datasource.label}</Tag> }
            { (index > 0 && record.field[2]) && <Tag>Via: {record.field[2]}</Tag> }
            { (index === 0) && <Tag color="#108ee9">Primary</Tag> }
          </span>
        )
      }
    }, {
      width: '25%',
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record, index) => {
        let types = [
          { value: 'number', label: 'number' },
          { value: 'text', label: 'text' }
        ];
        if (index > 0) types.push({ value: 'date', label: 'date' });

        return (
          <span>
            {this.props.form.getFieldDecorator(`columns[${index}].type`, {
              rules: [{ required: true, message: 'Type is required' }]
            })(
              <Cascader options={types} popupClassName="types">
                <a>{record.type ? record.type : 'UNSPECIFIED'}</a>
              </Cascader>
            )}
          </span>
        )
      }
    }, {
      width: '25%',
      title: 'Actions',
      key: 'action',
      render: (text, record, index) => (
        <span>
          <a onClick={() => { this.props.deleteColumn(index) }}>Delete</a>
        </span>
      )
    }
  ];

  moveRow = (dragIndex, hoverIndex) => {
    const { changeColumnOrder } = this.props;
    changeColumnOrder(dragIndex, hoverIndex);
  }

  render() {
    const {
      loading, error, datasources,
      addColumn, onUpdate, form
    } = this.props;

    return (
      <div>
        <div style={{ marginBottom: 10 }}>
          <Button icon="plus" onClick={() => { addColumn() }}>Add column</Button>
          <Button style={{ marginLeft: 10 }} type="primary" onClick={() => { handleUpdate(form, onUpdate) }}>Save</Button>
        </div>
        { error && <Alert message={error} type="error"/>}
        <Table
          columns={this.columns}
          className="details"
          dataSource={this.data}
          components={this.components}
          onRow={(record, index) => ({
            index,
            moveRow: this.moveRow,
          })}
        />
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
          ...props.formState.columns[i].type,
          value: props.formState.columns[i].type.value
        });
      })
    }
    return fields;
  }
})(DragDropContext(HTML5Backend)(Details))
