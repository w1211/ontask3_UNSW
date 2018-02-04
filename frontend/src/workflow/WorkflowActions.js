import { EditorState, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import authenticatedRequest from '../shared/authenticatedRequest';

export const REQUEST_WORKFLOW = 'REQUEST_WORKFLOW';
export const RECEIVE_WORKFLOW = 'RECEIVE_WORKFLOW';

export const REFRESH_DETAILS = 'REFRESH_DETAILS';
export const BEGIN_REQUEST_DETAILS = 'BEGIN_REQUEST_DETAILS';
export const FAILURE_REQUEST_DETAILS = 'FAILURE_REQUEST_DETAILS';
export const SUCCESS_UPDATE_DETAILS = 'SUCCESS_UPDATE_DETAILS';

export const BEGIN_REQUEST_DATA = 'BEGIN_REQUEST_DATA';
export const SUCCESS_REQUEST_DATA = 'SUCCESS_REQUEST_DATA';
export const FAILURE_REQUEST_DATA = 'FAILURE_REQUEST_DATA';

export const OPEN_CONDITION_GROUP_MODAL = 'OPEN_CONDITION_GROUP_MODAL';
export const CLOSE_CONDITION_GROUP_MODAL = 'CLOSE_CONDITION_GROUP_MODAL';
export const REFRESH_CONDITION_GROUP_FORM_STATE = 'REFRESH_CONDITION_GROUP_FORM_STATE';
export const UPDATE_CONDITION_GROUP_FORM_STATE = 'UPDATE_CONDITION_GROUP_FORM_STATE';
export const BEGIN_REQUEST_CONDITION_GROUP = 'BEGIN_REQUEST_CONDITION_GROUP';
export const FAILURE_REQUEST_CONDITION_GROUP = 'FAILURE_REQUEST_CONDITION_GROUP';
export const SUCCESS_CREATE_CONDITION_GROUP = 'SUCCESS_CREATE_CONDITION_GROUP';
export const SUCCESS_UPDATE_CONDITION_GROUP = 'SUCCESS_UPDATE_CONDITION_GROUP';
export const SUCCESS_DELETE_CONDITION_GROUP = 'SUCCESS_DELETE_CONDITION_GROUP';

export const UPDATE_EDITOR_STATE = 'UPDATE_EDITOR_STATE';
export const BEGIN_REQUEST_CONTENT = 'BEGIN_REQUEST_CONTENT';
export const FAILURE_REQUEST_CONTENT = 'FAILURE_REQUEST_CONTENT';
export const SUCCESS_UPDATE_CONTENT = 'SUCCESS_UPDATE_CONTENT';

export const BEGIN_REQUEST_PREVIEW_CONTENT = 'BEGIN_REQUEST_PREVIEW_CONTENT';
export const FAILURE_REQUEST_PREVIEW_CONTENT = 'FAILURE_REQUEST_PREVIEW_CONTENT';
export const SUCCESS_PREVIEW_CONTENT = 'SUCCESS_PREVIEW_CONTENT';
export const CLOSE_PREVIEW_CONTENT = 'CLOSE_PREVIEW_CONTENT';

const requestWorkflow = () => ({
  type: REQUEST_WORKFLOW
});

const receiveWorkflow = (name, details, conditionGroups, datasources, editorState) => ({
  type: RECEIVE_WORKFLOW,
  name,
  details,
  conditionGroups,
  datasources,
  editorState
});

export const fetchWorkflow = (workflowId) => dispatch => {
  authenticatedRequest(
    () => { dispatch(requestWorkflow()); },
    `/workflow/${workflowId}/retrieve_workflow`,
    'GET',
    null,
    (error) => { console.log(error); },
    (workflow) => { 
      let editorState = null;
      if (workflow['content']) {
        const blocksFromHtml = htmlToDraft(workflow['content']);
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        editorState = EditorState.createWithContent(contentState);
      }
  
      dispatch(receiveWorkflow(
        workflow['name'], 
        workflow['details'], 
        workflow['conditionGroups'], 
        workflow['datasources'], 
        editorState
      ));
    }
  )
};

const refreshDetails = (details) => ({
  type: REFRESH_DETAILS,
  details
});

export const addSecondaryColumn = () => (dispatch, getState) => {
  const { workflow } = getState();
  // Clone the current details from state, as we should never directly modify the state object
  let details = Object.assign({primaryColumn: {}, secondaryColumns: []}, workflow.details)
  details.secondaryColumns.push({});

  dispatch(refreshDetails(details));
};

export const deleteSecondaryColumn = (index) => (dispatch, getState) => {
  const { workflow } = getState();
  // Clone the current details from state, as we should never directly modify the state object
  let details = Object.assign({}, workflow.details)
  details.secondaryColumns.splice(index, 1);
  
  dispatch(refreshDetails(details));
};

const beginRequestDetails = () => ({
  type: BEGIN_REQUEST_DETAILS
});

const failureRequestDetails = (error) => ({
  type: FAILURE_REQUEST_DETAILS,
  error
});

const successUpdateDetails = () => ({
  type: SUCCESS_UPDATE_DETAILS
});

export const updateDetails = (workflowId, payload) => dispatch => {
  dispatch(beginRequestDetails());
  fetch(`/workflow/${workflowId}/update_details/`, {
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
        dispatch(failureRequestDetails(error));
      });
    } else {
      response.json().then(workflow => {
        dispatch(successUpdateDetails());
        dispatch(refreshDetails(workflow['details']));
      });
    }
  })
  .catch(error => {
    dispatch(failureRequestDetails('Failed to contact server. Please try again.'));
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

export const fetchData = (workflowId) => dispatch => {
  dispatch(beginRequestData());
  fetch(`/workflow/${workflowId}/get_data/`, {
    method: 'GET',
    headers: {
      'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
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
        dispatch(successRequestData(response['data'], response['columns']));
      });
    }
  })
  .catch(error => {
    dispatch(failureRequestData('Failed to contact server. Please try again.'));
  });
};

