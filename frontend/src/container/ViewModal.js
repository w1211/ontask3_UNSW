import React from 'react';

import { Modal, Form, Alert, Input, Steps, Button, Select, Icon, Tooltip, Table, Cascader, Tag } from 'antd';

import './ViewModal.css';

const FormItem = Form.Item;
const Step = Steps.Step;
const { Option, OptGroup } = Select;

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

const Primary = ({ form, formState, options, view }) => {
  return (
    <div>
      <FormItem
        {...formItemLayout}
        label="Primary key"
      >
        {form.getFieldDecorator('primary', {
          rules: [{ required: true, message: 'Primary key is required' }],
          initialValue: formState && formState.primary ? formState.primary.value : undefined
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

const Fields = ({ form, formState, options, view, chosenDatasources, onChange }) => {
  return (
    <div>
      <FormItem
        {...formItemLayout}
        label="Fields"
      >
        {form.getFieldDecorator('fields', {
          initialValue: formState && formState.fields ? formState.fields.value : undefined
        })(
          <Select mode="multiple" onChange={onChange}>
            {options}
          </Select>
        )}
      </FormItem>
      {
        chosenDatasources && chosenDatasources.length > 0 &&
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
              {form.getFieldDecorator(`matching[${i}]`, {
                rules: [{ required: true, message: 'Matching field is required' }],
                initialValue: formState && formState.matching && formState.matching[i] ? formState.matching[i].value : undefined
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

const Preview = ({ form, formState, datasources }) => {
  if (!datasources) return null;

  const cascaderOptions = [
    // First item is an uneditable header with the label 'Datasources'
    { value: 'datasource', label: 'Datasource', disabled: true },
    // Iterate over the datasources
    ...datasources.map((datasource) => {
      // For each datasource, create a list of objects that each represent a field from the datasource
      let fields = datasource.fields.map(field => { return { 
        value: field, 
        label: field
      }});

      // Return an object representing this datasource of the form:
      // { value: value, label: label, children: []}
      // The 'children' array is the list of further options presented to the user after selecting a particular option
      // First the user chooses the datasource, then a field in that datasource, 
      // then another field in the same datasource that will be compared against the primary key to perform the join
      return {
        value: datasource.id, 
        label: datasource.name,
        children: [
          // First item is an uneditable header with the label 'Field'
          { value: 'field', label: 'Field', disabled: true },
          // For each field, create a list of objects that represent the REMAINING fields in the same datasource
          // I.e. fields from the same datasource other than the one currently being iterated
          ...fields.map(field => {
            return {
              ...field, 
              children: [
                // First item is an uneditable header with the label 'Matches With'
                { value: 'match', label: 'Matches With', disabled: true },
                ...fields.filter(innerChild => innerChild.value !== field.value)
              ]
            }
          })
        ]
      }
    })
  ];

  // Do not show matching fields in the cascader of the primary field
  let primaryCascaderOptions;
  // Deep clone the list of options
  primaryCascaderOptions = JSON.parse(JSON.stringify(cascaderOptions));
  primaryCascaderOptions.forEach(datasource => {
    // Skip the header row
    if (!datasource.children) return;
    // Delete the children of each field, so that choosing a field does not prompt the user to then choose a matching field
    datasource.children.forEach(field => {
      if (field.children) delete field.children;
    })
  });

  const primaryTypes = [
    { value: 'number', label: 'number' },
    { value: 'text', label: 'text' }
  ];

  const types = [...primaryTypes, { value: 'date', label: 'date' }];

  // Build the columns of the details table
  // The matching field is only included for secondary fields (the primary key does not need a matching field)
  const columns = [
    {
      width: '50%',
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      render: (text, record, index) => {        
        // Get the cascader option representing the datasource of this record
        const datasourceOption = record.field.length > 0 ? cascaderOptions.find(datasource => datasource.value === record.field[0]) : undefined;
        return (
          <span>
            {form.getFieldDecorator(`columns[${index}].field`, {
              rules: [{ required: true, message: 'Field is required' }]
            })(
              <Cascader options={(index > 0) ? cascaderOptions : primaryCascaderOptions}>
                <a>{record.field[1]}</a>
              </Cascader>
            )}
            { (record.field[0]) && <Tag style={{ marginLeft: 7.5 }}>From: {datasourceOption.label}</Tag> }
            { (index > 0 && record.field[2]) && <Tag>Via: {record.field[2]}</Tag> }
            { (index === 0) && <Tag color="#108ee9">Primary</Tag> }
          </span>
        )
      }
    }, {
      width: '50%',
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record, index) => {
        return (
          <span>
            {form.getFieldDecorator(`columns[${index}].type`, {
              rules: [{ required: true, message: 'Type is required' }]
            })(
              <Cascader options={(index > 0) ? types : primaryTypes} popupClassName="types">
                <a>{record.type}</a>
              </Cascader>
            )}
          </span>
        )
      }
    }
  ];

  // Build the data that will populate the details table
  // The table has two columns - field (cascader component) and type (select component)
  // Input for the cascader is of the form [datasource_id, field_name, matching_field_name]
  // Except for the primary field, which is only [datasource_id, field_name] (excludes matching_field_name)
  const [primaryDatasourceIndex, primaryFieldIndex] = formState.primary.value.split('_');
  const primaryField = [datasources[primaryDatasourceIndex].id, datasources[primaryDatasourceIndex].fields[primaryFieldIndex]];

  // TODO: if form value for primary key's type is not set, then guess the type of the primary key
  // Iterate over secondary fields:
  //    if form value for secondary field's matching_field is not set, then take the value from the matching[i] form value
  //    if form value for secondary field's type is not set, then guess the type of the secondary field

  // ON DRAG SORT: change order of the fields[] form value, which should have a knock-on effect to the table's order of rendering field rows
  
  console.log(primaryField);
  // const options = [
  //   { key: 0, field: [formState.primary.], type: column.type.value }
  // ]

  return (
    <div>
      test
      {/* <Table
        columns={columns}
        className="details"
        dataSource={this.data}
        // components={this.components}
        // onRow={(record, index) => ({
        //   index,
        //   moveRow: this.moveRow,
        // })}
      /> */}
    </div>
  );
}

class ViewModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      current: 0,
      chosenDatasources: []
    };
  }

  next() {
    const current = this.state.current + 1;
    this.setState({ current });
  }

  prev() {
    const current = this.state.current - 1;
    this.setState({ current });
  }

  onFieldsChange(e, formState, datasources) {
    let chosenDatasources = new Set([]);
    e.forEach(checkedField => { 
      const [datasourceIndex, fieldIndex] = checkedField.split('_');
      chosenDatasources.add(datasources[datasourceIndex]);
    });
    // Remove the datasource of the primary key
    // As it can be assumed that all fields in the datasource will use the primary key as their matching field
    const [primaryDatasource, _] = formState.primary.value.split('_');
    chosenDatasources.delete(datasources[primaryDatasource]);

    // The datasource objects themselves are stored in a list in the state
    this.setState({ chosenDatasources: [...chosenDatasources] });
  }

  componentWillUpdate(nextProps, nextState) {
    const { datasources, form, view, formState } = nextProps;
    const { chosenDatasources } = nextState;

    const selectOptions = datasources && datasources.map((datasource, i) => {
      return (
        <OptGroup label={datasource.name} key={datasource.name}>
          {datasource.fields.map((field, j) => {
            return <Option value={`${i}_${j}`} key={`${i}_${j}`}>{field}</Option>
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
      />,
    }, {
      title: 'Fields',
        content: <Fields 
        form={form}
        formState={formState}
        options={selectOptions}
        view={view}
        chosenDatasources={chosenDatasources}

        onChange={(e) => { this.onFieldsChange(e, formState, datasources) }}
      />,
    }, {
      title: 'Preview',
      content: <Preview
        form={form}
        formState={formState}
        datasources={datasources}
      />,
    }]
  }

  handleNext() {
    const { form } = this.props;
    const { current, chosenDatasources } = this.state;

    // Names of the form fields that should be validated at each step
    // Prevents the user from moving to the next step in the stepper unless all fields in the current step are valid
    const validationMap = [
      ['primary'],
      // If fields from a datasource other than the primary are chosen, then require that the matching fields be specified
      chosenDatasources ? [...chosenDatasources.map((_, i) => (`matching[${i}]`))] : [],
      []
    ];
    
    form.validateFields(validationMap[current], (err, values) => {
      if (err) return;
      this.next();
    });
  }

  render() {
    const { current } = this.state;
    const { 
      form, visible, loading, error, containerId, datasources, views, view,
      onChange, onCreate, onUpdate, onCancel, onDelete
    } = this.props;

    return (
      <Modal
        visible={visible}
        title='Views'
        onCancel={() => { form.resetFields(); onCancel(); }}
        footer={
          <div>
            <Button onClick={() => { form.resetFields(); onCancel(); }}>Cancel</Button> 
            {  (current > 0) && 
              <Button onClick={() => { this.prev() }}>Previous</Button> 
            }
            { (this.steps && current < this.steps.length - 1) ?
              <Button type="primary" onClick={() => { this.handleNext() }}>Next</Button>
            :
              <Button type="primary">{ view ? "Update" : "Create" }</Button>
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
      
      fields['primary'] = formState.primary && Form.createFormField({
        ...formState.primary,
        value: formState.primary.value
      });

      fields['fields'] = formState.fields && Form.createFormField({
        ...formState.fields,
        value: formState.fields.value
      });

      // Note that the index of an item in the 'matching' array is NOT the index of the datasource in the list of datasources
      // The 'matching' array is only a subset of the datasources list, i.e. those datasources in which a field has been chosen
      formState.matching && formState.matching.forEach((_, i) => {
        fields[`matching[${i}]`] = Form.createFormField({
          ...formState.columns[i],
          value: formState.columns[i].value
        });
      })

    }
    return fields;
  }
})(ViewModal)
