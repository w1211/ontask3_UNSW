import {
  OPEN_WORKFLOW_MODAL,
  CLOSE_WORKFLOW_MODAL,
  BEGIN_REQUEST_WORKFLOW,
  FAILURE_REQUEST_WORKFLOW,
  SUCCESS_REQUEST_WORKFLOW,

  REQUEST_WORKFLOW,
  RECEIVE_WORKFLOW,

  REFRESH_DETAILS_FORM_STATE,
  UPDATE_DETAILS_FORM_STATE,
  BEGIN_REQUEST_DETAILS,
  FAILURE_REQUEST_DETAILS,
  SUCCESS_UPDATE_DETAILS,

  BEGIN_REQUEST_DATA,
  SUCCESS_REQUEST_DATA,
  FAILURE_REQUEST_DATA,

  OPEN_FILTER_MODAL,
  CLOSE_FILTER_MODAL,
  REFRESH_FILTER_FORM_STATE,
  UPDATE_FILTER_FORM_STATE,
  BEGIN_REQUEST_FILTER,
  FAILURE_REQUEST_FILTER,
  SUCCESS_UPDATE_FILTER,

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
  SUCCESS_CREATE_SCHEDULE,

  BEGIN_SEND_EMAIL,
  SUCCESS_SEND_EMAIL,
  FAILURE_SEND_EMAIL,
  CLEAR_SEND_EMAIL

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
    case OPEN_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        visible: true,
        containerId: action.containerId
      });
    case CLOSE_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        visible: false,
        error: null,
        loading: false,
        containerId: null
      });
    case BEGIN_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        loading: true
      });
    case FAILURE_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case SUCCESS_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        visible: false,
        loading: false,
        error: null,
        containerId: null
      });

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
        detailsFormState: action.formState,
        filter: action.filter,
        conditionGroups: action.conditionGroups,
        datasources: action.datasources,
        content: action.content,
        schedule: action.schedule,
        actionEditorState: action.editorState
      });

    // Details actions
    case REFRESH_DETAILS_FORM_STATE:
      return Object.assign({}, state, {
        detailsFormState: action.payload
      });
    case UPDATE_DETAILS_FORM_STATE:
      return Object.assign({}, state, {
        detailsFormState: _.merge(state.detailsFormState, action.payload)
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

    // Filter actions
    case OPEN_FILTER_MODAL:
      return Object.assign({}, state, {
        filterModalVisible: true,
        filterFormState: action.formState
      });
    case CLOSE_FILTER_MODAL:
      return Object.assign({}, state, {
        filterModalVisible: false,
        filterError: null,
        filterLoading: false,
        filterFormState: null
      });
    // Used when a formula is added to the filter
    case REFRESH_FILTER_FORM_STATE:
      return Object.assign({}, state, {
        filterFormState: action.payload
      });
    // Used when a field is changed in the filter form
    case UPDATE_FILTER_FORM_STATE:
      return Object.assign({}, state, {
        // By design in ant design forms, if a field belonging to a list is updated, then the payload is given by:
        // [null, null, updated_field, null] where null are the unchanged fields in the list
        // Therefore, when updating the form state we must ensure that the null fields do not overwrite the values of those fields in the state
        // This is handled by the merge function from lodash, a third party plugin
        filterFormState: _.merge(state.filterFormState, action.payload)
      });
    case BEGIN_REQUEST_FILTER:
      return Object.assign({}, state, {
        filterLoading: true
      });
    case FAILURE_REQUEST_FILTER:
      return Object.assign({}, state, {
        filterLoading: false,
        filterError: action.error
      });
    case SUCCESS_UPDATE_FILTER:
      return Object.assign({}, state, {
        filterModalVisible: false,
        filterLoading: false,
        filterError: null,
        didUpdate: true,
        model: 'filter',
        filterFormState: null
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

    // Compose actions
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
    
    // Action actions
    case BEGIN_SEND_EMAIL:
      return Object.assign({}, state, {
        emailLoading: true,
        emailError: null
      });
    case FAILURE_SEND_EMAIL:
      return Object.assign({}, state, {
        emailLoading: false,
        emailError: action.error
      });
    case SUCCESS_SEND_EMAIL:
      return Object.assign({}, state, {
        emailLoading: false,
        emailError: null,
        emailSuccess: true
      });
    case CLEAR_SEND_EMAIL:
      return Object.assign({}, state, {
        emailSuccess: false
      });
    default:
      return state;
  }
};

export default workflow;
