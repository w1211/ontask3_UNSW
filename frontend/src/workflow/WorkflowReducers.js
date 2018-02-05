import {
  REQUEST_WORKFLOW,
  RECEIVE_WORKFLOW,

  REFRESH_DETAILS,
  BEGIN_REQUEST_DETAILS,
  FAILURE_REQUEST_DETAILS,
  SUCCESS_UPDATE_DETAILS,

  BEGIN_REQUEST_DATA,
  SUCCESS_REQUEST_DATA,
  FAILURE_REQUEST_DATA,

  OPEN_CONDITION_GROUP_MODAL,
  CLOSE_CONDITION_GROUP_MODAL,
  REFRESH_CONDITION_GROUP_FORM_STATE,
  UPDATE_CONDITION_GROUP_FORM_STATE,
  BEGIN_REQUEST_CONDITION_GROUP,
  FAILURE_REQUEST_CONDITION_GROUP,
  SUCCESS_CREATE_CONDITION_GROUP,
  SUCCESS_UPDATE_CONDITION_GROUP,
  SUCCESS_DELETE_CONDITION_GROUP,

  UPDATE_EDITOR_STATE,
  BEGIN_REQUEST_CONTENT,
  FAILURE_REQUEST_CONTENT,
  SUCCESS_UPDATE_CONTENT,

  BEGIN_REQUEST_PREVIEW_CONTENT,
  FAILURE_REQUEST_PREVIEW_CONTENT,
  SUCCESS_PREVIEW_CONTENT,
  CLOSE_PREVIEW_CONTENT,

  FAILURE_CREATE_SCHEDULE,
  SUCCESS_CREATE_SCHEDULE
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
        details: action.details,
        conditionGroups: action.conditionGroups,
        datasources: action.datasources,
        actionEditorState: action.editorState,
        content: action.content,
        schedule: action.schedule
      });

    // Details actions
    case REFRESH_DETAILS:
      return Object.assign({}, state, {
        details: action.details,
        didUpdate: false
      });
    case BEGIN_REQUEST_DETAILS:
      return Object.assign({}, state, {
        detailsLoading: true,
      });
    case FAILURE_REQUEST_DETAILS:
      return Object.assign({}, state, {
        detailsLoading: false,
        detailsError: action.error
      });
    case SUCCESS_UPDATE_DETAILS:
      return Object.assign({}, state, {
        detailsLoading: false,
        detailsError: null,
        didUpdate: true,
        model: 'details'
      });

    // Scheduler Actions
    case FAILURE_CREATE_SCHEDULE:
      return Object.assign({}, state, {
        scheduleLoading: false,
        scheduleError: action.error
      });
    case SUCCESS_CREATE_SCHEDULE:
      return Object.assign({}, state, {
        scheduleLoading: false,
        scheduleError: null
      });


    // Data actions
    case BEGIN_REQUEST_DATA:
      return Object.assign({}, state, {
        dataLoading: true
      });
    case SUCCESS_REQUEST_DATA:
      return Object.assign({}, state, {
        dataLoading: false,
        data: action.data,
        columns: action.columns,
        dataError: null
      });
    case FAILURE_REQUEST_DATA:
      return Object.assign({}, state, {
        dataLoading: false,
        data: null,
        columns: null,
        dataError: action.error
      });

    // Shared condition group actions
    case OPEN_CONDITION_GROUP_MODAL:
      return Object.assign({}, state, {
        conditionGroupModalVisible: true,
        conditionGroup: action.conditionGroup,
        conditionGroupFormState: action.formState
      });
    case CLOSE_CONDITION_GROUP_MODAL:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        conditionGroupError: null,
        conditionGroupLoading: false,
        conditionGroup: null,
        conditionGroupFormState: null
      });
    // Used when a condition or formula is added to a condition group
    case REFRESH_CONDITION_GROUP_FORM_STATE:
      return Object.assign({}, state, {
        conditionGroupFormState: action.payload
      });
    // Used when a field is changed in the condition group form
    case UPDATE_CONDITION_GROUP_FORM_STATE:
      return Object.assign({}, state, {
        // By design in ant design forms, if a field belonging to a list is updated, then the payload is given by:
        // [null, null, updated_field, null] where null are the unchanged fields in the list
        // Therefore, when updating the form state we must ensure that the null fields do not overwrite the values of those fields in the state
        // This is handled by the merge function from lodash, a third party plugin
        conditionGroupFormState: _.merge(state.conditionGroupFormState, action.payload)
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
        conditionGroupFormState: null
      });
    case SUCCESS_UPDATE_CONDITION_GROUP:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        conditionGroupLoading: false,
        conditionGroupError: null,
        didUpdate: true,
        model: 'condition group',
        conditionGroupFormState: null,
        conditionGroup: null
      });
    case SUCCESS_DELETE_CONDITION_GROUP:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        conditionGroupLoading: false,
        conditionGroupError: null,
        didDelete: true,
        model: 'condition group',
        conditionGroupForm: null,
        conditionGroup: null
      });

    // Action actions
    case UPDATE_EDITOR_STATE:
      return Object.assign({}, state, {
        actionEditorState: action.payload
      });
    case BEGIN_REQUEST_CONTENT:
      return Object.assign({}, state, {
        actionContentLoading: true
      });
    case FAILURE_REQUEST_CONTENT:
      return Object.assign({}, state, {
        actionContentLoading: false,
        actionContentError: action.error
      });
    case SUCCESS_UPDATE_CONTENT:
      return Object.assign({}, state, {
        actionContentLoading: false,
        actionContentError: null,
        didUpdate: true,
        model: 'content'
      });
    case BEGIN_REQUEST_PREVIEW_CONTENT:
      return Object.assign({}, state, {
        previewContentLoading: true
      });
    case FAILURE_REQUEST_PREVIEW_CONTENT:
      return Object.assign({}, state, {
        previewContentLoading: false,
        actionContentError: action.error
      });
    case SUCCESS_PREVIEW_CONTENT:
      return Object.assign({}, state, {
        previewContentLoading: false,
        actionContentError: null,
        previewContentModalVisible: true,
        previewContent: action.preview
      });
    case CLOSE_PREVIEW_CONTENT:
      return Object.assign({}, state, {
        previewContentModalVisible: false,
        previewContent: null
      });

    default:
      return state;
  }
};

export default workflow;
