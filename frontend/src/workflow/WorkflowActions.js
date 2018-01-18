export const REQUEST_WORKFLOW = 'REQUEST_WORKFLOW';
export const RECEIVE_WORKFLOW = 'RECEIVE_WORKFLOW';
export const REFRESH_MATRIX = 'REFRESH_MATRIX';
export const BEGIN_REQUEST_MATRIX = 'BEGIN_REQUEST_MATRIX';
export const FAILURE_REQUEST_MATRIX = 'FAILURE_REQUEST_MATRIX';
export const SUCCESS_UPDATE_MATRIX = 'SUCCESS_UPDATE_MATRIX';
export const BEGIN_REQUEST_DATA = 'BEGIN_REQUEST_DATA';
export const SUCCESS_REQUEST_DATA = 'SUCCESS_REQUEST_DATA';
export const FAILURE_REQUEST_DATA = 'FAILURE_REQUEST_DATA';
export const OPEN_RULE_MODAL = 'OPEN_RULE_MODAL';
export const CLOSE_RULE_MODAL = 'CLOSE_RULE_MODAL';
export const BEGIN_REQUEST_RULE_FORM = 'BEGIN_REQUEST_RULE_FORM';
export const FAILURE_REQUEST_RULE_FORM = 'FAILURE_REQUEST_RULE_FORM';
export const SUCCESS_CREATE_RULE = 'SUCCESS_CREATE_RULE';
export const CHANGE_ACTIVE_RULE_ACCORDION = 'CHANGE_ACTIVE_RULE_ACCORDION';
export const SUCCESS_UPDATE_RULE = 'SUCCESS_UPDATE_RULE';
export const SUCCESS_DELETE_RULE = 'SUCCESS_DELETE_RULE';
export const OPEN_CONDITION_GROUP_MODAL = 'OPEN_CONDITION_GROUP_MODAL';
export const CLOSE_CONDITION_GROUP_MODAL = 'CLOSE_CONDITION_GROUP_MODAL';
export const CHANGE_CONDITION_GROUP = 'CHANGE_CONDITION_GROUP';
export const BEGIN_REQUEST_CONDITION_GROUP = 'BEGIN_REQUEST_CONDITION_GROUP';
export const FAILURE_REQUEST_CONDITION_GROUP = 'FAILURE_REQUEST_CONDITION_GROUP';
export const SUCCESS_CREATE_CONDITION_GROUP = 'SUCCESS_CREATE_CONDITION_GROUP';

export const UPDATE_CONDITION_GROUP_FORM = 'UPDATE_CONDITION_GROUP_FORM';
export const MERGE_CONDITION_GROUP_FORM = 'MERGE_CONDITION_GROUP_FORM';
export const SUCCESS_UPDATE_CONDITION_GROUP = 'SUCCESS_UPDATE_CONDITION_GROUP';
export const SUCCESS_DELETE_CONDITION_GROUP = 'SUCCESS_DELETE_CONDITION_GROUP';

const requestWorkflow = () => ({
  type: REQUEST_WORKFLOW
});

const receiveWorkflow = (name, matrix, actions, datasources) => ({
  type: RECEIVE_WORKFLOW,
  name,
  matrix,
  actions,
  datasources
});

export const fetchWorkflow = (id) => dispatch => {
  dispatch(requestWorkflow());
  fetch(`/workflow/${id}/retrieve_workflow`, {
    method: 'GET',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd'
    }
  })
  .then(response => response.json())
  .then(workflow => {
    dispatch(receiveWorkflow(workflow['name'], workflow['matrix'], workflow['actions'], workflow['datasources']));
  })
  .catch(error => {
    console.error(error);
  });
};

const refreshMatrix = (matrix) => ({
  type: REFRESH_MATRIX,
  matrix
});

export const addSecondaryColumn = () => (dispatch, getState) => {
  const { workflow } = getState();
  // Clone the current matrix state, as we should never directly modify the state object
  let matrix = Object.assign({primaryColumn: {}, secondaryColumns: []}, workflow.matrix)
  matrix.secondaryColumns.push({});

  dispatch(refreshMatrix(matrix));
};

