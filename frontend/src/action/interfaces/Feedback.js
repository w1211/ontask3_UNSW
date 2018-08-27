import React from "react";

import { Form } from "antd";

import * as ActionActions from "../ActionActions";

class Feedback extends React.Component {
  constructor(props) {
    super(props);
    const { feedback } = props;

    this.state = {};

    console.log(feedback);
    console.log(process.env.NODE_ENV)
  }

  render() {
    const {} = this.props;
    const {} = this.state;

    return <div className="feedback">Feedback form</div>;
  }
}

export default Form.create()(Feedback);
