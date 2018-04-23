import { EditorState, ContentState } from 'draft-js';
import htmlToDraft from 'html-to-draftjs';
import { notification, Modal } from 'antd';
import requestWrapper from '../shared/requestWrapper';

import { fetchContainers } from '../container/ContainerActions';
import * as SchedulerActions from '../scheduler/SchedulerActions';

const confirm = Modal.confirm;

export const OPEN_WORKFLOW_MODAL = 'OPEN_WORKFLOW_MODAL';
export const CLOSE_WORKFLOW_MODAL = 'CLOSE_WORKFLOW_MODAL';

export const BEGIN_REQUEST_WORKFLOW = 'BEGIN_REQUEST_WORKFLOW';
export const FAILURE_REQUEST_WORKFLOW = 'FAILURE_REQUEST_WORKFLOW';
export const SUCCESS_REQUEST_WORKFLOW = 'SUCCESS_CREATE_WORKFLOW';

export const REQUEST_WORKFLOW = 'REQUEST_WORKFLOW';
export const RECEIVE_WORKFLOW = 'RECEIVE_WORKFLOW';

export const BEGIN_REQUEST_MODAL = 'BEGIN_REQUEST_MODAL';
export const FAILURE_REQUEST_MODAL = 'FAILURE_REQUEST_MODAL';
export const SUCCESS_REQUEST_MODAL = 'SUCCESS_REQUEST_MODAL';
export const REFRESH_FORM_STATE = 'REFRESH_FORM_STATE';
export const UPDATE_FORM_STATE = 'UPDATE_FORM_STATE';

export const OPEN_FILTER_MODAL = 'OPEN_FILTER_MODAL';
export const CLOSE_FILTER_MODAL = 'CLOSE_FILTER_MODAL';

export const OPEN_CONDITION_GROUP_MODAL = 'OPEN_CONDITION_GROUP_MODAL';
export const CLOSE_CONDITION_GROUP_MODAL = 'CLOSE_CONDITION_GROUP_MODAL';

export const UPDATE_EDITOR_STATE = 'UPDATE_EDITOR_STATE';

export const BEGIN_REQUEST_CONTENT = 'BEGIN_REQUEST_CONTENT';
export const FAILURE_REQUEST_CONTENT = 'FAILURE_REQUEST_CONTENT';
export const SUCCESS_UPDATE_CONTENT = 'SUCCESS_UPDATE_CONTENT';

export const BEGIN_REQUEST_PREVIEW_CONTENT = 'BEGIN_REQUEST_PREVIEW_CONTENT';
export const FAILURE_REQUEST_PREVIEW_CONTENT = 'FAILURE_REQUEST_PREVIEW_CONTENT';
export const SUCCESS_PREVIEW_CONTENT = 'SUCCESS_PREVIEW_CONTENT';
export const CLOSE_PREVIEW_CONTENT = 'CLOSE_PREVIEW_CONTENT';


export const openWorkflowModal = (containerId, views) => ({
  type: OPEN_WORKFLOW_MODAL,
  containerId,
  views
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

const successRequestWorkflow = () => ({
  type: SUCCESS_REQUEST_WORKFLOW
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
      dispatch(successRequestWorkflow());
      dispatch(fetchContainers());
      notification['success']({
        message: 'Workflow created',
        description: 'The workflow was successfully created.'
      });
    },
    payload: payload
  }

  requestWrapper(parameters);
};

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
      dispatch(successRequestWorkflow());
      dispatch(fetchContainers());
      notification['success']({
        message: 'Workflow deleted',
        description: 'The workflow and its associated view, actions and scheduled tasks have been successfully deleted.'
      });
    }
  }

  confirm({
    title: 'Confirm workflow deletion',
    content: 'The associated view, actions and scheduled tasks will be irrevocably deleted with the workflow.',
    okText: 'Continue with deletion',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk() {
      requestWrapper(parameters);
    }
  });
};

const requestWorkflow = () => ({
  type: REQUEST_WORKFLOW
});

const receiveWorkflow = (workflow, editorState) => ({
  type: RECEIVE_WORKFLOW,
  workflow,
  editorState
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

      dispatch(receiveWorkflow(workflow, editorState));
    }
  }
  requestWrapper(parameters);
};

const beginRequestModal = () => ({
  type: BEGIN_REQUEST_MODAL
});

const failureRequestModal = (error) => ({
  type: FAILURE_REQUEST_MODAL,
  error
});

const successRequestModal = () => ({
  type: SUCCESS_REQUEST_MODAL
});

const refreshFormState = (payload) => ({
  type: REFRESH_FORM_STATE,
  payload
});

export const updateFormState = (payload) => ({
  type: UPDATE_FORM_STATE,
  payload
});

