import React from 'react';

import { Modal, Form, Alert, Steps, Button, Select, Icon, Tooltip, Table, Cascader, Tag, Radio } from 'antd';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import './ViewModal.css';

const FormItem = Form.Item;
const Step = Steps.Step;
const { Option, OptGroup } = Select;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const confirm = Modal.confirm;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};


// const handleOk = (form) => {
//   form.validateFields((err, values) => {
//     if (err) {
//       return;
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
    if (dragRow.index !== 0 && direction === 'downward') {
      className += ' drop-over-downward';
    }
    if (restProps.index !== 0 && direction === 'upward') {
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
    if (dragIndex === hoverIndex) return;

    // Don't allow movements to or from the primary key
    if (dragIndex === 0 || hoverIndex === 0) return;

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


const Primary = ({ form, formState, options, view, onChange }) => {
  const confirmChange = (e) => {
    // If the primary key already has a value, then prompt the user if they want to change it
    // If changing an existing value, then all other form values will be reset
    let currentPrimary = form.getFieldValue('primary');

    if (currentPrimary) {
      // Present a confirmation dialog to the user
      confirm({
        title: 'Change primary key',
        content: 'Any settings configured for this view will need to be re-entered if you change the primary key. Are you sure you want to proceed?',
        onOk() {
          onChange(e);
        }
      });
      // getValueFromEvent() doesn't support waiting for the result of the confirmation dialog, it expects a value immediately
      // So by default, we return the previous value of the primary field
      // If the user proceeds at the confirm dialog, then manually set the primary field to the new value
      return currentPrimary;
    // Primary key doesn't have a value yet, so no confirmation is needed
    } else {
      onChange(e);
      return e;
    }
  };

  return (
    <div>
      <FormItem
        {...formItemLayout}
        label="Primary key"
      >
        {form.getFieldDecorator('primary', {
          rules: [{ required: true, message: 'Primary key is required' }],
          initialValue: formState && formState.primary ? formState.primary.value : undefined,
          getValueFromEvent: confirmChange
        })(
          <Select>
            {options}
          </Select>
        )}
      </FormItem>
      <Alert style={{ marginTop: 10 }} message="Informational Notes" type="info" showIcon/>
    </div>
  )
}

const Fields = ({ form, formState, datasources, options, view, onChangeFields, onChangeDefaultMatchingField }) => {
  if (!datasources || !formState) return null;

  let chosenDatasources = new Set([]);
  if (formState.fields && formState.fields.value.length > 0) {
    // Create an array of the datasources used by this view (based on fields chosen)
    // This will be used to ask for the default matching field of each datasource other than the primary key's datasource
    formState.fields.value.forEach(checkedField => { 
      const [datasourceIndex, fieldIndex] = checkedField.split('_');
      chosenDatasources.add(datasources[datasourceIndex]);
    });

    // Remove the datasource of the primary key
    // As it can be assumed that all fields in the datasource will use the primary key as their matching field
    const [primaryDatasource, _] = formState.primary.value.split('_');
    chosenDatasources.delete(datasources[primaryDatasource]);

    // Convert the set to an array
    chosenDatasources = [...chosenDatasources];
  }

  const confirmChange = (datasourceId, e) => {
    // If the matching field already has a value, then prompt the user if they want to change it
    // If changing an existing value, then all columns that use this datasource should have their matching field updated
    let currentMatchingField = form.getFieldValue(`defaultMatchingFields.${datasourceId}`);

    if (currentMatchingField) {
      // Present a confirmation dialog to the user
      confirm({
        title: 'Change matching field',
        content: 'Any custom matching fields configured for fields from this datasource will need to be re-entered if you change the default matching field. Are you sure you want to proceed?',
        onOk() {
          onChangeDefaultMatchingField(
            { datasource: datasourceId, field: e },
            { datasource: formState.columns[0].datasource.value, field: formState.columns[0].field.value,  }
          );
        }
      });
      // getValueFromEvent() doesn't support waiting for the result of the confirmation dialog, it expects a value immediately
      // So by default, we return the previous value of the primary field
      // If the user proceeds at the confirm dialog, then manually set the default matching field to the new value
      return currentMatchingField;
    // Primary key doesn't have a value yet, so no confirmation is needed
    } else {
      onChangeDefaultMatchingField(
        { datasource: datasourceId, field: e },
        { datasource: formState.columns[0].datasource.value, field: formState.columns[0].field.value,  }
      );
      return e;
    }
  };

  return (
    <div>
      <FormItem
        {...formItemLayout}
        label="Fields"
      >
        {form.getFieldDecorator('fields', {
          initialValue: formState && formState.fields ? formState.fields.value : undefined,
          // onChange should be placed within the form decorator and NOT as an attribute of the select component itself
          // Otherwise the form validation does not update correctly after changing values
          onChange: onChangeFields
        })(
          <Select mode="multiple">
            {options}
          </Select>
        )}
      </FormItem>
      {
        chosenDatasources.length > 0 &&
        <div>
          <h4 style={{ display: 'inline-block' }}>Matching fields</h4>
          <Tooltip title="prompt text">
            <Icon style={{ marginLeft: 5, cursor: 'help' }} type="question-circle-o" />
          </Tooltip>
          
          {chosenDatasources.map((datasource, i) => (
            <FormItem
              {...formItemLayout}
              label={datasource.name}
              key={i}
            >
              {form.getFieldDecorator(`defaultMatchingFields.${datasource.id}`, {
                rules: [{ required: true, message: 'Matching field is required' }],
                initialValue: formState && formState.defaultMatchingFields && formState.defaultMatchingFields[datasource.id] ? formState.defaultMatchingFields[datasource.id].value : undefined,
                getValueFromEvent: (e) => confirmChange(datasource.id, e)
              })(
                <Select key={i}>
                  {datasource.fields.map(field => <Option value={field} key={`${i}_${field}`}>{field}</Option>)}
                </Select>
              )}
            </FormItem>
          ))}

        </div>
      }
      <Alert style={{ marginTop: 10 }} message="Informational Notes" type="info" showIcon/>
    </div>
  )
}

const Details = ({ form, formState, datasources, moveRow }) => {
  if (!datasources || !formState) return null;

  // Build the columns of the details table
  // The matching field is only included for secondary fields (the primary key does not need a matching field)
  const columns = [
    {
      width: '50%',
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      render: (text, record, index) => {
        return (
          <span>
            { form.getFieldDecorator(`columns[${index}].field`, {
                rules: [{ required: true, message: 'Field is required' }],
                initialValue: record.field
              })(
                <span>{record.field}</span>
              )
            }
            { form.getFieldDecorator(`columns[${index}].datasource`, {
                rules: [{ required: true, message: 'Datasource is required' }],
                initialValue: record.datasource.id
              })(
                <Tag style={{ marginLeft: 7.5 }}>{record.datasource.name}</Tag>
              )
            }
            { (index === 0) && <Tag color="#108ee9">Primary</Tag> }
          </span>
        )
      }
    }, {
      width: '25%',
      title: 'Matching',
      dataIndex: 'matching',
      key: 'matching',
      render: (text, record, index) => {
        const fields = record.datasource.fields
          .filter(field => field !== record.field)
          .map(field => { return { value: field, label: field }});

        return (
          <span>
            { index > 0 ? 
              form.getFieldDecorator(`columns[${index}].matching`, {
                rules: [{ required: true, message: 'Matching field is required' }],
                initialValue: record.matching
              })(
                <Cascader options={fields} popupClassName="types">
                  <a>{record.matching[0]}</a>
                </Cascader>
              )
            :
              'N/A'
            }
          </span>
        )
      }
    }, {
      width: '25%',
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record, index) => {
        const primaryTypes = [
          { value: 'number', label: 'number' },
          { value: 'text', label: 'text' }
        ];
        const types = [...primaryTypes, { value: 'date', label: 'date' }];

        return (
          <span>
            {form.getFieldDecorator(`columns[${index}].type`, {
              rules: [{ required: true, message: 'Type is required' }],
              initialValue: record.type
            })(
              <Cascader options={(index > 0) ? types : primaryTypes} popupClassName="types">
                <a>{record.type[0]}</a>
              </Cascader>
            )}
          </span>
        )
      }
    }
  ];

  // Build the data that will populate the details table
  const details = formState.columns ? 
    formState.columns.map((column, index) => {
      const datasource = datasources.find(datasource => datasource.id === column.datasource.value);
      return { 
        key: index, 
        datasource: datasource,
        field: column.field.value, 
        matching: column.matching.value,
        type: column.type.value
      }
    })
  : [];

  const components = {
    body: {
      row: BodyRow,
    }
  }

  return (
    <Table
      columns={columns}
      className="details"
      dataSource={details}
      components={components}
      onRow={(record, index) => ({
        index,
        moveRow: moveRow,
      })}
    />
  );
}

