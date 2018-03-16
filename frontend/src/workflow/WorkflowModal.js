import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Input, Alert, Select } from 'antd';

import * as WorkflowActionCreators from './WorkflowActions';

import formItemLayout from '../shared/FormItemLayout';

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;


class WorkflowModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch)
  }

  handleOk = () => {
    const { form, containerId } = this.props;
    
    form.validateFields((err, values) => {
      if (err) return;
      this.boundActionCreators.createWorkflow(containerId, values);
    });
  }

  render() {
    const { dispatch, visible, loading, error, form, views } = this.props;

    return (
      <Modal
        visible={visible}
        title='Create workflow'
        okText='Create'
        onCancel={() => { form.resetFields(); dispatch(this.boundActionCreators.closeWorkflowModal()); }}
        onOk={() => { this.handleOk() }}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          <FormItem {...formItemLayout} label="Name">
            {form.getFieldDecorator('name', {
              rules: [{ required: true, message: 'Name is required' }]
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Description">
            {form.getFieldDecorator('description', {
              rules: [{ required: true, message: 'Description is required' }]
            })(
              <TextArea rows={4}/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="View">
            {form.getFieldDecorator('view', {
              rules: [{ required: true, message: 'View is required' }]
            })(
              <Select>
                { views && views.map((view, i) => {
                  return <Option value={view.id} key={i}>{view.name}</Option>
                })}
              </Select>
            )}
          </FormItem>
          { error && <Alert message={error} type="error"/>}
        </Form>
      </Modal>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    visible, loading, error, containerId, views
  } = state.workflow;
  
  return {
    visible, loading, error, containerId, views
  };
}

export default connect(mapStateToProps)(Form.create()(WorkflowModal))
