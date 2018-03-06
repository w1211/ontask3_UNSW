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

export const OPEN_VIEW_MODAL = 'OPEN_VIEW_MODAL';
export const CLOSE_VIEW_MODAL = 'CLOSE_VIEW_MODAL';
export const CLEAR_MATCHING_FIELD = 'CLEAR_MATCHING_FIELD';
export const RESOLVE_MATCHING_FIELD = 'RESOLVE_MATCHING_FIELD'
export const RECIEVE_FIELD_MATCH_RESULT = 'RECIEVE_FIELD_MATCH_RESULT';
export const REFRESH_VIEW_FORM_STATE = 'REFRESH_VIEW_FORM_STATE';
export const UPDATE_VIEW_FORM_STATE = 'UPDATE_VIEW_FORM_STATE';


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

export const changeDatasource = (datasource, isExternalFile) => ({
  type: CHANGE_DATASOURCE,
  datasource,
  isExternalFile
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

  const isFile = (payload.connection.dbType === 'file');
  let data;
  if (isFile) {
    data = new FormData();
    data.append('file', file);
    data.append('delimiter', payload.delimiter)
    data.append('container', containerId);
    data.append('name', payload.name);
    data.append('dbType', 'file');
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
    },
    successFn: () => {
      dispatch(successCreateDatasource());
      dispatch(fetchContainers());
      if (isFile) dispatch(removeUploadingFile());
    },
    payload: data,
    isNotJSON: isFile
  }

  requestWrapper(parameters);
};

const successUpdateDatasource = () => ({
  type: SUCCESS_UPDATE_DATASOURCE
});

