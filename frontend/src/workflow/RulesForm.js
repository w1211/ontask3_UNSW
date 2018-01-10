import React from 'react';

import { Form, Alert } from 'antd';


const RulesForm = ({ form, error }) => (
  <Form layout="horizontal">
    Rules view
    { error && <Alert message={error} type="error"/>}
  </Form>
)

export default Form.create()(RulesForm)
