import requestWrapper from '../shared/requestWrapper';

export const REQUEST_EMAIL_HISTORY = 'REQUEST_EMAIL_HISTORY';
export const RECEIVE_EMAIL_HISTORY = 'RECEIVE_EMAIL_HISTORY';

const requestEmailHistory = () => ({
  type: REQUEST_EMAIL_HISTORY
});

const receiveEmailHistory= (emailHistory) => ({
  type: RECEIVE_EMAIL_HISTORY,
  emailHistory
});

export const fetchEmailHistory = (workflowId) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(requestEmailHistory());
    },
    url: `/workflow/${workflowId}/retrieve_history/`,
    method: 'GET',
    errorFn: (error) => {
      console.error(error);
    },
    successFn: (emailHistory) => {
      dispatch(receiveEmailHistory(emailHistory));
    }
  }

  requestWrapper(parameters);
};