export const updateDatasource = (datasourceId, payload, file) => dispatch => {
  dispatch(beginRequestDatasource());

  const isFile = (payload.connection.dbType === 'file');
  let data;
  if (isFile) {
    data = new FormData();
    if (file) data.append('file', file);
    data.append('delimiter', payload.delimiter)
    data.append('name', payload.name);
    data.append('dbType', 'file');
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
    },
    successFn: () => {
      dispatch(successUpdateDatasource());
      dispatch(fetchContainers());
      if (isFile) dispatch(removeUploadingFile());
    },
    payload: data,
    isNotJSON: isFile
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

export const handleDatasourceTypeSelction = (isExternalFile) => ({
  type: UPLOAD_EXTERNAL_FILE,
  isExternalFile
});

export const openViewModal = (containerId, datasources, views) => ({
  type: OPEN_VIEW_MODAL,
  containerId,
  datasources,
  views
});

export const closeViewModal = () => ({
  type: CLOSE_VIEW_MODAL
});

const refreshViewFormState = (payload) => ({
  type: REFRESH_VIEW_FORM_STATE,
  payload
});

export const updateViewFormState = (payload) => ({
  type: UPDATE_VIEW_FORM_STATE,
  payload
});

const getType = (str) => {
  // isNan() returns false if the input only contains numbers
  if (!isNaN(str)) return 'number';
  const dateCheck = new Date(str);
  if (isNaN(dateCheck.getTime())) return 'text';
  return 'date';
}

export const changePrimary = (primary) => (dispatch, getState) => {
  const { containers } = getState();
  let formState = Object.assign({}, containers.viewFormState);
  
  // If the primary key hasn't changed, then we don't need to do anything  
  if (formState.primary && primary === formState.primary.value) return;

  const datasources = containers.datasources;
  const [datasourceIndex, fieldIndex] = primary.split('_');
  const datasource = datasources[datasourceIndex];
  const datasourceId = datasource.id;
  const fieldName = datasource.fields[fieldIndex];

  // Reset any fields that have been set
  formState.fields = { value: [] };

  // Reset the columns if any have been set (since we are changing the primary key)
  // Set the first row of the columns list to reflect the new primary key
  formState.columns = [{
    datasource: { value: datasourceId },
    field: { value: fieldName },
    matching: { value: [fieldName] },
    type: { value: [getType(datasource.data[0][fieldName])] }
  }];

  // Reset the default mappings for every other datasource that might have been set against a different primary key
  // E.g. if the user completed the form for a given primary key, then went back and changed the primary key
  // Set the default matching field for the datasource of the primary key
  formState.defaultMatchingFields = {[datasourceId]: { value: fieldName }};

  // Update the primary key form object
  // IMPORTANT! We are overwriting the entire object so that any validation errors are cleared
  // This fixes a bug that occurs as follows:
  //    1. User presses Next without providing a value, primary field shows validation error
  //    2. User changes (provides) the value for primary field
  //    3. Update only primary field VALUE? Previous error due to missing value persists
  // Therefore, update the entire object and don't specify an error value, which is equivalent to no errors being present
  formState.primary = { value: primary };

  // Update the form state
  dispatch(refreshViewFormState(formState));
};

export const changeFields = (fields, label) => (dispatch, getState) => {
  const { containers } = getState();
  let formState = Object.assign({}, containers.viewFormState);
  const datasources = containers.datasources;

  const isAdd = (!formState.fields || fields.length > formState.fields.value.length);
  if (isAdd) {
    // Get the values of the newly added field (the last element in the list of fields, since its appended to end)
    const [datasourceIndex, fieldIndex] = fields[fields.length - 1].split('_');
    const datasource = datasources[datasourceIndex];
    const datasourceId = datasource.id;
    const fieldName = datasource.fields[fieldIndex];

    if (!formState.columns) formState.columns = [];
    
    // Add the new field to the columns (used by the details & preview mode)
    formState.columns.push({
      datasource: { value: datasourceId },
      field: { value: fieldName },
      matching: { value: [formState.defaultMatchingFields[datasourceId] ? formState.defaultMatchingFields[datasourceId].value : undefined] },
      type: { value: [getType(datasource.data[0][fieldName])] },
      label: { value: label } // This value is only provided to resolve the scenario where a field with a duplicate name is added
    })
  };

  const isRemove = (!isAdd && formState.fields && formState.fields.value.filter(field => fields.indexOf(field) < 0));
  if (isRemove) {
    // isRemove returns an array of fields that matched the filter
    // Since only one field is removed at a time, we can expect the array to always have a length of 1
    // So to extract the removed field from the array, we can just take the first element
    const removedField = isRemove[0];

    // Get the values of the newly removed field
    const [datasourceIndex, fieldIndex] = removedField.split('_');
    const datasourceId = datasources[datasourceIndex].id;
    const fieldName = datasources[datasourceIndex].fields[fieldIndex];

    // Remove this field from the list of columns
    formState.columns = formState.columns.filter(column => !(column.datasource.value === datasourceId && column.field.value === fieldName));
  }

  // Update fields form object
  formState.fields = { value: fields };

  // Update the form state
  dispatch(refreshViewFormState(formState));
};

const receiveFieldMatchResult = (fieldMatchResult, matchingField) => ({
  type: RECIEVE_FIELD_MATCH_RESULT,
  fieldMatchResult,
  matchingField
});

export const changeDefaultMatchingField = (matchingField, primaryKey) => (dispatch, getState) => {
  const { containers } = getState();
  let formState = Object.assign({}, containers.viewFormState);

  const datasourceId = matchingField.datasource;
  const matching = matchingField.field;

  // If the default matching field hasn't changed, then we don't need to do anything
  if (formState.defaultMatchingFields[datasourceId] && matching === formState.defaultMatchingFields[datasourceId].value) return;

  // Get all the fields which use this datasource
  const relatedFields = formState.columns.filter(column => (column.datasource.value === datasourceId));
  // For each field, update the matching field to the new one
  relatedFields.forEach(field => field.matching.value = [matching]);

  // Update matching field form object
  formState.defaultMatchingFields[datasourceId] = { value: matching };

  const parameters = {
    url: `/datasource/compare_matched_fields/`,
    method: 'POST',
    errorFn: (error) => {
      console.log(error);
    },
    successFn: (response) => {
      dispatch(receiveFieldMatchResult(response, matchingField));
    },
    payload: { matchingField, primaryKey }
  }

  requestWrapper(parameters);

  // Update the form state
  dispatch(refreshViewFormState(formState));
};

const clearMatchingField = (payload) => ({
  type: CLEAR_MATCHING_FIELD,
  payload
});

export const resolveMatchingField = () => ({
  type: RESOLVE_MATCHING_FIELD,
});

export const cancelResolveFieldMatch = () => (dispatch, getState) => {
  const { containers } = getState();
  let formState = Object.assign({}, containers.viewFormState);

  const matchingField = containers.matchingField;
  const datasourceId = matchingField.datasource;

  // Remove this matching field from all related fields
  // Get all the fields which use the same datasource as this matching field
  const relatedFields = formState.columns.filter(column => (column.datasource.value === datasourceId));
  // For each field, clear the matching field
  relatedFields.forEach(field => field.matching.value = undefined);

  // Clear the value of the matching field
  formState.defaultMatchingFields[datasourceId] = { value: undefined };

  dispatch(clearMatchingField(formState));
}

export const changeColumnOrder = (dragIndex, hoverIndex) => (dispatch, getState) => {
  const { containers } = getState();
  let formState = Object.assign({}, containers.viewFormState);

  // Deduct 1 from the indices given that the primary key is excluded from the list of fields
  const tmpDragField = formState.fields.value[dragIndex - 1]
  formState.fields.value[dragIndex - 1] = formState.fields.value[hoverIndex - 1];
  formState.fields.value[hoverIndex - 1] = tmpDragField;
  
  // Swap the the fields in the list of columns
  // However, the form requires that each field name is written as a string like 'columns[0].field_name'
  // Therefore, we must iterate over each field's keys and change the name to reflect the new index
  const tmpDragColumn = formState.columns[dragIndex];

  formState.columns[dragIndex] = formState.columns[hoverIndex];
  Object.entries(formState.columns[dragIndex]).forEach(([key, value]) => {
    formState.columns[dragIndex][key].name = `columns[${dragIndex}].${key}`;
  })
  
  formState.columns[hoverIndex] = tmpDragColumn;
  Object.entries(formState.columns[hoverIndex]).forEach(([key, value]) => {
    formState.columns[hoverIndex][key].name = `columns[${hoverIndex}].${key}`;
  })

  dispatch(refreshViewFormState(formState));
};