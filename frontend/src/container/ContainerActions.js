export const REQUEST_CONTAINERS = 'REQUEST_CONTAINERS';
export const RECEIVE_CONTAINERS = 'RECEIVE_CONTAINERS';
export const RESELECT_CONTAINER = 'RESELECT_CONTAINER';

export const OPEN_CONTAINER_MODAL = 'OPEN_CONTAINER_MODAL';
export const CLOSE_CONTAINER_MODAL = 'CLOSE_CONTAINER_MODAL';
export const BEGIN_REQUEST_CONTAINER = 'BEGIN_REQUEST_CONTAINER';
export const FAILURE_REQUEST_CONTAINER = 'FAILURE_CREATE_CONTAINER';
export const SUCCESS_CREATE_CONTAINER = 'SUCCESS_CREATE_CONTAINER';
export const SUCCESS_UPDATE_CONTAINER = 'SUCCESS_UPDATE_CONTAINER';
export const SUCCESS_DELETE_CONTAINER = 'SUCCESS_DELETE_CONTAINER';

export const OPEN_WORKFLOW_MODAL = 'OPEN_WORKFLOW_MODAL';
export const CLOSE_WORKFLOW_MODAL = 'CLOSE_WORKFLOW_MODAL';
export const BEGIN_REQUEST_WORKFLOW = 'BEGIN_REQUEST_WORKFLOW';
export const FAILURE_REQUEST_WORKFLOW = 'FAILURE_REQUEST_WORKFLOW';
export const SUCCESS_CREATE_WORKFLOW = 'SUCCESS_CREATE_WORKFLOW';
export const SUCCESS_UPDATE_WORKFLOW = 'SUCCESS_UPDATE_WORKFLOW';
export const SUCCESS_DELETE_WORKFLOW = 'SUCCESS_DELETE_WORKFLOW';

export const OPEN_DATASOURCE_MODAL = 'OPEN_DATASOURCE_MODAL';
export const CLOSE_DATASOURCE_MODAL = 'CLOSE_DATASOURCE_MODAL';
export const CHANGE_DATASOURCE = 'CHANGE_DATASOURCE';
export const BEGIN_REQUEST_DATASOURCE = 'BEGIN_REQUEST_DATASOURCE';
export const FAILURE_REQUEST_DATASOURCE = 'FAILURE_REQUEST_DATASOURCE';
export const SUCCESS_CREATE_DATASOURCE = 'SUCCESS_CREATE_DATASOURCE';
export const SUCCESS_UPDATE_DATASOURCE = 'SUCCESS_UPDATE_DATASOURCE';
export const SUCCESS_DELETE_DATASOURCE = 'SUCCESS_DELETE_DATASOURCE';

const requestContainers = () => ({
  type: REQUEST_CONTAINERS
});

const receiveContainers = containers => ({
  type: RECEIVE_CONTAINERS,
  containers
});

export const reselectContainer = (container) => ({
  type: RESELECT_CONTAINER,
  container
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


export const openContainerModal = (container) => ({
  type: OPEN_CONTAINER_MODAL,
  container
});

export const closeContainerModal = () => ({
  type: CLOSE_CONTAINER_MODAL
});

const beginRequestContainer = () => ({
  type: BEGIN_REQUEST_CONTAINER
});

const failureRequestContainer = (error) => ({
  type: FAILURE_REQUEST_CONTAINER,
  error
});

const successCreateContainer = () => ({
  type: SUCCESS_CREATE_CONTAINER
});

export const createContainer = (container) => dispatch => {
  dispatch(beginRequestContainer());
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
        dispatch(failureRequestContainer(error[0]));
      });
    } else {
      dispatch(successCreateContainer());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestContainer('Failed to contact server. Please try again.'));
  })
};

const successUpdateContainer = () => ({
  type: SUCCESS_UPDATE_CONTAINER
});

export const updateContainer = (selected, payload) => dispatch => {
  dispatch(beginRequestContainer());
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
        dispatch(failureRequestContainer(error[0]));
      });
    } else {
      dispatch(successUpdateContainer());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestContainer('Failed to contact server. Please try again.'));
  })
};

const successDeleteContainer = () => ({
  type: SUCCESS_DELETE_CONTAINER
});

