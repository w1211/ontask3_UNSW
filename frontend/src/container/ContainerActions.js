import requestWrapper from '../shared/requestWrapper';

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

export const UPLOAD_EXTERNAL_FILE = 'UPLOAD_EXTERNAL_FILE';
export const ADD_UPLOADING_FILE = 'ADD_UPLOADING_FILE';
export const REMOVE_UPLOADING_FILE = 'REMOVE_UPLOADING_FILE';

export const RECEIVE_SHEETNAMES = 'RECEIVE_SHEETNAMES';


const requestContainers = () => ({
  type: REQUEST_CONTAINERS
});

const receiveContainers = (containers) => ({
  type: RECEIVE_CONTAINERS,
  containers
});

const receiveSheetnames = (sheetnames) => ({
  type: RECEIVE_SHEETNAMES,
  sheetnames
});

export const changeContainerAccordion = (key) => ({
  type: CHANGE_CONTAINER_ACCORDION,
  key
});

export const fetchContainers = () => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(requestContainers());
    },
    url: `/container/retrieve_containers/`,
    method: 'GET',
    errorFn: (error) => {
      console.error(error);
    },
    successFn: (containers) => {
      dispatch(receiveContainers(containers));
    }
  }

  requestWrapper(parameters);
};

export const fetchSheetnames = (file) => dispatch => {
  let data = new FormData();
  data.append('file', file);
  const parameters = {
    url: `/datasource/get_sheetnames/`,
    method: 'POST',
    errorFn: (error) => {
      console.error(error);
    },
    successFn: (response) => {
      dispatch(receiveSheetnames(response["sheetnames"]));
    },
    payload: data,
    isNotJSON: true
  }
  requestWrapper(parameters);
}

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
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestContainer());
    },
    url: `/container/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureRequestContainer(error));
    },
    successFn: () => {
      dispatch(successCreateContainer());
      dispatch(fetchContainers());
    },
    payload: payload
  }

  requestWrapper(parameters);
};

const successUpdateContainer = () => ({
  type: SUCCESS_UPDATE_CONTAINER
});

export const updateContainer = (containerId, payload) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestContainer());
    },
    url: `/container/${containerId}/`,
    method: 'PUT',
    errorFn: (error) => {
      dispatch(failureRequestContainer(error));
    },
    successFn: () => {
      dispatch(successUpdateContainer());
      dispatch(fetchContainers());
    },
    payload: payload
  }

  requestWrapper(parameters);
};

const successDeleteContainer = () => ({
  type: SUCCESS_DELETE_CONTAINER
});

export const deleteContainer = (containerId) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestContainer());
    },
    url: `/container/${containerId}/`,
    method: 'DELETE',
    errorFn: (error) => {
      dispatch(failureRequestContainer(error));
    },
    successFn: () => {
      dispatch(successDeleteContainer());
      dispatch(fetchContainers());
    }
  }

  requestWrapper(parameters);
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

  const parameters = {
    initialFn: () => {
      dispatch(beginRequestWorkflow());
    },
    url: `/workflow/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureRequestWorkflow(error));
    },
    successFn: () => {
      dispatch(successCreateWorkflow());
      dispatch(fetchContainers());
    },
    payload: payload
  }

  requestWrapper(parameters);
};

const successUpdateWorkflow = () => ({
  type: SUCCESS_UPDATE_WORKFLOW
});

export const updateWorkflow = (workflowId, payload) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestWorkflow());
    },
    url: `/workflow/${workflowId}/`,
    method: 'PATCH',
    errorFn: (error) => {
      dispatch(failureRequestWorkflow(error));
    },
    successFn: () => {
      dispatch(successUpdateWorkflow());
      dispatch(fetchContainers());
    },
    payload: payload
  }

  requestWrapper(parameters);
};

const successDeleteWorkflow = () => ({
  type: SUCCESS_DELETE_WORKFLOW
});

export const deleteWorkflow = (workflowId) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestWorkflow());
    },
    url: `/workflow/${workflowId}/`,
    method: 'DELETE',
    errorFn: (error) => {
      dispatch(failureRequestWorkflow(error));
    },
    successFn: () => {
      dispatch(successDeleteWorkflow());
      dispatch(fetchContainers());
    }
  }

  requestWrapper(parameters);
};

