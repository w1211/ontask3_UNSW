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
  authenticatedRequest(
    () => { dispatch(beginRequestContainer()); },
    `/container/${containerId}/`,
    'PUT',
    payload,
    (error) => { failureRequestContainer(error); },
    () => { dispatch(successUpdateContainer()); dispatch(fetchContainers()); }
  )
};

const successDeleteContainer = () => ({
  type: SUCCESS_DELETE_CONTAINER
});

export const deleteContainer = (containerId) => dispatch => {
  authenticatedRequest(
    () => { dispatch(beginRequestContainer()); },
    `/container/${containerId}/`,
    'DELETE',
    null,
    (error) => { failureRequestContainer(error); },
    () => { dispatch(successDeleteContainer()); dispatch(fetchContainers()); }
  )
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
  authenticatedRequest(
    () => { dispatch(beginRequestWorkflow()); },
    `/workflow/`,
    'POST',
    payload,
    (error) => { failureRequestWorkflow(error); },
    () => { dispatch(successCreateWorkflow()); dispatch(fetchContainers()); }
  )
};

const successUpdateWorkflow = () => ({
  type: SUCCESS_UPDATE_WORKFLOW
});

export const updateWorkflow = (workflowId, payload) => dispatch => {
  authenticatedRequest(
    () => { dispatch(beginRequestWorkflow()); },
    `/workflow/${workflowId}/`,
    'PATCH',
    payload,
    (error) => { failureRequestWorkflow(error); },
    () => { dispatch(successUpdateWorkflow()); dispatch(fetchContainers()); }
  )
};

const successDeleteWorkflow = () => ({
  type: SUCCESS_DELETE_WORKFLOW
});

export const deleteWorkflow = (workflowId) => dispatch => {
  authenticatedRequest(
    () => { dispatch(beginRequestWorkflow()); },
    `/workflow/${workflowId}/`,
    'DELETE',
    null,
    (error) => { failureRequestWorkflow(error); },
    () => { dispatch(successDeleteWorkflow()); dispatch(fetchContainers()); }
  )
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

  const isCsv = (payload.dbType === 'csv');
  let data;
  if (isCsv) {
    data = new FormData();
    data.append('file', file);
    data.append('container', containerId);
    data.append('name', payload.name);
    data.append('connection', JSON.stringify(payload.connection));
    data.append('dbType', payload.dbType);
  } else {
    data = payload;
  }

  authenticatedRequest(
    () => { dispatch(beginRequestDatasource()); },
    `/datasource/`,
    'POST',
    data,
    (error) => { failureRequestDatasource(error); },
    () => { 
      dispatch(successCreateDatasource()); 
      dispatch(fetchContainers());
      if (isCsv) dispatch(removeUploadingFile());
    },
    isCsv ? 'multipart/form-data' : null
  )
};

const successUpdateDatasource = () => ({
  type: SUCCESS_UPDATE_DATASOURCE
});

export const updateDatasource = (datasourceId, payload, file) => dispatch => {
  dispatch(beginRequestDatasource());
  
  const isCsv = (payload.dbType === 'csv');
  let data;
  if (isCsv) {
    data = new FormData();
    if (file) data.append('file', file);
    data.append('name', payload.name);
    data.append('connection', JSON.stringify(payload.connection));
    data.append('dbType', payload.dbType);
  } else {
    data = payload;
  }

  authenticatedRequest(
    () => { dispatch(beginRequestDatasource()); },
    `/datasource/${datasourceId}/`,
    'PATCH',
    data,
    (error) => { failureRequestDatasource(error); },
    () => { 
      dispatch(successUpdateDatasource()); 
      dispatch(fetchContainers());
      if (isCsv) dispatch(removeUploadingFile());
    },
    isCsv ? 'multipart/form-data' : null
  )
};

const successDeleteDatasource = () => ({
  type: SUCCESS_DELETE_DATASOURCE
});

export const deleteDatasource = (datasourceId) => dispatch => {
  authenticatedRequest(
    () => { dispatch(beginRequestDatasource()); },
    `/datasource/${datasourceId}/`,
    'DELETE',
    null,
    (error) => { failureRequestDatasource(error); },
    () => { 
      dispatch(successDeleteDatasource()); 
      dispatch(fetchContainers());
    },
  )
};


export const addUploadingFile = (file) => ({
  type: ADD_UPLOADING_FILE,
  file
});

export const handleDatasourceTypeSelction = (isCsvFile) => ({
  type: UPLOAD_CSV_FILE,
  isCsvFile
});