export const deleteSecondaryColumn = (index) => (dispatch, getState) => {
  const { workflow } = getState();
  // Clone the current matrix state, as we should never directly modify the state object
  let matrix = Object.assign({}, workflow.matrix)
  matrix.secondaryColumns.splice(index, 1);
  
  dispatch(refreshMatrix(matrix));
};

const beginRequestMatrix = () => ({
  type: BEGIN_REQUEST_MATRIX
});

const failureRequestMatrix = (error) => ({
  type: FAILURE_REQUEST_MATRIX,
  error
});

const successUpdateMatrix = () => ({
  type: SUCCESS_UPDATE_MATRIX
});

export const defineMatrix = (id, payload) => dispatch => {
  dispatch(beginRequestMatrix());
  fetch(`/workflow/${id}/define_matrix/`, {
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
        dispatch(failureRequestMatrix(error));
      });
    } else {
      response.json().then(workflow => {
        dispatch(successUpdateMatrix());
        dispatch(refreshMatrix(workflow['matrix']));
      });
    }
  })
  .catch(error => {
    dispatch(failureRequestMatrix('Failed to contact server. Please try again.'));
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

export const fetchMatrixData = (id) => dispatch => {
  dispatch(beginRequestData());
  fetch(`/workflow/${id}/get_matrix_data/`, {
    method: 'GET',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
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
        dispatch(successRequestData(response.data, response.columns));
      });
    }
  })
  .catch(error => {
    dispatch(failureRequestData('Failed to contact server. Please try again.'));
  });
};

export const openRuleModal = (rule) => ({
  type: OPEN_RULE_MODAL,
  rule
});

export const closeRuleModal = () => ({
  type: CLOSE_RULE_MODAL
});

const beginRequestRuleForm = () => ({
  type: BEGIN_REQUEST_RULE_FORM
});

const failureRequestRuleForm = (error) => ({
  type: FAILURE_REQUEST_RULE_FORM,
  error
});

const successCreateRule = () => ({
  type: SUCCESS_CREATE_RULE
});

export const createRule = (workflow, rule) => dispatch => {
  rule.workflow = workflow;
  dispatch(beginRequestRuleForm());
  fetch('/action/', {
    method: 'POST',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rule)
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        console.log(error);
        // TO DO: parse this error better in the case of unique errors
        // e.g. "The fields name, workflow must make a unique set."
        dispatch(failureRequestRuleForm(error[0]));
      });
    } else {
      dispatch(successCreateRule());
      dispatch(fetchWorkflow(workflow));
    }
  })
  .catch(error => {
    dispatch(failureRequestRuleForm('Failed to contact server. Please try again.'));
  })
};

export const changeActiveRuleAccordion = (key) => ({
  type: CHANGE_ACTIVE_RULE_ACCORDION,
  key
});

const successUpdateRule = () => ({
  type: SUCCESS_UPDATE_RULE
});

export const updateRule = (workflow, rule, payload) => dispatch => {
  dispatch(beginRequestRuleForm());
  fetch(`/action/${rule.id}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
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
        dispatch(failureRequestRuleForm(error[0]));
      });
    } else {
      dispatch(successUpdateRule());
      dispatch(fetchWorkflow(workflow));
    }
  })
  .catch(error => {
    dispatch(failureRequestRuleForm('Failed to contact server. Please try again.'));
  })
};

const successDeleteContainer = () => ({
  type: SUCCESS_DELETE_RULE
});

export const deleteRule = (workflow, rule) => dispatch => {
  dispatch(beginRequestRuleForm());
  fetch(`/action/${rule.id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureRequestRuleForm(error[0]));
      });
    } else {
      dispatch(successDeleteContainer());
      dispatch(fetchWorkflow(workflow));
    }
  })
  .catch(error => {
    dispatch(failureRequestRuleForm('Failed to contact server. Please try again.'));
  })
};

export const openConditionGroupModal = (rule) => {
  let conditionGroupForm = { conditions: [{ formulas: [{}] }] }
  return {
    type: OPEN_CONDITION_GROUP_MODAL,
    rule,
    conditionGroupForm
  }
}

export const closeConditionGroupModal = () => ({
  type: CLOSE_CONDITION_GROUP_MODAL
});