export const openConditionGroupModal = (conditionGroup) => {
  // Map the object representing the ConditionGroup model from the database into
  // the form object that will be used in the condition group modal
  let formState = { conditions: [] }

  if (conditionGroup) {
    formState.name = { name: 'name', value: conditionGroup.name };

    conditionGroup.conditions.forEach((condition, i) => {
      formState.conditions.push({ formulas: [] })
      formState.conditions[i].name = { name: `conditions[${i}].name`, value: condition.name }
      formState.conditions[i].type = { name: `conditions[${i}].type`, value: condition.type }

      condition.formulas.forEach((formula, j) => {
        formState.conditions[i].formulas.push({})
        formState.conditions[i].formulas[j].fieldOperator = { 
          name: `conditions[${i}].formulas[${j}].fieldOperator`, value: [formula.field, formula.operator]
        }
        formState.conditions[i].formulas[j].comparator = { 
          name: `conditions[${i}].formulas[${j}].comparator`, value: formula.comparator
        }
      })

    })
  } else {
    formState.conditions.push({ formulas: [{}] });
  }
  
  return {
    type: OPEN_CONDITION_GROUP_MODAL,
    conditionGroup,
    formState
  }
}

export const closeConditionGroupModal = () => ({
  type: CLOSE_CONDITION_GROUP_MODAL
});

const beginRequestConditionGroup = () => ({
  type: BEGIN_REQUEST_CONDITION_GROUP
});

const failureRequestConditionGroup = (error) => ({
  type: FAILURE_REQUEST_CONDITION_GROUP,
  error
});

const successCreateConditionGroup = () => ({
  type: SUCCESS_CREATE_CONDITION_GROUP
});

export const createConditionGroup = (workflowId, payload) => dispatch => {
  dispatch(beginRequestConditionGroup());
  fetch(`/workflow/${workflowId}/create_condition_group/`, {
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
        console.log(error);
        // TO DO: parse this error better in the case of unique errors
        // e.g. "The fields name, workflow must make a unique set."
        dispatch(failureRequestConditionGroup(error[0]));
      });
    } else {
      dispatch(successCreateConditionGroup());
      dispatch(fetchWorkflow(workflowId));
    }
  })
  .catch(error => {
    dispatch(failureRequestConditionGroup('Failed to contact server. Please try again.'));
  })
};

const refreshConditionGroupFormState = (payload) => ({
  type: REFRESH_CONDITION_GROUP_FORM_STATE,
  payload
});

export const addCondition = () => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.conditionGroupFormState)
  formState.conditions.push({ formulas: [{}] });

  dispatch(refreshConditionGroupFormState(formState));
};

