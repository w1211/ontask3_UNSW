import { EditorState, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import requestWrapper from '../shared/requestWrapper';

export const REQUEST_WORKFLOW = 'REQUEST_WORKFLOW';
export const RECEIVE_WORKFLOW = 'RECEIVE_WORKFLOW';

export const REFRESH_DETAILS_FORM_STATE = 'REFRESH_DETAILS_FORM_STATE';
export const UPDATE_DETAILS_FORM_STATE = 'UPDATE_DETAILS_FORM_STATE';
export const BEGIN_REQUEST_DETAILS = 'BEGIN_REQUEST_DETAILS';
export const FAILURE_REQUEST_DETAILS = 'FAILURE_REQUEST_DETAILS';
export const SUCCESS_UPDATE_DETAILS = 'SUCCESS_UPDATE_DETAILS';

export const BEGIN_REQUEST_DATA = 'BEGIN_REQUEST_DATA';
export const SUCCESS_REQUEST_DATA = 'SUCCESS_REQUEST_DATA';
export const FAILURE_REQUEST_DATA = 'FAILURE_REQUEST_DATA';

export const OPEN_FILTER_MODAL = 'OPEN_FILTER_MODAL';
export const CLOSE_FILTER_MODAL = 'CLOSE_FILTER_MODAL';
export const REFRESH_FILTER_FORM_STATE = 'REFRESH_FILTER_FORM_STATE';
export const UPDATE_FILTER_FORM_STATE = 'UPDATE_FILTER_FORM_STATE';
export const BEGIN_REQUEST_FILTER = 'BEGIN_REQUEST_FILTER';
export const FAILURE_REQUEST_FILTER = 'FAILURE_REQUEST_FILTER';
export const SUCCESS_UPDATE_FILTER = 'SUCCESS_UPDATE_FILTER';

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

export const BEGIN_SEND_EMAIL = 'BEGIN_SEND_EMAIL';
export const FAILURE_SEND_EMAIL = 'FAILURE_SEND_EMAIL';
export const SUCCESS_SEND_EMAIL = 'SUCCESS_SEND_EMAIL';
export const CLEAR_SEND_EMAIL = 'CLEAR_SEND_EMAIL';


const requestWorkflow = () => ({
  type: REQUEST_WORKFLOW
});

const receiveWorkflow = (name, details, formState, filter, conditionGroups, datasources, editorState, schedule) => ({
  type: RECEIVE_WORKFLOW,
  name,
  details,
  formState,
  filter,
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
        const blocksFromHtml = htmlToDraft(workflow['content']['html']);
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        editorState = EditorState.createWithContent(contentState);
      } else {
        editorState = EditorState.createEmpty();
      }

      // Map the object representing the workflow details from the database into
      // the form object that will be used in the details view
      let formState = { columns: [] }

      if (workflow['details']) {
        const fields = [workflow['details']['primaryColumn'], ...workflow['details']['secondaryColumns']];
        fields.forEach((column, i) => {
          formState.columns.push({ })
          formState.columns[i].field = { name: `columns[${i}].field`, value: [column.datasource, column.field, column.matchesWith]  }
          formState.columns[i].type = { name: `columns[${i}].type`, value: column.type }
        })
      }
      
      dispatch(receiveWorkflow(
        workflow['name'],
        workflow['details'],
        formState,
        workflow['filter'],
        workflow['conditionGroups'],
        workflow['datasources'],
        editorState,
        workflow['schedule'])
      );
    }
  }
  requestWrapper(parameters);
};

const refreshDetailsFormState = (payload) => ({
  type: REFRESH_DETAILS_FORM_STATE,
  payload
});

export const updateDetailsFormState = (payload) => ({
  type: UPDATE_DETAILS_FORM_STATE,
  payload
});

export const addColumn = () => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.detailsFormState);
  formState.columns.push({});

  dispatch(refreshDetailsFormState(formState));
};

export const deleteColumn = (index) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.detailsFormState);
  formState.columns.splice(index, 1);

  dispatch(refreshDetailsFormState(formState));
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

