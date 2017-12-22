import React from 'react';
import PropTypes from 'prop-types';

import { Modal, Form } from 'antd';

const ModalForm = Form.create()((props) => {
  return (
    <Modal
      visible={props.visible}
      title={props.title}
      okText={props.okText}
      onCancel={props.onCancel}
      onOk={props.onOk}
      confirmLoading={props.isLoading}
    >
      {props.children}
    </Modal>
  )
});

ModalForm.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  okText: PropTypes.string,
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
  isLoading: PropTypes.bool
};

export default ModalForm;