export const deleteCondition = (index) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.conditionGroupFormState)
  formState.conditions.splice(index, 1);

  dispatch(refreshConditionGroupFormState(formState));
};

export const addFormula = (conditionIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.conditionGroupFormState)
  formState.conditions[conditionIndex].formulas.push({});

  dispatch(refreshConditionGroupFormState(formState));
};

export const deleteFormula = (conditionIndex, formulaIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.conditionGroupFormState)
  formState.conditions[conditionIndex].formulas.splice(formulaIndex, 1);
  
  dispatch(refreshConditionGroupFormState(formState));
};

export const updateConditionGroupFormState = (payload) => ({
  type: UPDATE_CONDITION_GROUP_FORM_STATE,
  payload
});

const successUpdateConditionGroup = () => ({
  type: SUCCESS_UPDATE_CONDITION_GROUP
});

export const updateConditionGroup = (workflowId, conditionGroup, payload) => dispatch => {
  payload.originalName = conditionGroup.name;
  dispatch(beginRequestConditionGroup());
  fetch(`/workflow/${workflowId}/update_condition_group/`, {
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
        console.log(error);
        // TO DO: parse this error better in the case of unique errors
        // e.g. "The fields name, workflow must make a unique set."
        dispatch(failureRequestConditionGroup(error[0]));
      });
    } else {
      dispatch(successUpdateConditionGroup());
      dispatch(fetchWorkflow(workflowId));
    }
  })
  .catch(error => {
    dispatch(failureRequestConditionGroup('Failed to contact server. Please try again.'));
  })
};

const successDeleteConditionGroup = () => ({
  type: SUCCESS_DELETE_CONDITION_GROUP
});

export const deleteConditionGroup = (workflowId, index) => dispatch => {
  dispatch(beginRequestConditionGroup());
  fetch(`/workflow/${workflowId}/delete_condition_group/`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Token 26683cf5b9c37f1da84748aaad0235d0378eb2f5',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ index: index })
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureRequestConditionGroup(error[0]));
      });
    } else {
      dispatch(successDeleteConditionGroup());
      dispatch(fetchWorkflow(workflowId));
    }
  })
  .catch(error => {
    dispatch(failureRequestConditionGroup('Failed to contact server. Please try again.'));
  })
};

export const updateEditorState = (payload) => ({
  type: UPDATE_EDITOR_STATE,
  payload
});

const beginRequestContent = () => ({
  type: BEGIN_REQUEST_CONTENT
});

const failureRequestContent = (error) => ({
  type: FAILURE_REQUEST_CONTENT,
  error
});

const successUpdateContent = () => ({
  type: SUCCESS_UPDATE_CONTENT
});

export const updateContent = (workflowId, payload) => dispatch => {
  dispatch(beginRequestContent());
  fetch(`/workflow/${workflowId}/update_content/`, {
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
        console.log(error);
        // TO DO: parse this error better in the case of unique errors
        // e.g. "The fields name, workflow must make a unique set."
        dispatch(failureRequestContent(error[0]));
      });
    } else {
      dispatch(successUpdateContent());
      dispatch(fetchWorkflow(workflowId));
    }
  })
  .catch(error => {
    dispatch(failureRequestContent('Failed to contact server. Please try again.'));
  })
};

const beginRequestPreviewContent = () => ({
  type: BEGIN_REQUEST_PREVIEW_CONTENT
});

const failureRequestPreviewContent = (error) => ({
  type: FAILURE_REQUEST_PREVIEW_CONTENT,
  error
});

const successPreviewContent = (preview) => ({
  type: SUCCESS_PREVIEW_CONTENT,
  preview
});

export const closePreviewContent = () => ({
  type: CLOSE_PREVIEW_CONTENT
});

export const previewContent = (workflowId, payload) => dispatch => {
  dispatch(beginRequestPreviewContent());
  fetch(`/workflow/${workflowId}/preview_content/`, {
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
        console.log(error);
        // TO DO: parse this error better in the case of unique errors
        // e.g. "The fields name, workflow must make a unique set."
        dispatch(failureRequestPreviewContent(error[0]));
      });
    } else {
      response.json().then(preview => {
        dispatch(successPreviewContent(preview));
      })
    }
  })
  .catch(error => {
    dispatch(failureRequestPreviewContent('Failed to contact server. Please try again.'));
  })
};
