import { EditorState, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import requestWrapper from '../shared/requestWrapper';

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

export const FAILURE_CREATE_SCHEDULE = 'FAILURE_CREATE_SCHEDULE';
export const SUCCESS_CREATE_SCHEDULE = 'SUCCESS_CREATE_SCHEDULE';

const requestWorkflow = () => ({
  type: REQUEST_WORKFLOW
});

const receiveWorkflow = (name, details, conditionGroups, datasources, editorState, schedule) => ({
  type: RECEIVE_WORKFLOW,
  name,
  details,
  conditionGroups,
  datasources,
  editorState,
  schedule
});

export const fetchWorkflow = (workflowId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(requestWorkflow()); },
    url: `/workflow/${workflowId}/retrieve_workflow/`,
    method: 'GET',
    errorFn: (error) => { console.log(error); },
    successFn: (workflow) => {
      let editorState = null;
      if (workflow['content']) {
        const blocksFromHtml = htmlToDraft(workflow['content']);
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        editorState = EditorState.createWithContent(contentState);
      } else {
        editorState = EditorState.createEmpty();
      }
      dispatch(receiveWorkflow(
        workflow['name'],
        workflow['details'],
        workflow['conditionGroups'],
        workflow['datasources'],
        editorState,
        workflow['schedule'])
      );
    }
  }
  requestWrapper(parameters);
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

const failureCreateSchedule = (error) => ({
  type: FAILURE_CREATE_SCHEDULE,
  error
})

const successCreateSchedule = () => ({
  type: SUCCESS_CREATE_SCHEDULE
});

export const updateDetails = (workflowId, payload) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestDetails()); },
    url: `/workflow/${workflowId}/update_details/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestDetails(error)); },
    successFn: (workflow) => {
      dispatch(successUpdateDetails());
      dispatch(refreshDetails(workflow['details']));
    },
    payload: payload
  }
  requestWrapper(parameters);
};

export const createSchedule = (workflowId, payload) => dispatch => {
  const parameters = {
    url: `/workflow/${workflowId}/create_schedule/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureCreateSchedule(error)); },
    successFn: (response) => {
      dispatch(successCreateSchedule());
      dispatch(fetchWorkflow(workflowId));
    },
    payload: payload
  }
  requestWrapper(parameters);
};

export const deleteSchedule = (workflowId) => dispatch => {
  const parameters = {
    url: `/workflow/${workflowId}/delete_schedule/`,
    method: 'PUT',
    errorFn: (error) => { console.log(error);},
    successFn: (response) => {
      dispatch(fetchWorkflow(workflowId));
    },
    payload: {}
  }
  requestWrapper(parameters);
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
  const parameters = {
    initialFn: () => { dispatch(beginRequestData()); },
    url: `/workflow/${workflowId}/get_data/`,
    method: 'GET',
    errorFn: (error) => { dispatch(failureRequestData(error)); },
    successFn: (response) => {
      dispatch(successRequestData(response['data'], response['columns']));
    }
  }

  requestWrapper(parameters);
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
  const parameters = {
    initialFn: () => { dispatch(beginRequestConditionGroup()); },
    url: `/workflow/${workflowId}/create_condition_group/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestConditionGroup(error)); },
    successFn: (response) => {
      dispatch(successCreateConditionGroup());
      dispatch(fetchWorkflow(workflowId));
    },
    payload: payload
  }

  requestWrapper(parameters);
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
  const parameters = {
    initialFn: () => { dispatch(beginRequestConditionGroup()); },
    url: `/workflow/${workflowId}/update_condition_group/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestConditionGroup(error)); },
    successFn: (response) => {
      dispatch(successUpdateConditionGroup());
      dispatch(fetchWorkflow(workflowId));
    },
    payload: payload
  }

  requestWrapper(parameters);
};

const successDeleteConditionGroup = () => ({
  type: SUCCESS_DELETE_CONDITION_GROUP
});

export const deleteConditionGroup = (workflowId, index) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestConditionGroup()); },
    url: `/workflow/${workflowId}/delete_condition_group/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestConditionGroup(error)); },
    successFn: (response) => {
      dispatch(successDeleteConditionGroup());
      dispatch(fetchWorkflow(workflowId));
    },
    payload: { index: index }
  }

  requestWrapper(parameters);
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
  const parameters = {
    initialFn: () => { dispatch(beginRequestContent()); },
    url: `/workflow/${workflowId}/update_content/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestContent(error)); },
    successFn: (response) => {
      dispatch(successUpdateContent());
      dispatch(fetchWorkflow(workflowId));
    },
    payload: payload
  }

  requestWrapper(parameters);
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
  const parameters = {
    initialFn: () => { dispatch(beginRequestPreviewContent()); },
    url: `/workflow/${workflowId}/preview_content/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestPreviewContent(error)); },
    successFn: (preview) => {
      dispatch(successPreviewContent(preview));
    },
    payload: payload
  }

  requestWrapper(parameters);
};
