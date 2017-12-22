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

export const updateContainer = (id, payload) => dispatch => {
  dispatch(requestUpdateContainer());
  fetch(`/container/${id}/`, {
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
