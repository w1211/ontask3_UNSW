import React from 'react';
import { Modal, Icon, Table, Radio } from 'antd';

const RadioGroup = Radio.Group;

const DiscrepenciesModal = ({ form, visible, discrepencies, onResolve }) => {
  if (!discrepencies) return null;
    
  const mismatchedPrimaryRecords = discrepencies.primary;
  const mismatchedMatchingFieldRecords = discrepencies.matching;

  return (
    <Modal
      visible={visible}
      title={
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Icon type="exclamation-circle" style={{ marginRight: 5, color: '#faad14', fontSize: '150%'}}/>
          Resolve Match Conflict
        </div>
      }
      onCancel={() => onResolve(false)}
      onOk={() => {
        form.validateFields((err, values) => {
        if (err) return;
        let result = {};
        if ('primary' in values) result.primary = values.primary;
        if ('matching' in values) result.matching = values.matching;
        onResolve(true, result);
      })}}
      width={400}
    >
      <p>Record mismatches have been detected between this datasource ({discrepencies.datasource}) and the DataLab. How should these discrepencies be handled?</p>
      { mismatchedPrimaryRecords && 
        <div style={{ position: 'relative' }}>
          <p>
            The following records occur in this datasource but not in the DataLab:
          </p>
          <Table 
            size="small"
            pagination={{ size: 'small', pageSize: 5 }}
            dataSource={mismatchedPrimaryRecords.map((record, index) => ({ key: index, record: record }))}
            columns={[{ title: 'Record', dataIndex: 'record', key: 'record' }]}
          />
          {form.getFieldDecorator(`primary`, {
            rules: [{ required: true }],
            initialValue: discrepencies.values && discrepencies.values.primary
          })(
            <RadioGroup style={{ position: 'absolute', bottom: '17px' }}>
              <Radio value={true}>Ignore</Radio>
              <Radio value={false}>Add</Radio>
            </RadioGroup>
          )}
        </div>
      }
      { mismatchedMatchingFieldRecords &&
        <div style={{ position: 'relative' }}>
          <p>
            The following records occur in the DataLab but not in this datasource:
          </p>
          <Table 
            size="small"
            pagination={{ size: 'small', pageSize: 5 }}
            dataSource={mismatchedMatchingFieldRecords.map((record, index) => ({ key: index, record: record }))}
            columns={[{ title: 'Record', dataIndex: 'record', key: 'record' }]}
          />
          {form.getFieldDecorator(`matching`, {
            rules: [{ required: true }],
            initialValue: discrepencies.values && discrepencies.values.matching
          })(
            <RadioGroup style={{ position: 'absolute', bottom: '17px' }}>
              <Radio value={true}>Drop</Radio>
              <Radio value={false}>Keep</Radio>
            </RadioGroup>
          )}
        </div>
      }
      { (form.getFieldError('primary') || form.getFieldError('matching')) &&
        <span style={{ color: '#f5222d' }}>Conflicts must be resolved before continuing</span>
      }
    </Modal>
  )
}

export default DiscrepenciesModal;