export const changeConditionGroup = (conditionGroup) => {
  // Map the object representing the ConditionGroup model from the database into
  // the form object that will be used in the condition group modal
  let conditionGroupForm = { conditions: [] }

  if (conditionGroup) {
    conditionGroupForm.name = { name: 'name', value: conditionGroup.name };

    conditionGroup.conditions.forEach((condition, i) => {
      conditionGroupForm.conditions.push({ formulas: [] })
      conditionGroupForm.conditions[i].name = { name: `conditions[${i}].name`, value: condition.name }
      conditionGroupForm.conditions[i].type = { name: `conditions[${i}].type`, value: condition.type }

      condition.formulas.forEach((formula, j) => {
        conditionGroupForm.conditions[i].formulas.push({})
        conditionGroupForm.conditions[i].formulas[j].fieldOperator = { 
          name: `conditions[${i}].formulas[${j}].fieldOperator`, value: [formula.field, formula.operator]
        }
        conditionGroupForm.conditions[i].formulas[j].comparator = { 
          name: `conditions[${i}].formulas[${j}].comparator`, value: formula.comparator
        }
      })

    })
  } else {
    conditionGroupForm.conditions.push({ formulas: [{}] });
  }

  return ({
    type: CHANGE_CONDITION_GROUP,
    conditionGroup,
    conditionGroupForm
  });
}

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

export const createConditionGroup = (workflow, action, conditionGroup) => dispatch => {
  dispatch(beginRequestConditionGroup());
  fetch(`/action/${action}/create_condition_group/`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(conditionGroup)
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
      dispatch(fetchWorkflow(workflow));
    }
  })
  .catch(error => {
    dispatch(failureRequestConditionGroup('Failed to contact server. Please try again.'));
  })
};

const updateConditionGroupForm = (payload) => ({
  type: UPDATE_CONDITION_GROUP_FORM,
  payload
});

export const addCondition = () => (dispatch, getState) => {
  const { workflow } = getState();
  let conditionGroupForm = Object.assign({}, workflow.conditionGroupForm)
  conditionGroupForm.conditions = conditionGroupForm.conditions ? conditionGroupForm.conditions : []
  conditionGroupForm.conditions.push({ formulas: [{}] });

  dispatch(updateConditionGroupForm(conditionGroupForm));
};

export const deleteCondition = (index) => (dispatch, getState) => {
  const { workflow } = getState();
  let conditionGroupForm = Object.assign({}, workflow.conditionGroupForm)
  conditionGroupForm.conditions.splice(index, 1);

  dispatch(updateConditionGroupForm(conditionGroupForm));
};

export const addFormula = (conditionIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let conditionGroupForm = Object.assign({}, workflow.conditionGroupForm)
  conditionGroupForm.conditions[conditionIndex].formulas.push({});

  dispatch(updateConditionGroupForm(conditionGroupForm));
};

export const deleteFormula = (conditionIndex, formulaIndex) => (dispatch, getState) => {
  const { workflow } = getState();
  let conditionGroupForm = Object.assign({}, workflow.conditionGroupForm)
  conditionGroupForm.conditions[conditionIndex].formulas.splice(formulaIndex, 1);
  
  dispatch(updateConditionGroupForm(conditionGroupForm));
};

export const mergeConditionGroupForm = (payload) => ({
  type: MERGE_CONDITION_GROUP_FORM,
  payload
});

const successUpdateConditionGroup = () => ({
  type: SUCCESS_UPDATE_CONDITION_GROUP
});

export const updateConditionGroup = (workflowId, actionId, selected, payload) => dispatch => {
  payload.originalName = selected.name;
  dispatch(beginRequestConditionGroup());
  fetch(`/action/${actionId}/update_condition_group/`, {
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

export const deleteConditionGroup = (workflowId, actionId, index) => dispatch => {
  dispatch(beginRequestRuleForm());
  fetch(`/action/${actionId}/delete_condition_group/`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Token 2f7e60d4adae38532ea65e0a2f1adc4e146079dd',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ index: index })
  })
  .then(response => {
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        dispatch(failureRequestRuleForm(error[0]));
      });
    } else {
      dispatch(successDeleteConditionGroup());
      dispatch(fetchWorkflow(workflowId));
    }
  })
  .catch(error => {
    dispatch(failureRequestRuleForm('Failed to contact server. Please try again.'));
  })
};