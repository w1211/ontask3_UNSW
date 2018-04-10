import React from 'react';
import { Modal, Icon, Table, Radio } from 'antd';

const RadioGroup = Radio.Group;


const ResolveMatchModal = ({ form, visible, fieldMatchResult, matchingField, onCancel, onOk }) => {
  // Don't render anything if visible is false, 
  // So that the form does not try to validate against the fields in this component
  if (!fieldMatchResult || !visible) return null;
    
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
          <p>
            The following records occur in the primary key ({fieldMatchResult.primary_datasource_name}) 
            but not in the matching field ({fieldMatchResult.matching_datasource_name}):
          </p>
          <Table 
            size="small"
            pagination={{ size: 'small', pageSize: 5 }}
            dataSource={mismatchedPrimaryRecords.map((record, index) => ({ key: index, record: record }))}
            columns={[{ title: 'Record', dataIndex: 'record', key: 'record' }]}
          />
          {form.getFieldDecorator(`dropDiscrepencies.${matchingField.datasource}.${matchingField.field}.primary`, {
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
          <p>
            The following records occur in the matching field ({fieldMatchResult.matching_datasource_name})
            but not in the primary key ({fieldMatchResult.primary_datasource_name}):
          </p>
          <Table 
            size="small"
            pagination={{ size: 'small', pageSize: 5 }}
            dataSource={mismatchedMatchingFieldRecords.map((record, index) => ({ key: index, record: record }))}
            columns={[{ title: 'Record', dataIndex: 'record', key: 'record' }]}
          />
          {form.getFieldDecorator(`dropDiscrepencies.${matchingField.datasource}.${matchingField.field}.matching`, {
            rules: [{ required: true }]
          })(
            <RadioGroup style={{ position: 'absolute', bottom: '17px' }}>
              <Radio value={true}>Ignore</Radio>
              <Radio value={false}>Add</Radio>
            </RadioGroup>
          )}
        </div>
      }
      { (form.getFieldError(`dropDiscrepencies.${matchingField.datasource}.${matchingField.field}.primary`) || form.getFieldError(`dropDiscrepencies.${matchingField.datasource}.${matchingField.field}.matching`)) &&
        <span style={{ color: '#f5222d' }}>Conflicts must be resolved before continuing</span>
      }
    </Modal>
  )
}

export default ResolveMatchModal;
