import React from 'react';
import { Icon, Tooltip, Table, Cascader, Tag } from 'antd';

import dragSort from '../../shared/DragSort';


const Details = ({ form, formState, datasources, moveRow }) => {
  if (!datasources || !formState) return null;

    // Build the data that will populate the details table
    const details = formState.columns ? 
    formState.columns.map((column, index) => {
      const datasource = datasources.find(datasource => datasource.id === column.datasource.value);
      return { 
        key: index, 
        datasource: datasource,
        label: (column.label && column.label.value !== column.field.value) ? column.label.value : undefined,
        field: column.field.value,
        matching: column.matching.value,
        type: column.type.value
      }
    })
  :
    []
  ;
  
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
            { record.label && form.getFieldDecorator(`columns[${index}].label`, {
                initialValue: record.label
              })(
                <span>{record.label}</span>
              )
            }
            { form.getFieldDecorator(`columns[${index}].field`, {
                rules: [{ required: true, message: 'Field is required' }],
                initialValue: record.field
              })(
                record.label ?
                  <Tooltip title={record.field}>
                    <Icon style={{ marginLeft: 5, cursor: 'default' }} type="info-circle-o" />
                  </Tooltip>
                :
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
                <Cascader options={fields} popupClassName="short-cascader">
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
              <Cascader options={(index > 0) ? types : primaryTypes} popupClassName="short-cascader">
                <a>{record.type[0]}</a>
              </Cascader>
            )}
          </span>
        )
      }
    }
  ];

  return (
    <Table
      columns={columns}
      className="details"
      dataSource={details}
      components={dragSort}
      onRow={(record, index) => ({
        index,
        moveRow: moveRow
      })}
    />
  );
}

export default Details;
