import React from 'react';
import { Modal, Form, Icon, Radio } from 'antd';

import formItemLayout from '../../shared/FormItemLayout';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;


const DiscrepenciesModal = ({ form, visible, onCancel, onOk, view }) => {
  if (!view) return null;

  const handleSubmit = () => {
    form.validateFields((err, values) => {
      if (err) return;

      let dropDiscrepencies = [];
      Object.entries(values.dropDiscrepencies).forEach(([datasource, fields]) => {
        Object.entries(fields).forEach(([field, value]) => {
          dropDiscrepencies.push({
            datasource: datasource, 
            matching: field, 
            dropMatching: value.matching,
            dropPrimary: value.primary
          })
        });
      });

      onOk(dropDiscrepencies);
    })
  }

  const primary = view.datasources.find(datasource => datasource.id === view.columns[0].datasource);

  return (
    <Modal
      visible={visible}
      title='Manage discrepencies'
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form layout="horizontal">
        {view.dropDiscrepencies.map((discrepency, i) => {
          const datasource = view.datasources.find(datasource => datasource.id === discrepency.datasource)
          
          return (
            <div key={i}>
              <h4 style={{ marginBottom: 0}}>
                {discrepency.matching} ({datasource.name}) <Icon type="arrow-right" /> {view.columns[0].field} ({primary.name})
              </h4>

              { 'dropPrimary' in discrepency &&
                <FormItem {...formItemLayout} label="Primary key" style={{ marginBottom: 0 }}>
                  { form.getFieldDecorator(`dropDiscrepencies.${discrepency.datasource}.${discrepency.matching}.primary`, {
                      rules: [{ required: true }],
                      initialValue: discrepency.dropPrimary
                    })(
                      <RadioGroup>
                        <Radio value={true}>Drop</Radio>
                        <Radio value={false}>Keep</Radio>
                      </RadioGroup>
                    )
                  }
                </FormItem>
              } 

              { 'dropMatching' in discrepency &&
                <FormItem {...formItemLayout} label="Matching field" style={{ marginBottom: 0 }}>
                  { form.getFieldDecorator(`dropDiscrepencies.${discrepency.datasource}.${discrepency.matching}.matching`, {
                      rules: [{ required: true }],
                      initialValue: discrepency.dropMatching
                    })(
                      <RadioGroup>
                        <Radio value={true}>Drop</Radio>
                        <Radio value={false}>Keep</Radio>
                      </RadioGroup>
                    )
                  }
                </FormItem>
              } 
            </div>
          )
        })}
      </Form>
    </Modal>
  );
};

export default (Form.create()(DiscrepenciesModal));