const Data = ({ form, formState }) => {
  if (!formState) return null;

  // Build the columns of the data table
  const columns = formState.columns ? 
    formState.columns.map(column => ({
      dataIndex: column.field.value,
      key: column.field.value
    }))
  : [];

  return (
    <div>
      <Alert style={{ marginTop: 10 }} message="Note that only the first 10 records are shown in this data preview" type="info" showIcon/>
    </div>
    // <Table
    //   columns={columns}
    //   className="data"
    //   // dataSource={details}
    // />
    
  );
}

const Preview = ({ form, formState, datasources, moveRow, viewMode, onChangeViewMode }) => {
  return (
    <div>
      <RadioGroup defaultValue="details" onChange={ (e) => { onChangeViewMode(e.target.value); }}>
        <RadioButton value="details">Details</RadioButton>
        <RadioButton value="data">Data</RadioButton>
      </RadioGroup>

      { viewMode === 'details' &&
        <Details
          form={form}
          formState={formState}
          datasources={datasources}
          moveRow={moveRow}
          viewMode={viewMode}
          onChangeViewMode={onChangeViewMode}
        />
      }

      { viewMode === 'data' &&
        <Data
          form={form}
          formState={formState}
        />
      }
    </div>
  );
}

const ResolveMatchModal = ({ form, formState, visible, fieldMatchResult, matchingField, onCancel, onOk }) => {
  if (!fieldMatchResult || !formState) return null;

  const primaryKey = { datasource: formState.columns[0].datasource.value, field: formState.columns[0].field.value };
  
  const mismatchedPrimaryRecords = fieldMatchResult.primary;
  const mismatchedMatchingFieldRecords = fieldMatchResult.matching;

  return (
    <Modal
      visible={visible}
      title={
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Icon type="exclamation-circle" style={{ marginRight: 5, color: '#faad14', fontSize: '150%'}}/>
          Resolve Match Conflict
        </div>
      }
      onCancel={onCancel}
      onOk={onOk}
      width={400}
    >
      <p>Record mismatches have been detected between the primary key and the matching field. How should these discrepencies be handled?</p>
      { mismatchedPrimaryRecords && 
        <div style={{ position: 'relative' }}>
          <p>The following records occur in the primary key but not in the matching field:</p>
          <Table 
            size="small"
            pagination={{ size: 'small', pageSize: 5 }}
            dataSource={mismatchedPrimaryRecords.map((record, index) => ({ key: index, record: record }))}
            columns={[{ title: 'Record', dataIndex: 'record', key: 'record' }]}
          />
          {form.getFieldDecorator(`dropDiscrepencies.${primaryKey.datasource}.${primaryKey.field}`, {
            rules: [{ required: true }]
          })(
            <RadioGroup style={{ position: 'absolute', bottom: '17px' }}>
              <Radio value={true}>Drop</Radio>
              <Radio value={false}>Keep</Radio>
            </RadioGroup>
          )}
        </div>
      }
      { mismatchedMatchingFieldRecords &&
        <div style={{ position: 'relative' }}>
          <p>The following records occur in the matching field but not in the primary key:</p>
          <Table 
            size="small"
            pagination={{ size: 'small', pageSize: 5 }}
            dataSource={mismatchedMatchingFieldRecords.map((record, index) => ({ key: index, record: record }))}
            columns={[{ title: 'Record', dataIndex: 'record', key: 'record' }]}
          />
          {form.getFieldDecorator(`dropDiscrepencies.${matchingField.datasource}.${matchingField.field}`, {
            rules: [{ required: true }]
          })(
            <RadioGroup style={{ position: 'absolute', bottom: '17px' }}>
              <Radio value={true}>Ignore</Radio>
              <Radio value={false}>Add</Radio>
            </RadioGroup>
          )}
        </div>
      }
      { (form.getFieldError(`dropDiscrepencies.${primaryKey.datasource}.${primaryKey.field}`) || form.getFieldError(`dropDiscrepencies.${matchingField.datasource}.${matchingField.field}`)) &&
        <span style={{ color: '#f5222d' }}>Conflicts must be resolved before continuing</span>
      }
    </Modal>
  )
}

class ViewModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      current: 0,
      viewMode: 'details',
      resolveMatchVisible: false
    };
  }

  moveRow = (dragIndex, hoverIndex) => {
    const { onChangeColumnOrder } = this.props;
    onChangeColumnOrder(dragIndex, hoverIndex);
  }

  componentWillReceiveProps(nextProps) {
    const { fieldMatchResult } = nextProps;
    
    if (fieldMatchResult && fieldMatchResult.error) {

    } else if (fieldMatchResult && (fieldMatchResult.primary || fieldMatchResult.matching)) {
      this.setState({ resolveMatchVisible: true });
    };

  }

  componentWillUpdate(nextProps, nextState) {
    const { 
      datasources, form, view, formState,
      onChangePrimary, onChangeFields, onChangeDefaultMatchingField 
    } = nextProps;
    const { viewMode } = nextState;

    const selectOptions = datasources && datasources.map((datasource, i) => {
      return (
        <OptGroup label={datasource.name} key={datasource.name}>
          {datasource.fields.map((field, j) => {
            return <Option value={`${i}_${j}`} key={`${i}_${j}`} disabled={formState && formState.primary && formState.primary.value === `${i}_${j}`}>{field}</Option>
          })}
        </OptGroup>
      )
    });

    this.steps = [{
      title: 'Primary',
      content: <Primary 
        form={form}
        formState={formState}
        options={selectOptions}
        view={view}

        onChange={ (e) => onChangePrimary(e) }
      />
    }, {
      title: 'Fields',
        content: <Fields 
        form={form}
        formState={formState}
        datasources={datasources}
        options={selectOptions}
        view={view}

        onChangeFields={ (e) => onChangeFields(e) }
        onChangeDefaultMatchingField={ (matchingField, primaryKey) => { onChangeDefaultMatchingField(matchingField, primaryKey) }}
      />,
    }, {
      title: 'Preview',
      content: <Preview
        form={form}
        formState={formState}
        datasources={datasources}
        components={this.components}
        moveRow={this.moveRow}
        viewMode={viewMode}

        onChangeViewMode={(e) => this.setState({ viewMode: e }) }
      />,
    }]
  }

  storeFormValues(values) {
    const formValues = { ...this.state.formValues, ...values };
    this.setState({ formValues });
  }

  next(values) {
    const current = this.state.current + 1;
    this.setState({ current });
  }

  prev() {
    const current = this.state.current - 1;
    this.setState({ current });
  }

  handleNext() {
    const { form, formState } = this.props;
    const { current } = this.state;

    // Validates the form fields that are currently in the DOM
    // I.e. validates only the form fields that are in the current step, NOT all form fields
    form.validateFields((err, values) => {
      if (err) return;
      this.storeFormValues(values)
      this.next(values);
    });
  }

  handleResolveConflict = () => {
    const { form, formState, onConfirmResolveFieldMatch } = this.props;

    form.validateFields((err, values) => {
      if (err) return;
      this.storeFormValues(values)
      this.setState({ resolveMatchVisible: false }); 
      onConfirmResolveFieldMatch();
    });
  }

  render() {
    const { current, resolveMatchVisible } = this.state;
    const { 
      form, visible, loading, error, datasources, views, view, fieldMatchResult, matchingField,
      onChange, onCreate, onUpdate, onCancel, onDelete, formState, onCancelResolveFieldMatch
    } = this.props;
    
    return (
      <Modal
        visible={visible}
        title='Views'
        onCancel={() => { form.resetFields(); this.setState({ current: 0 }); onCancel(); }}
        footer={
          <div>
            <Button onClick={() => { form.resetFields(); onCancel(); }}>Cancel</Button> 
            {  (current > 0) && 
              <Button onClick={() => { this.prev() }}>Previous</Button> 
            }
            <Button onClick={() => console.log(formState) }>FormState</Button>
            { (this.steps && current < this.steps.length - 1) ?
              <Button type="primary" onClick={() => { this.handleNext() }}>Next</Button>
            :
              <Button type="primary" onClick={() => { form.validateFields((err, values) => { console.log({...this.state.formValues, ...values}) }) }}>{ view ? "Update" : "Create" }</Button>
            }
          </div>
        }
        confirmLoading={loading}
        className="views" 
      >
        <Form layout="horizontal">
          <Steps current={current}>
            {this.steps && this.steps.map(step => {
              return <Step key={step.title} title={step.title} />
            })}
          </Steps>

          <div className="steps-content">
            {this.steps && this.steps[current].content}
          </div>

          <ResolveMatchModal 
            form={form}
            formState={formState}
            visible={resolveMatchVisible}
            fieldMatchResult={fieldMatchResult}
            matchingField={matchingField}

            onCancel={() => { this.setState({ resolveMatchVisible: false }); onCancelResolveFieldMatch(); }}
            onOk={this.handleResolveConflict}
          />

          { error && <Alert message={error} type="error"/>}
        </Form>
      </Modal>
    )
  }
}

export default Form.create({
  onFieldsChange(props, payload) {
    props.updateFormState(payload);
  },
  mapPropsToFields(props) {
    const formState = props.formState;
    let fields = {}

    if (formState) {
      
      fields['primary'] = formState.primary && Form.createFormField(formState.primary);

      fields['fields'] = formState.fields && Form.createFormField(formState.fields);

      formState.defaultMatchingFields && Object.entries(formState.defaultMatchingFields).forEach(([key, value]) => {
        fields[`defaultMatchingFields.${key}`] = Form.createFormField(formState.defaultMatchingFields[key]);
      })

      formState.columns && formState.columns.forEach((_, i) => {
        fields[`columns[${i}]`] = Form.createFormField(formState.columns[i]);
      })

    }
    return fields;
  }
})(DragDropContext(HTML5Backend)(ViewModal))
