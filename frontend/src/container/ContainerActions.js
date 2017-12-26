export const REQUEST_CONTAINERS = 'REQUEST_CONTAINERS';
export const RECEIVE_CONTAINERS = 'RECEIVE_CONTAINERS';

export const OPEN_CREATE_CONTAINER = 'OPEN_CREATE_CONTAINER';
export const CLOSE_CREATE_CONTAINER = 'CLOSE_CREATE_CONTAINER';
export const REQUEST_CREATE_CONTAINER = 'REQUEST_CREATE_CONTAINER';
export const SUCCESS_CREATE_CONTAINER = 'SUCCESS_CREATE_CONTAINER';
export const FAILURE_CREATE_CONTAINER = 'FAILURE_CREATE_CONTAINER';

export const OPEN_UPDATE_CONTAINER = 'OPEN_UPDATE_CONTAINER';
export const CLOSE_UPDATE_CONTAINER = 'CLOSE_UPDATE_CONTAINER';
export const REQUEST_UPDATE_CONTAINER = 'REQUEST_UPDATE_CONTAINER';
export const SUCCESS_UPDATE_CONTAINER = 'SUCCESS_UPDATE_CONTAINER';
export const FAILURE_UPDATE_CONTAINER = 'FAILURE_UPDATE_CONTAINER';

export const REQUEST_DELETE_CONTAINER = 'REQUEST_DELETE_CONTAINER';
export const SUCCESS_DELETE_CONTAINER = 'SUCCESS_DELETE_CONTAINER';
export const FAILURE_DELETE_CONTAINER = 'FAILURE_DELETE_CONTAINER';

export const OPEN_CREATE_WORKFLOW = 'OPEN_CREATE_WORKFLOW';
export const CLOSE_CREATE_WORKFLOW = 'CLOSE_CREATE_WORKFLOW';
export const REQUEST_CREATE_WORKFLOW = 'REQUEST_CREATE_WORKFLOW';
export const SUCCESS_CREATE_WORKFLOW = 'SUCCESS_CREATE_WORKFLOW';
export const FAILURE_CREATE_WORKFLOW = 'FAILURE_CREATE_WORKFLOW';

export const OPEN_UPDATE_WORKFLOW = 'OPEN_UPDATE_WORKFLOW';
export const CLOSE_UPDATE_WORKFLOW = 'CLOSE_UPDATE_WORKFLOW';
export const REQUEST_UPDATE_WORKFLOW = 'REQUEST_UPDATE_WORKFLOW';
export const SUCCESS_UPDATE_WORKFLOW = 'SUCCESS_UPDATE_WORKFLOW';
export const FAILURE_UPDATE_WORKFLOW = 'FAILURE_UPDATE_WORKFLOW';

export const REQUEST_DELETE_WORKFLOW = 'REQUEST_DELETE_WORKFLOW';
export const SUCCESS_DELETE_WORKFLOW = 'SUCCESS_DELETE_WORKFLOW';
export const FAILURE_DELETE_WORKFLOW = 'FAILURE_DELETE_WORKFLOW';


const requestContainers = () => ({
  type: REQUEST_CONTAINERS
});

const receiveContainers = containers => ({
  type: RECEIVE_CONTAINERS,
  containers
});

export const fetchContainers = () => dispatch => {
  dispatch(requestContainers());
  fetch('/container/retrieve_containers', {
    method: 'GET',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd'
    }
  })
  .then(response => response.json())
  .then(containers => {
    dispatch(receiveContainers(containers));
  })
  .catch(error => {
    console.error(error);
  });
};


export const openCreateContainer = () => ({
  type: OPEN_CREATE_CONTAINER
});

export const closeCreateContainer = () => ({
  type: CLOSE_CREATE_CONTAINER
});

const requestCreateContainer = () => ({
  type: REQUEST_CREATE_CONTAINER
});

const successCreateContainer = () => ({
  type: SUCCESS_CREATE_CONTAINER
});

const failureCreateContainer = (error) => ({
  type: FAILURE_CREATE_CONTAINER,
  error
});

export const createContainer = (container) => dispatch => {
  dispatch(requestCreateContainer());
  fetch('/container/', {
    method: 'POST',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(container)
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureCreateContainer(error[0]));
      });
    } else {
      dispatch(successCreateContainer());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureCreateContainer('Failed to contact server. Please try again.'));
  })
};