export const openDatasourceModal = (containerId, datasources) => ({
  type: OPEN_DATASOURCE_MODAL,
  containerId,
  datasources
});

export const closeDatasourceModal = () => ({
  type: CLOSE_DATASOURCE_MODAL
});

export const changeDatasource = (datasource, isExternalFile, isCsvTextFile) => ({
  type: CHANGE_DATASOURCE,
  datasource,
  isExternalFile,
  isCsvTextFile
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

  const isCsvTextFile = (payload.dbType === 'csvTextFile');
  const isXlsXlsxFile = (payload.dbType === 'xlsXlsxFile');

  let data;
  if (isCsvTextFile||isXlsXlsxFile) {
    data = new FormData();
    data.append('file', file);
    if(isCsvTextFile){
      data.append('delimiter', payload.delimiter)
    }
    if(isXlsXlsxFile){
      data.append('sheetname', payload.sheetname)
    }
    data.append('container', containerId);
    data.append('name', payload.name);
    data.append('connection', JSON.stringify(payload.connection));
    data.append('dbType', payload.dbType);
  } else {
    data = payload;
  }

  const parameters = {
    initialFn: () => {
      dispatch(beginRequestDatasource());
    },
    url: `/datasource/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureRequestDatasource(error));
      if (isCsvTextFile||isXlsXlsxFile) dispatch(removeUploadingFile());
    },
    successFn: () => {
      dispatch(successCreateDatasource());
      dispatch(fetchContainers());
      if (isCsvTextFile||isXlsXlsxFile) dispatch(removeUploadingFile());
    },
    payload: data,
    isNotJSON: isCsvTextFile||isXlsXlsxFile
  }

  requestWrapper(parameters);
};

const successUpdateDatasource = () => ({
  type: SUCCESS_UPDATE_DATASOURCE
});

export const updateDatasource = (datasourceId, payload, file) => dispatch => {
  dispatch(beginRequestDatasource());

  const isCsvTextFile = (payload.dbType === 'csvTextFile');
  const isXlsXlsxFile = (payload.dbType === 'xlsXlsxFile');

  let data;
  if (isCsvTextFile||isXlsXlsxFile) {
    data = new FormData();
    data.append('file', file);
    if(isCsvTextFile){
      data.append('delimiter', payload.delimiter)
    }    
    if(isXlsXlsxFile){
      data.append('sheetname', payload.sheetname)
    }
    data.append('name', payload.name);
    data.append('connection', JSON.stringify(payload.connection));
    data.append('dbType', payload.dbType);
  } else {
    data = payload;
  }
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestDatasource());
    },
    url: `/datasource/${datasourceId}/`,
    method: 'PATCH',
    errorFn: (error) => {
      dispatch(failureRequestDatasource(error));
      if (isCsvTextFile||isXlsXlsxFile) dispatch(removeUploadingFile());
    },
    successFn: () => {
      dispatch(successUpdateDatasource());
      dispatch(fetchContainers());
      if (isCsvTextFile||isXlsXlsxFile) dispatch(removeUploadingFile());
    },
    payload: data,
    isNotJSON: isCsvTextFile||isXlsXlsxFile
  }

  requestWrapper(parameters);
};

const successDeleteDatasource = () => ({
  type: SUCCESS_DELETE_DATASOURCE
});

export const deleteDatasource = (datasourceId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestDatasource()); },
    url: `/datasource/${datasourceId}/`,
    method: 'DELETE',
    errorFn: (error) => {
      dispatch(failureRequestDatasource(error));
    },
    successFn: () => {
      dispatch(successDeleteDatasource());
      dispatch(fetchContainers());
    }
  }

  requestWrapper(parameters);
};


export const addUploadingFile = (file) => ({
  type: ADD_UPLOADING_FILE,
  file
});

export const handleDatasourceTypeSelction = (isExternalFile, isCsvTextFile) => ({
  type: UPLOAD_EXTERNAL_FILE,
  isExternalFile,
  isCsvTextFile
});