export const openFilterModal = (filter) => {
  // Map the object representing the Filter model from the database into
  // the form object that will be used in the modal
  let formState = { formulas: [] };

  if (filter) {
    formState.type = { name: 'type', value: filter.type };

    filter.formulas.forEach((formula, i) => {
      formState.formulas.push({})
      formState.formulas[i].fieldOperator = {
        name: `formulas[${i}].fieldOperator`, value: [formula.field, formula.operator]
      };

      formState.formulas[i].comparator = {
        name: `formulas[${i}].comparator`, value: formula.comparator
      };
    })
  } else {
    formState.formulas.push({});
  };
  
  return {
    type: OPEN_FILTER_MODAL,
    formState
  };
}

export const closeFilterModal = () => ({
  type: CLOSE_FILTER_MODAL
});

const validateFilterErrors = (formState) => {
  // Reset the errors in the form if the field has a value
  // Because we are directly modifying the form state, 
  // this step is necessary to ensure that error messages do not get incorrectly displayed
  let hasError = false;
  formState.formulas.forEach((formula, i) => {
    Object.keys(formula).forEach((field) => { 
      field = formState.formulas[i][field];
      if (field.value) { field['errors'] = undefined } else { hasError = true };
    });
  });
  return hasError;
}

export const addFormulaToFilter = () => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.formState)
  
  const hasError = validateFilterErrors(formState);

  formState.formulas.push({ 
    fieldOperator: hasError ? { errors: [{}] } : {},
    comparator: hasError ? { errors: [{}] } : {}
  });

  dispatch(refreshFormState(formState));
};

export const deleteFormulaFromFilter = (formulaIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.formState)
  formState.formulas.splice(formulaIndex, 1);

  validateFilterErrors(formState);

  dispatch(refreshFormState(formState));
};

export const updateFilter = (workflowId, payload) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestModal());
    },
    url: `/workflow/${workflowId}/update_filter/`,
    method: 'PUT',
    errorFn: (error) => {
      dispatch(failureRequestModal(error));
    },
    successFn: () => {
      dispatch(successRequestModal());
      dispatch(fetchWorkflow(workflowId));
      notification['success']({
        message: 'Filter updated',
        description: 'The filter was successfully updated.'
      });
    },
    payload: payload
  }

  requestWrapper(parameters);
};

export const openConditionGroupModal = (conditionGroup) => {
  // Map the object representing the Condition Group model from the database into
  // the form object that will be used in the modal
  let formState = { conditions: [] };

  if (conditionGroup) {
    formState.name = { name: 'name', value: conditionGroup.name };

    conditionGroup.conditions.forEach((condition, i) => {
      formState.conditions.push({ formulas: [] });
      formState.conditions[i].name = { name: `conditions[${i}].name`, value: condition.name };
      formState.conditions[i].type = { name: `conditions[${i}].type`, value: condition.type };

      condition.formulas.forEach((formula, j) => {
        formState.conditions[i].formulas.push({});
        formState.conditions[i].formulas[j].fieldOperator = {
          name: `conditions[${i}].formulas[${j}].fieldOperator`, value: [formula.field, formula.operator]
        };
        formState.conditions[i].formulas[j].comparator = {
          name: `conditions[${i}].formulas[${j}].comparator`, value: formula.comparator
        };
      });

    })
  } else {
    formState.conditions.push({ formulas: [{}] });
  };

  return {
    type: OPEN_CONDITION_GROUP_MODAL,
    formState,
    conditionGroup
  };
};

export const closeConditionGroupModal = () => ({
  type: CLOSE_CONDITION_GROUP_MODAL
});

const validateConditionGroupErrors = (formState) => {
  // Reset the errors in the form if the field has a value
  // Because we are directly modifying the form state, 
  // this step is necessary to ensure that error messages do not get incorrectly displayed
  if (formState.name && formState.name.value) formState.name.errors = undefined;

  let hasError;
  formState.conditions.forEach((condition, i) => {
    if (condition.name && condition.name.value) condition.name.errors = undefined;

    condition.formulas.forEach((formula, j) => {
      Object.keys(formula).forEach((field) => { 
        field = formState.conditions[i].formulas[j][field];
        if (field.value) { field['errors'] = undefined } else { hasError = true };
      });
    });
  });
  return hasError;
}

export const addConditionToConditionGroup = () => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.formState)
  
  const hasError = validateConditionGroupErrors(formState);

  formState.conditions.push({
    formulas: [{
      fieldOperator: hasError ? { errors: [{}] } : {},
      comparator: hasError ? { errors: [{}] } : {}
    }] 
  });

  dispatch(refreshFormState(formState));
};

export const deleteConditionFromConditionGroup = (conditionIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.formState)
  formState.conditions.splice(conditionIndex, 1);

  validateConditionGroupErrors(formState);

  dispatch(refreshFormState(formState));
};


export const addFormulaToConditionGroup = (conditionIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.formState)

  const hasError = validateConditionGroupErrors(formState);

  formState.conditions[conditionIndex].formulas.push({
    fieldOperator: hasError ? { errors: [{}] } : {},
    comparator: hasError ? { errors: [{}] } : {}
  });

  dispatch(refreshFormState(formState));
};

