import authenticatedRequest from '../shared/authenticatedRequest';

export const REQUEST_CONTAINERS = 'REQUEST_CONTAINERS';
export const RECEIVE_CONTAINERS = 'RECEIVE_CONTAINERS';
export const CHANGE_CONTAINER_ACCORDION = 'CHANGE_CONTAINER_ACCORDION';

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

export const UPLOAD_CSV_FILE = 'UPLOAD_CSV_FILE';
export const ADD_UPLOADING_FILE = 'ADD_UPLOADING_FILE';
export const REMOVE_UPLOADING_FILE = 'REMOVE_UPLOADING_FILE';


const requestContainers = () => ({
  type: REQUEST_CONTAINERS
});

const receiveContainers = (containers) => ({
  type: RECEIVE_CONTAINERS,
  containers
});

export const changeContainerAccordion = (key) => ({
  type: CHANGE_CONTAINER_ACCORDION,
  key
});

export const fetchContainers = () => dispatch => {
  authenticatedRequest(
    () => { dispatch(requestContainers()); },
    '/container/retrieve_containers',
    'GET',
    null,
    (error) => { console.error(error); },
    (containers) => { dispatch(receiveContainers(containers)); }
  )
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

export const createContainer = (payload) => dispatch => {
  authenticatedRequest(
    () => { dispatch(beginRequestContainer()); },
    '/container/',
    'POST',
    payload,
    (error) => { failureRequestContainer(error); },
    () => { dispatch(successCreateContainer()); dispatch(fetchContainers()); }
  )
};

const successUpdateContainer = () => ({
  type: SUCCESS_UPDATE_CONTAINER
});

export const updateContainer = (containerId, payload) => dispatch => {
  dispatch(beginRequestContainer());
  fetch(`/container/${containerId}/`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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

export const deleteContainer = (containerId) => dispatch => {
  dispatch(beginRequestContainer());
  fetch(`/container/${containerId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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

export const openWorkflowModal = (containerId, workflow) => ({
  type: OPEN_WORKFLOW_MODAL,
  containerId,
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

export const createWorkflow = (containerId, payload) => dispatch => {
  payload.container = containerId;
  dispatch(beginRequestWorkflow());
  fetch('/workflow/', {
    method: 'POST',
    headers: {
      'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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

export const updateWorkflow = (workflowId, payload) => dispatch => {
  dispatch(beginRequestWorkflow());
  fetch(`/workflow/${workflowId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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

export const deleteWorkflow = (workflowId) => dispatch => {
  dispatch(beginRequestWorkflow());
  fetch(`/workflow/${workflowId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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

export const openDatasourceModal = (containerId, datasources) => ({
  type: OPEN_DATASOURCE_MODAL,
  containerId,
  datasources
});

export const closeDatasourceModal = () => ({
  type: CLOSE_DATASOURCE_MODAL
});

export const changeDatasource = (datasource, isCsvFile) => ({
  type: CHANGE_DATASOURCE,
  datasource,
  isCsvFile
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

const removeUploadingFile = () => ({
  type: REMOVE_UPLOADING_FILE
})

export const createDatasource = (containerId, payload, file) => dispatch => {
  payload.container = containerId;
  dispatch(beginRequestDatasource());

  if (payload.dbType === 'csv' ) {
    let data = new FormData();
    data.append('file', file);
    data.append('container', containerId);
    data.append('name', payload.name);
    data.append('connection', JSON.stringify(payload.connection));
    data.append('dbType', payload.dbType);
    fetch('/datasource/', {
      method: 'POST',
      headers: {
        'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5'
      },
      body: data
    })
    .then(response => {
      if (response.status >= 400 && response.status < 600) {
        response.json().then(error => {
          dispatch(failureRequestDatasource(error[0]));
        });
      } else {
        dispatch(successCreateDatasource());
        dispatch(fetchContainers());
        dispatch(removeUploadingFile());
      }
    })
    .catch(error => {
      dispatch(failureRequestDatasource('Failed to contact server. Please try again.'));
    })
  } else {
    fetch('/datasource/', {
      method: 'POST',
      headers: {
        'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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
        dispatch(successCreateDatasource());
        dispatch(fetchContainers());
      }
    })
    .catch(error => {
      dispatch(failureRequestDatasource('Failed to contact server. Please try again.'));
    })
  }

};

const successUpdateDatasource = () => ({
  type: SUCCESS_UPDATE_DATASOURCE
});

export const updateDatasource = (datasourceId, payload, file) => dispatch => {
  dispatch(beginRequestDatasource());
  
  if (payload.dbType === 'csv' ) {
    let data = new FormData();
    if (file) data.append('file', file);
    data.append('name', payload.name);
    data.append('connection', JSON.stringify(payload.connection));
    data.append('dbType', payload.dbType);
    fetch(`/datasource/${datasourceId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5'
      },
      body: data
    })
    .then(response => {
      if (response.status >= 400 && response.status < 600) {
        response.json().then(error => {
          dispatch(failureRequestDatasource(error[0]));
        });
      } else {
        dispatch(successUpdateDatasource());
        dispatch(fetchContainers());
        dispatch(removeUploadingFile());
      }
    })
    .catch(error => {
      dispatch(failureRequestDatasource('Failed to contact server. Please try again.'));
    })
  } else {
    fetch(`/datasource/${datasourceId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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
  }
};

const successDeleteDatasource = () => ({
  type: SUCCESS_DELETE_DATASOURCE
});

export const deleteDatasource = (datasourceId) => dispatch => {
  dispatch(beginRequestDatasource());
  fetch(`/datasource/${datasourceId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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


export const addUploadingFile = (file) => ({
  type: ADD_UPLOADING_FILE,
  file
});

export const handleDatasourceTypeSelction = (isCsvFile) => ({
  type: UPLOAD_CSV_FILE,
  isCsvFile
});
