import {
  START_FETCHING,
  FINISH_FETCHING,

  OPEN_WORKFLOW_MODAL,
  CLOSE_WORKFLOW_MODAL,
  BEGIN_REQUEST_WORKFLOW,
  FAILURE_REQUEST_WORKFLOW,
  SUCCESS_REQUEST_WORKFLOW,

  REQUEST_WORKFLOW,
  RECEIVE_WORKFLOW,

  BEGIN_REQUEST_MODAL,
  FAILURE_REQUEST_MODAL,
  SUCCESS_REQUEST_MODAL,
  REFRESH_FORM_STATE,
  UPDATE_FORM_STATE,

  OPEN_FILTER_MODAL,
  CLOSE_FILTER_MODAL,

  OPEN_CONDITION_GROUP_MODAL,
  CLOSE_CONDITION_GROUP_MODAL,

  UPDATE_EDITOR_STATE,

  BEGIN_REQUEST_CONTENT,
  FAILURE_REQUEST_CONTENT,
  SUCCESS_UPDATE_CONTENT,

  BEGIN_REQUEST_PREVIEW_CONTENT,
  FAILURE_REQUEST_PREVIEW_CONTENT,
  SUCCESS_PREVIEW_CONTENT,
  CLOSE_PREVIEW_CONTENT,

  // FAILURE_CREATE_SCHEDULE,
  // SUCCESS_CREATE_SCHEDULE,
} from './WorkflowActions';

import _ from 'lodash';


function workflow(state = {}, action) {
  switch (action.type) {
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

    case START_FETCHING:
      return Object.assign({}, state, {
        isFetching: true
      });
    case FINISH_FETCHING:
      return Object.assign({}, state, {
        isFetching: false,
        workflow: action.workflow,
        editorState: action.editorState
      });

    case BEGIN_REQUEST_MODAL:
      return Object.assign({}, state, {
        modalLoading: true
      });
    case FAILURE_REQUEST_MODAL:
      return Object.assign({}, state, {
        modalLoading: false,
        modalError: action.error
      });
    case SUCCESS_REQUEST_MODAL:
      return Object.assign({}, state, {
        modalLoading: false,
        modalError: null,
        formState: null,
        filterModalVisible: false,
        conditionGroupModalVisible: false
      });

    // Used when a condition or formula is added to a condition group/filter
    case REFRESH_FORM_STATE:
      return Object.assign({}, state, {
        formState: action.payload
      });
    // Used when a field is changed in the condition group/filter form
    case UPDATE_FORM_STATE:
      return Object.assign({}, state, {
        // By design in ant design forms, if a field belonging to a list is updated, then the payload is given by:
        // [null, null, updated_field, null] where null are the unchanged fields in the list
        // Therefore, when updating the form state we must ensure that the null fields do not overwrite the values of those fields in the state
        // This is handled by the merge function from lodash, a third party plugin
        formState: _.merge(state.formState, action.payload)
      });
    
    case OPEN_FILTER_MODAL:
      return Object.assign({}, state, {
        filterModalVisible: true,
        formState: action.formState
      });
    case CLOSE_FILTER_MODAL:
      return Object.assign({}, state, {
        filterModalVisible: false,
        modalError: null,
        modalLoading: false,
        formState: null
      });

    case OPEN_CONDITION_GROUP_MODAL:
      return Object.assign({}, state, {
        conditionGroupModalVisible: true,
        formState: action.formState,
        conditionGroup: action.conditionGroup
      });
    case CLOSE_CONDITION_GROUP_MODAL:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        modalError: null,
        modalLoading: false,
        formState: null,
        conditionGroup: null
      });

    case UPDATE_EDITOR_STATE:
      return Object.assign({}, state, {
        editorState: action.payload
      });
    case BEGIN_REQUEST_CONTENT:
      return Object.assign({}, state, {
        contentLoading: true
      });
    case FAILURE_REQUEST_CONTENT:
      return Object.assign({}, state, {
        contentLoading: false,
        error: action.error
      });
    case SUCCESS_UPDATE_CONTENT:
      return Object.assign({}, state, {
        contentLoading: false,
        error: null
      });

    case BEGIN_REQUEST_PREVIEW_CONTENT:
      return Object.assign({}, state, {
        previewLoading: true
      });
    case FAILURE_REQUEST_PREVIEW_CONTENT:
      return Object.assign({}, state, {
        previewLoading: false,
        error: action.error
      });
    case SUCCESS_PREVIEW_CONTENT:
      return Object.assign({}, state, {
        previewLoading: false,
        error: null,
        previewModalVisible: action.showModal,
        previewContent: action.preview
      });
    case CLOSE_PREVIEW_CONTENT:
      return Object.assign({}, state, {
        previewModalVisible: false,
        previewContent: null
      });

    default:
      return state;
  }
};

export default workflow;