export const deleteContainer = (selected) => dispatch => {
  dispatch(beginRequestContainer());
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
        dispatch(failureRequestContainer(error[0]));
      });
    } else {
      dispatch(successDeleteContainer());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestContainer('Failed to contact server. Please try again.'));
  })
};


export const openWorkflowModal = (container, workflow) => ({
  type: OPEN_WORKFLOW_MODAL,
  container,
  workflow
});

export const closeWorkflowModal = () => ({
  type: CLOSE_WORKFLOW_MODAL
});

const beginRequestWorkflow = () => ({
  type: BEGIN_REQUEST_WORKFLOW
});

const failureRequestWorkflow = (error) => ({
  type: FAILURE_REQUEST_WORKFLOW,
  error
});

const successCreateWorkflow = () => ({
  type: SUCCESS_CREATE_WORKFLOW
});

export const createWorkflow = (container, workflow) => dispatch => {
  workflow.container = container._id['$oid'];
  dispatch(beginRequestWorkflow());
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
        dispatch(failureRequestWorkflow(error[0]));
      });
    } else {
      dispatch(successCreateWorkflow());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestWorkflow('Failed to contact server. Please try again.'));
  })
};

const successUpdateWorkflow = () => ({
  type: SUCCESS_UPDATE_WORKFLOW
});

export const updateWorkflow = (container, selected, payload) => dispatch => {
  payload.container = container._id['$oid'];
  dispatch(beginRequestWorkflow());
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
        dispatch(failureRequestWorkflow(error[0]));
      });
    } else {
      dispatch(successUpdateWorkflow());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestWorkflow('Failed to contact server. Please try again.'));
  })
};

const successDeleteWorkflow = () => ({
  type: SUCCESS_DELETE_WORKFLOW
});

export const deleteWorkflow = (selected) => dispatch => {
  dispatch(beginRequestWorkflow());
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
        dispatch(failureRequestWorkflow(error[0]));
      });
    } else {
      dispatch(successDeleteWorkflow());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestWorkflow('Failed to contact server. Please try again.'));
  })
};

export const openDatasourceModal = (container) => ({
  type: OPEN_DATASOURCE_MODAL,
  container
});

export const closeDatasourceModal = () => ({
  type: CLOSE_DATASOURCE_MODAL
});

export const changeDatasource = (datasource) => ({
  type: CHANGE_DATASOURCE,
  datasource
});

const beginRequestDatasource = () => ({
  type: BEGIN_REQUEST_DATASOURCE
});

const failureRequestDatasource = (error) => ({
  type: FAILURE_REQUEST_DATASOURCE,
  error
});

const successCreateDatasource = () => ({
  type: SUCCESS_CREATE_DATASOURCE
});

export const createDatasource = (container, datasource) => dispatch => {
  datasource.container = container._id['$oid'];
  dispatch(beginRequestDatasource());
  fetch('/datasource/', {
    method: 'POST',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datasource)
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        console.log(error);
        dispatch(failureRequestDatasource(error[0]));
      });
    } else {
      dispatch(successCreateDatasource());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestDatasource('Failed to contact server. Please try again.'));
  })
};

const successUpdateDatasource = () => ({
  type: SUCCESS_UPDATE_DATASOURCE
});

export const updateDatasource = (container, selected, payload) => dispatch => {
  payload.container = container._id['$oid'];
  dispatch(beginRequestDatasource());
  fetch(`/datasource/${selected._id['$oid']}/`, {
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
        dispatch(failureRequestDatasource(error[0]));
      });
    } else {
      dispatch(successUpdateDatasource());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestDatasource('Failed to contact server. Please try again.'));
  })
};

const successDeleteDatasource = () => ({
  type: SUCCESS_DELETE_DATASOURCE
});

export const deleteDatasource = (selected) => dispatch => {
  dispatch(beginRequestDatasource());
  fetch(`/datasource/${selected._id['$oid']}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureRequestDatasource(error[0]));
      });
    } else {
      dispatch(successDeleteDatasource());
      dispatch(fetchContainers());
    }
  })
  .catch(error => {
    dispatch(failureRequestDatasource('Failed to contact server. Please try again.'));
  })
};