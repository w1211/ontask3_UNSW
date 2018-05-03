import {
  RECEIVE_EMAIL_HISTORY,
  REQUEST_EMAIL_HISTORY,
  UPDATE_EMAIL_DATA,
  FAILURE_REQUEST_EMAIL_HISTORY,
  REQUEST_SEARCH_WORKFLOW,
  FOUND_WORKFLOW,
  FAILURE_FIND_WORKFLOW,
  REQUEST_WORKFLOW_LIST,
  RECEIVE_WORKFLOW_LIST,
  SUCCESS_BIND_WORKFLOW,
  FOUND_CONTENT,
  REQUEST_SEARCH_CONTENT,
  ERROR_CONTENT,
  ERROR_WORKFLOW,
  REQUEST_BIND_WORKFLOW
} from './StaticPageActions';

const initialState = {
  data: [],
  columns: [],
  containers: [],
  bindWorkflowSuccess: false,
  isWorkflowFound: false
}

function staticPage(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_EMAIL_HISTORY:
      return Object.assign({}, state, {
        isFetching: false,
        data: action.data,
        columns: action.columns,
        matchReg: ''
      });
    case REQUEST_EMAIL_HISTORY:
      return Object.assign({}, state, {
        isFetching: true,
        matchField: null,
        matchReg: null
      });
    case UPDATE_EMAIL_DATA:
      return Object.assign({}, state, {
        data: action.data,
        matchReg: action.matchReg,
        matchField: action.matchField
      });
    case FAILURE_REQUEST_EMAIL_HISTORY:
      return Object.assign({}, state, {
        error: action.error,
        isFetching: false
      });
    case FOUND_WORKFLOW:
      return Object.assign({}, state, {
        workflowId: action.workflowId,
        isWorkflowFound: true,
        isSearching: false
      });
    case REQUEST_SEARCH_WORKFLOW:
      return Object.assign({}, state, {
        isSearching: true
      });
    case FAILURE_FIND_WORKFLOW:
      return Object.assign({}, state, {
        linkId: action.linkId,
        isSearching: false,
        isWorkflowFound: false
      });
    case RECEIVE_WORKFLOW_LIST:
      return Object.assign({}, state, {
        containers: action.containers,
        isSearching: false
      });
    case REQUEST_WORKFLOW_LIST:
      return Object.assign({}, state, {
        isSearching: true
      });
    case SUCCESS_BIND_WORKFLOW:
      return Object.assign({}, state, {
        bindWorkflowSuccess: true
      });
    case FOUND_CONTENT:
      return Object.assign({}, state, {
        content: action.content
      });
    case REQUEST_SEARCH_CONTENT:
      return Object.assign({}, state, {
        zid: action.zid
      });
    case ERROR_CONTENT:
      return Object.assign({}, state, {
        error: action.error
      });
    case ERROR_WORKFLOW:
      return Object.assign({}, state, {
        error: action.error
      });
    case REQUEST_BIND_WORKFLOW:
      return Object.assign({}, state, {
        bindWorkflowSuccess: false
      });
    default:
      return state;
  }
};

export default staticPage;
