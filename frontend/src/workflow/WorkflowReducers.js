import {
  REQUEST_WORKFLOW,
  RECEIVE_WORKFLOW,
  REFRESH_MATRIX,
  BEGIN_REQUEST_MATRIX,
  FAILURE_REQUEST_MATRIX,
  SUCCESS_UPDATE_MATRIX,
  BEGIN_REQUEST_DATA,
  SUCCESS_REQUEST_DATA,
  FAILURE_REQUEST_DATA,
  OPEN_RULE_MODAL,
  CLOSE_RULE_MODAL,
  BEGIN_REQUEST_RULE_FORM,
  FAILURE_REQUEST_RULE_FORM,
  SUCCESS_CREATE_RULE,
  CHANGE_ACTIVE_RULE_ACCORDION,
  SUCCESS_UPDATE_RULE,
  SUCCESS_DELETE_RULE,
  OPEN_CONDITION_GROUP_MODAL,
  CLOSE_CONDITION_GROUP_MODAL,
  CHANGE_CONDITION_GROUP,
  BEGIN_REQUEST_CONDITION_GROUP,
  FAILURE_REQUEST_CONDITION_GROUP,
  SUCCESS_CREATE_CONDITION_GROUP,
  UPDATE_CONDITION_GROUP_FORM,
  MERGE_CONDITION_GROUP_FORM,
  SUCCESS_UPDATE_CONDITION_GROUP,
  SUCCESS_DELETE_CONDITION_GROUP
} from './WorkflowActions';

import _ from 'lodash';

const initialState = {
  name: 'Workflow',
  matrix: null,
  data: [],
  columns: [],
  actions: [],
  datasources: [],
  conditionGroupForm: {}
};

function workflow(state = initialState, action) {
  switch (action.type) {

    // Retrieve workflow with attached rules
    case REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        isFetching: true,
        didUpdate: false,
        didCreate: false,
        didDelete: false
      });
    case RECEIVE_WORKFLOW:
      return Object.assign({}, state, {
        isFetching: false,
        name: action.name,
        matrix: action.matrix,
        actions: action.actions,
        datasources: action.datasources
      });
    
    // Matrix actions
    case REFRESH_MATRIX:
      return Object.assign({}, state, {
        matrix: action.matrix,
        didUpdate: false,
      });
    case BEGIN_REQUEST_MATRIX:
      return Object.assign({}, state, {
        workflowLoading: true,
      });
    case FAILURE_REQUEST_MATRIX:
      return Object.assign({}, state, {
        workflowLoading: false,
        workflowError: action.error
      });
    case SUCCESS_UPDATE_MATRIX:
      return Object.assign({}, state, {
        workflowLoading: false,
        workflowError: null,
        didUpdate: true,
        model: 'matrix'
      });

    // Matrix data actions
    case BEGIN_REQUEST_DATA:
      return Object.assign({}, state, {
        isFetchingData: true
      });
    case SUCCESS_REQUEST_DATA:
      return Object.assign({}, state, {
        isFetchingData: false,
        data: action.data,
        columns: action.columns,
        dataError: null
      });
    case FAILURE_REQUEST_DATA:
      return Object.assign({}, state, {
        isFetchingData: false,
        data: null,
        columns: null,
        dataError: action.error
      });

    // Shared rule actions
    case OPEN_RULE_MODAL:
      return Object.assign({}, state, {
        ruleModalVisible: true,
        selectedRule: action.rule
      });
    case CLOSE_RULE_MODAL:
      return Object.assign({}, state, {
        ruleModalVisible: false,
        ruleError: null,
        ruleLoading: false
      });
    case BEGIN_REQUEST_RULE_FORM:
      return Object.assign({}, state, {
        ruleLoading: true,
      });
    case FAILURE_REQUEST_RULE_FORM:
      return Object.assign({}, state, {
        ruleLoading: false,
        ruleError: action.error
      });
    case CHANGE_ACTIVE_RULE_ACCORDION:
      return Object.assign({}, state, {
        activeRuleAccordion: action.key
      });

    // Specific rule actions
    case SUCCESS_CREATE_RULE:
      return Object.assign({}, state, {
        ruleModalVisible: false,
        ruleLoading: false,
        ruleError: null,
        didCreate: true,
        model: 'rule'
      });
    case SUCCESS_UPDATE_RULE:
      return Object.assign({}, state, {
        ruleModalVisible: false,
        ruleLoading: false,
        ruleError: null,
        didUpdate: true,
        model: 'rule'
      });
    case SUCCESS_DELETE_RULE:
      return Object.assign({}, state, {
        ruleLoading: false,
        didDelete: true,
        model: 'rule'
      });

    // Shared condition group actions
    case OPEN_CONDITION_GROUP_MODAL:
      return Object.assign({}, state, {
        conditionGroupModalVisible: true,
        selectedRule: action.rule,
        conditionGroupForm: action.conditionGroupForm
      });
    case CLOSE_CONDITION_GROUP_MODAL:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        conditionGroupError: null,
        conditionGroupLoading: false,
        selectedConditionGroup: null,
        conditionGroupForm: null
      });
    case CHANGE_CONDITION_GROUP:
      return Object.assign({}, state, {
        selectedConditionGroup: action.conditionGroup,
        conditionGroupForm: action.conditionGroupForm
      });
    case BEGIN_REQUEST_CONDITION_GROUP:
      return Object.assign({}, state, {
        conditionGroupLoading: true
      });
    case FAILURE_REQUEST_CONDITION_GROUP:
      return Object.assign({}, state, {
        conditionGroupLoading: false,
        conditionGroupError: action.error
      });
      
    // Specific condition group actions
    case SUCCESS_CREATE_CONDITION_GROUP:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        conditionGroupLoading: false,
        conditionGroupError: null,
        didCreate: true,
        model: 'condition group',
        conditionGroupForm: null
      });
    case SUCCESS_UPDATE_CONDITION_GROUP:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        conditionGroupLoading: false,
        conditionGroupError: null,
        didUpdate: true,
        model: 'condition group',
        conditionGroupForm: null,
        selectedConditionGroup: null
      });
    case SUCCESS_DELETE_CONDITION_GROUP:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        conditionGroupLoading: false,
        conditionGroupError: null,
        didDelete: true,
        model: 'condition group',
        conditionGroupForm: null,
        selectedConditionGroup: null
      });

    case UPDATE_CONDITION_GROUP_FORM:
      return Object.assign({}, state, {
        conditionGroupForm: action.payload
      });
    case MERGE_CONDITION_GROUP_FORM:
      return Object.assign({}, state, {
        // TO DO: explain why lodash merge is used here
        // Nested form list field onfieldchange is returned as [null, null, updated_field, null]
        // So we need to use a third-party object merge function to avoid overwiting list elements with null
        conditionGroupForm: _.merge(state.conditionGroupForm, action.payload)
      });
      
      
    default:
      return state;
  }
};

export default workflow;