// export const updateDetails = (workflowId, payload) => dispatch => {
//   const parameters = {
//     initialFn: () => { dispatch(beginRequestDetails()); },
//     url: `/workflow/${workflowId}/update_details/`,
//     method: 'PUT',
//     errorFn: (error) => { dispatch(failureRequestDetails(error)); },
//     successFn: (workflow) => {
//       dispatch(successUpdateDetails());
//       dispatch(refreshDetails(workflow['details']));
//     },
//     payload: payload
//   }
//   requestWrapper(parameters);
// };

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

export const openFilterModal = (filter) => {
  // Map the object representing the Filter model from the database into
  // the form object that will be used in the condition group modal
  let formState = { formulas: [] }

  if (filter) {
    formState.type = { name: `type`, value: filter.type }
    filter.formulas.forEach((formula, i) => {
      formState.formulas.push({})
      formState.formulas[i].fieldOperator = {
        name: `formulas[${i}].fieldOperator`, value: [formula.field, formula.operator]
      }
      formState.formulas[i].comparator = {
        name: `formulas[${i}].comparator`, value: formula.comparator
      }

    })
  } else {
    formState.formulas.push({});
  }

  return {
    type: OPEN_FILTER_MODAL,
    formState
  }
}

export const closeFilterModal = () => ({
  type: CLOSE_FILTER_MODAL
});

const beginRequestFilter = () => ({
  type: BEGIN_REQUEST_FILTER
});

const failureRequestFilter = (error) => ({
  type: FAILURE_REQUEST_FILTER,
  error
});

const refreshFilterFormState = (payload) => ({
  type: REFRESH_FILTER_FORM_STATE,
  payload
});

export const addFormulaToFilter = () => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.filterFormState)
  formState.formulas.push({});

  dispatch(refreshFilterFormState(formState));
};

export const deleteFormulaFromFilter = (formulaIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.filterFormState)
  formState.formulas.splice(formulaIndex, 1);

  dispatch(refreshFilterFormState(formState));
};

export const updateFilterFormState = (payload) => ({
  type: UPDATE_FILTER_FORM_STATE,
  payload
});

const successUpdateFilter = () => ({
  type: SUCCESS_UPDATE_FILTER
});

export const updateFilter = (workflowId, payload) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestFilter()); },
    url: `/workflow/${workflowId}/update_filter/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestFilter(error)); },
    successFn: (response) => {
      dispatch(successUpdateFilter());
      dispatch(fetchWorkflow(workflowId));
    },
    payload: payload
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

export const addConditionToConditionGroup = () => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.conditionGroupFormState)
  formState.conditions.push({ formulas: [{}] });

  dispatch(refreshConditionGroupFormState(formState));
};

export const deleteConditionFromConditionGroup = (index) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.conditionGroupFormState)
  formState.conditions.splice(index, 1);

  dispatch(refreshConditionGroupFormState(formState));
};

export const addFormulaToConditionGroup = (conditionIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.conditionGroupFormState)
  formState.conditions[conditionIndex].formulas.push({});

  dispatch(refreshConditionGroupFormState(formState));
};

export const deleteFormulaFromConditionGroup = (conditionIndex, formulaIndex) => (dispatch, getState) => {
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

const beginSendEmail = () => ({
  type: BEGIN_SEND_EMAIL
});

const failureSendEmail = (error) => ({
  type: FAILURE_SEND_EMAIL,
  error
});

const successSendEmail = () => ({
  type: SUCCESS_SEND_EMAIL
});

const clearSendEmail = () => ({
  type: CLEAR_SEND_EMAIL
});


export const sendEmail = (workflowId, payload) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginSendEmail()); },
    url: `/workflow/${workflowId}/send_email/`,
    method: 'POST',
    errorFn: (error) => { dispatch(failureSendEmail(error)); },
    successFn: (response) => {
      dispatch(successSendEmail());
      dispatch(clearSendEmail());
    },
    payload: payload
  }

  requestWrapper(parameters);
};