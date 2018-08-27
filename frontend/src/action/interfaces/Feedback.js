import React from "react";

import { Form, Divider, Input, Button, notification, Alert } from "antd";
import moment from "moment";

import { submitFeedback } from "../ActionActions";

class Feedback extends React.Component {
  state = { loading: false, value: null };

  submitFeedback = () => {
    const { feedback } = this.props;
    const { value } = this.state;
    const { actionId, jobId } = feedback;

    if (!value) {
      notification["warning"]({
        message: "Feedback submission failed",
        description: "You did not provide any feedback."
      });
      return;
    }

    this.setState({ loading: true, error: null });
    submitFeedback({
      actionId,
      jobId,
      payload: { feedback: value },
      onSuccess: response => {
        if ("error" in response) {
          this.setState({ loading: false, error: response.error });
        } else {
          this.setState({ loading: false, didSubmit: true, error: null });
        }
      }
    });
  };

  render() {
    const { feedback } = this.props;
    const { value, loading, error, didSubmit } = this.state;

    return (
      <div className="feedback">
        <h1>Feedback</h1>

        {"error" in feedback ? (
          <h2>{feedback.error}</h2>
        ) : (
          <div className="feedback">
            <div>
              {feedback.value && (
                <p>
                  {`You provided feedback on ${moment(
                    feedback.feedback_datetime
                  ).format("DD/MM/YYYY - HH:mm")}.`}
                </p>
              )}
              <Input.TextArea
                placeholder="Provide your feedback here"
                rows={4}
                value={feedback.value || value}
                onChange={e => this.setState({ value: e.target.value })}
                disabled={feedback.value || didSubmit}
                style={{ marginBottom: 15 }}
              />

              {!feedback.value &&
                !didSubmit && (
                  <Button
                    size="large"
                    type="primary"
                    style={{ marginBottom: 15 }}
                    loading={loading}
                    onClick={this.submitFeedback}
                  >
                    Submit feedback
                  </Button>
                )}

              {error && (
                <Alert
                  message={error}
                  type="error"
                  style={{ marginBottom: 15 }}
                />
              )}

              {didSubmit && (
                <Alert
                  message="Your feedback has been successfully received. Thank you."
                  type="success"
                  style={{ marginBottom: 15 }}
                />
              )}
            </div>

            <Divider />

            <p>
              For your reference, the correspondence you received is shown
              below:
            </p>

            <div className="view_email">
              <div className="field">Subject:</div>
              <div className="value">{feedback.subject}</div>
              <div className="field">Date/Time:</div>
              <div className="value">
                {moment(feedback.email_datetime).format("DD/MM/YYYY - HH:mm")}
              </div>
              <div className="field">Correspondence:</div>
              <div
                style={{ marginTop: 10 }}
                className="email_content"
                dangerouslySetInnerHTML={{
                  __html: feedback.content
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Form.create()(Feedback);