export const openUpdateContainer = (container) => ({
  type: OPEN_UPDATE_CONTAINER,
  container
});

export const closeUpdateContainer = () => ({
  type: CLOSE_UPDATE_CONTAINER
});

const requestUpdateContainer = (container) => ({
  type: REQUEST_UPDATE_CONTAINER,
  container
});

const successUpdateContainer = () => ({
  type: SUCCESS_UPDATE_CONTAINER
});

const failureUpdateContainer = (error) => ({
  type: FAILURE_UPDATE_CONTAINER,
  error
});

export const updateContainer = (selected, payload) => dispatch => {
  dispatch(requestUpdateContainer());
  fetch(`/container/${selected._id['$oid']}/`, {
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
        dispatch(failureUpdateContainer(error[0]));
      });
    } else {
      dispatch(successUpdateContainer());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureCreateContainer('Failed to contact server. Please try again.'));
  })
};


const requestDeleteContainer = () => ({
  type: REQUEST_DELETE_CONTAINER
});

const successDeleteContainer = () => ({
  type: SUCCESS_DELETE_CONTAINER
});

const failureDeleteContainer = (error) => ({
  type: FAILURE_DELETE_CONTAINER,
  error
});

export const deleteContainer = (selected) => dispatch => {
  dispatch(requestDeleteContainer());
  fetch(`/container/${selected._id['$oid']}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureDeleteContainer(error[0]));
      });
    } else {
      dispatch(successDeleteContainer());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureDeleteContainer('Failed to contact server. Please try again.'));
  })
};


export const openCreateWorkflow = (container) => ({
  type: OPEN_CREATE_WORKFLOW,
  container
});

export const closeCreateWorkflow = () => ({
  type: CLOSE_CREATE_WORKFLOW
});

const requestCreateWorkflow = () => ({
  type: REQUEST_CREATE_WORKFLOW
});

const successCreateWorkflow = () => ({
  type: SUCCESS_CREATE_WORKFLOW
});

const failureCreateWorkflow = (error) => ({
  type: FAILURE_CREATE_WORKFLOW,
  error
});

export const createWorkflow = (container, workflow) => dispatch => {
  workflow.container = container._id['$oid'];
  dispatch(requestCreateWorkflow());
  fetch('/workflow/', {
    method: 'POST',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(workflow)
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        console.log(error);
        dispatch(failureCreateWorkflow(error[0]));
      });
    } else {
      dispatch(successCreateWorkflow());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureCreateWorkflow('Failed to contact server. Please try again.'));
  })
};

export const openUpdateWorkflow = (container, workflow) => ({
  type: OPEN_UPDATE_WORKFLOW,
  container,
  workflow
});

export const closeUpdateWorkflow= () => ({
  type: CLOSE_UPDATE_WORKFLOW
});

const requestUpdateWorkflow = (workflow) => ({
  type: REQUEST_UPDATE_WORKFLOW,
  workflow
});

const successUpdateWorkflow = () => ({
  type: SUCCESS_UPDATE_WORKFLOW
});

const failureUpdateWorkflow = (error) => ({
  type: FAILURE_UPDATE_WORKFLOW,
  error
});

export const updateWorkflow = (container, selected, payload) => dispatch => {
  payload.container = container._id['$oid'];
  dispatch(requestUpdateWorkflow());
  fetch(`/workflow/${selected._id['$oid']}/`, {
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
        dispatch(failureUpdateWorkflow(error[0]));
      });
    } else {
      dispatch(successUpdateWorkflow());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureCreateWorkflow('Failed to contact server. Please try again.'));
  })
};

const requestDeleteWorkflow = () => ({
  type: REQUEST_DELETE_WORKFLOW
});

const successDeleteWorkflow = () => ({
  type: SUCCESS_DELETE_WORKFLOW
});

const failureDeleteWorkflow = (error) => ({
  type: FAILURE_DELETE_WORKFLOW,
  error
});

export const deleteWorkflow = (selected) => dispatch => {
  dispatch(requestDeleteWorkflow());
  fetch(`/workflow/${selected._id['$oid']}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureDeleteWorkflow(error[0]));
      });
    } else {
      dispatch(successDeleteWorkflow());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureDeleteWorkflow('Failed to contact server. Please try again.'));
  })
};