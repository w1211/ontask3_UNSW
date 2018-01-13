export const REQUEST_WORKFLOW = 'REQUEST_WORKFLOW';
export const RECEIVE_WORKFLOW = 'RECEIVE_WORKFLOW';
export const REFRESH_MATRIX = 'REFRESH_MATRIX';
export const BEGIN_REQUEST_MATRIX = 'BEGIN_REQUEST_MATRIX';
export const FAILURE_REQUEST_MATRIX = 'FAILURE_REQUEST_MATRIX';
export const SUCCESS_UPDATE_MATRIX = 'SUCCESS_UPDATE_MATRIX';
export const BEGIN_REQUEST_DATA = 'BEGIN_REQUEST_DATA';
export const SUCCESS_REQUEST_DATA = 'SUCCESS_REQUEST_DATA';
export const FAILURE_REQUEST_DATA = 'FAILURE_REQUEST_DATA';


const requestWorkflow = () => ({
  type: REQUEST_WORKFLOW
});

const receiveWorkflow = (name, matrix, actions, datasources) => ({
  type: RECEIVE_WORKFLOW,
  name,
  matrix,
  actions,
  datasources
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
    dispatch(receiveWorkflow(workflow['name'], workflow['matrix'], workflow['actions'], workflow['datasources']));
  })
  .catch(error => {
    console.error(error);
  });
};

const refreshMatrix = (matrix) => ({
  type: REFRESH_MATRIX,
  matrix
});

export const addSecondaryColumn = () => (dispatch, getState) => {
  const { workflow } = getState();
  // Clone the current matrix state, as we should never directly modify the state object
  let matrix = Object.assign({}, workflow.matrix)
  matrix.secondaryColumns.push({});

  dispatch(refreshMatrix(matrix));
};

export const deleteSecondaryColumn = (index) => (dispatch, getState) => {
  const { workflow } = getState();
  // Clone the current matrix state, as we should never directly modify the state object
  let matrix = Object.assign({}, workflow.matrix)
  matrix.secondaryColumns.splice(index, 1);
  
  dispatch(refreshMatrix(matrix));
};

const beginRequestMatrix = () => ({
  type: BEGIN_REQUEST_MATRIX
});

const failureRequestMatrix = (error) => ({
  type: FAILURE_REQUEST_MATRIX,
  error
});

const successUpdateMatrix = () => ({
  type: SUCCESS_UPDATE_MATRIX
});

export const defineMatrix = (id, payload) => dispatch => {
  dispatch(beginRequestMatrix());
  fetch(`/workflow/${id}/define_matrix/`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureRequestMatrix(error));
      });
    } else {
      response.json().then(workflow => {
        dispatch(successUpdateMatrix());
        dispatch(refreshMatrix(workflow['matrix']));
      });
    }
  })
  .catch(error => {
    dispatch(failureRequestMatrix('Failed to contact server. Please try again.'));
  });
};

const beginRequestData = () => ({
  type: BEGIN_REQUEST_DATA
});

const successRequestData = (data, columns) => ({
  type: SUCCESS_REQUEST_DATA,
  data,
  columns
});

const failureRequestData = (error) => ({
  type: FAILURE_REQUEST_DATA,
  error
});

export const fetchMatrixData = (id) => dispatch => {
  dispatch(beginRequestData());
  fetch(`/workflow/${id}/get_matrix_data/`, {
    method: 'GET',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureRequestData(error));
      });
    } else {
      response.json().then(response => {
        dispatch(successRequestData(response.data, response.columns));
      });
    }
  })
  .catch(error => {
    dispatch(failureRequestData('Failed to contact server. Please try again.'));
  });
};
