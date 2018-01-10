export const REQUEST_WORKFLOW = 'REQUEST_WORKFLOW';
export const RECEIVE_WORKFLOW = 'RECEIVE_WORKFLOW';

const requestWorkflow = () => ({
  type: REQUEST_WORKFLOW
});

const receiveWorkflow = (name, matrix, actions) => ({
  type: RECEIVE_WORKFLOW,
  name,
  matrix,
  actions
});

export const fetchWorkflow = (id) => dispatch => {
  dispatch(requestWorkflow());
  fetch(`/workflow/${id}/retrieve_workflow`, {
    method: 'GET',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd'
    }
  })
  .then(response => response.json())
  .then(workflow => {
    dispatch(receiveWorkflow(workflow['name'], workflow['matrix'], workflow['actions']));
  })
  .catch(error => {
    console.error(error);
  });
};