export const deleteFormulaFromConditionGroup = (conditionIndex, formulaIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let formState = Object.assign({}, workflow.formState)
  formState.conditions[conditionIndex].formulas.splice(formulaIndex, 1);

  validateConditionGroupErrors(formState);

  dispatch(refreshFormState(formState));
};

export const createConditionGroup = (workflowId, payload) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestModal()); },
    url: `/workflow/${workflowId}/create_condition_group/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestModal(error)); },
    successFn: (response) => {
      dispatch(successRequestModal());
      dispatch(fetchWorkflow(workflowId));
      notification['success']({
        message: 'Condition group created',
        description: 'The condition group was successfully created.'
      });
    },
    payload: payload
  };

  requestWrapper(parameters);
};

export const updateConditionGroup = (workflowId, conditionGroup, payload) => dispatch => {
  payload.originalName = conditionGroup.name;
  const parameters = {
    initialFn: () => { dispatch(beginRequestModal()); },
    url: `/workflow/${workflowId}/update_condition_group/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestModal(error)); },
    successFn: (response) => {
      dispatch(successRequestModal());
      dispatch(fetchWorkflow(workflowId));
      notification['success']({
        message: 'Condition group updated',
        description: 'The condition group was successfully updated.'
      });
    },
    payload: payload
  };

  requestWrapper(parameters);
};

export const deleteConditionGroup = (workflowId, index) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestModal()); },
    url: `/workflow/${workflowId}/delete_condition_group/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestModal(error)); },
    successFn: (response) => {
      dispatch(successRequestModal());
      dispatch(fetchWorkflow(workflowId));
      notification['success']({
        message: 'Condition group deleted',
        description: 'The condition group was successfully deleted.'
      });
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
      notification['success']({
        message: 'Content saved',
        description: 'The content was successfully saved.'
      });
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

const successPreviewContent = (preview, showModal) => ({
  type: SUCCESS_PREVIEW_CONTENT,
  preview,
  showModal
});

export const closePreviewContent = () => ({
  type: CLOSE_PREVIEW_CONTENT
});

export const previewContent = (workflowId, payload, showModal) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestPreviewContent()); },
    url: `/workflow/${workflowId}/preview_content/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestPreviewContent(error)); },
    successFn: (preview) => {
      dispatch(successPreviewContent(preview, showModal));
    },
    payload: payload
  }

  requestWrapper(parameters);
};

export const sendEmail = (workflowId, payload) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestWorkflow()); },
    url: `/workflow/${workflowId}/send_email/`,
    method: 'PUT',
    errorFn: (error) => { dispatch(failureRequestWorkflow(error)); },
    successFn: (response) => {
      dispatch(successRequestWorkflow());
      dispatch(fetchWorkflow(workflowId));
      notification['success']({
        message: 'Emails sent',
        description: 'The emails were successfully sent.'
      });
    },
    payload: payload
  }

  requestWrapper(parameters);
};

export const updateSchedule = (workflowId, payload, isCreate) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(SchedulerActions.beginRequestScheduler()); },
    url: `/workflow/${workflowId}/update_schedule/`,
    method: 'PATCH',
    errorFn: (error) => {
      dispatch(SchedulerActions.failureRequestScheduler(error));
    },
    successFn: () => {
      dispatch(SchedulerActions.successRequestScheduler());
      dispatch(fetchWorkflow(workflowId));
      notification['success']({
        message: `Schedule ${isCreate ? 'created' : 'updated'}`,
        description: `The schedule was successfully ${isCreate ? 'created' : 'updated'}.`
      });
    },
    payload: payload,
    isNotJSON: false
  }
  requestWrapper(parameters);
};

export const deleteSchedule = (workflowId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(SchedulerActions.beginRequestScheduler()); },
    url: `/workflow/${workflowId}/delete_schedule/`,
    method: 'PATCH',
    errorFn: (error) => {
      dispatch(SchedulerActions.failureRequestScheduler(error));
    },
    successFn: () => {
      dispatch(SchedulerActions.successRequestScheduler());
      dispatch(fetchWorkflow(workflowId));
      notification['success']({
        message: 'Schedule deleted',
        description: 'The schedule was successfully deleted.'
      });
    },
    isNotJSON: false
  }
  requestWrapper(parameters);
};

export const updateEmailSettings = (workflowId, payload) =>(dispatch)=> {
  const parameters = {
    initialFn: () => { dispatch(beginRequestWorkflow()); },
    url: `/workflow/${workflowId}/update_email_settings/`,
    method: 'PATCH',
    errorFn: (error) => { dispatch(failureRequestWorkflow(error)); },
    successFn: () => {
      dispatch(successRequestWorkflow());
      dispatch(fetchWorkflow(workflowId));
      notification['success']({
        message: 'Email settings updated',
        description: 'The email settings were successfully updated.'
      });
    },
    payload: payload,
    isNotJSON: false
  }
  requestWrapper(parameters);
};