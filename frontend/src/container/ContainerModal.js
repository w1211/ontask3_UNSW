import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Form, Input, Alert } from 'antd';

import * as ContainerActionCreators from './ContainerActions';

import formItemLayout from '../shared/FormItemLayout';

const FormItem = Form.Item;
const { TextArea } = Input;


class ContainerModal extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;
    
    this.boundActionCreators = bindActionCreators(ContainerActionCreators, dispatch)
  }


  handleOk = () => {
    const { form, selected } = this.props;
    
    form.validateFields((err, values) => {
      if (err) return;

      if (selected) {
        this.boundActionCreators.updateContainer(selected.id, values);
      } else {
        this.boundActionCreators.createContainer(values);
      }
    });
  }

  render() {
    const { dispatch, selected, visible, loading, error, form } = this.props;

    return (
      <Modal
        visible={visible}
        title={selected ? 'Update container' : 'Create container'}
        okText={selected ? 'Update' : 'Create'}
        onCancel={() => { form.resetFields(); dispatch(this.boundActionCreators.closeContainerModal()); }}
        onOk={this.handleOk}
        confirmLoading={loading}
      >
        <Form layout="horizontal">
          <FormItem {...formItemLayout} label="Code">
            {form.getFieldDecorator('code', {
              initialValue: selected ? selected.code : null,
              rules: [{ required: true, message: 'Code is required' }]
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="School">
            {form.getFieldDecorator('school', {
              initialValue: selected ? selected.school : null
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Faculty">
            {form.getFieldDecorator('faculty', {
              initialValue: selected ? selected.faculty : null
            })(
              <Input/>
            )}
          </FormItem>
          <FormItem {...formItemLayout} label="Description">
            {form.getFieldDecorator('description', {
              initialValue: selected ? selected.description : null,
              rules: [{ required: true, message: 'Description is required' }]
            })(
              <TextArea rows={4}/>
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
    visible, loading, error, selected
  } = state.containers;
  
  return {
    visible, loading, error, selected
  };
}

export default connect(mapStateToProps)(Form.create()(ContainerModal))
