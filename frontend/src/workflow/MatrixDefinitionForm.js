import React from 'react';

import { Form, Alert } from 'antd';


const MatrixDefinitionForm = ({ form, matrix, loading, onUpdate, error }) => (
  <Form layout="horizontal">
    Matrix view
    { error && <Alert message={error} type="error"/>}
  </Form>
)

export default Form.create()(MatrixDefinitionForm)
