import {
  REQUEST_WORKFLOW,
  RECEIVE_WORKFLOW,
  REFRESH_MATRIX,
  BEGIN_REQUEST_MATRIX,
  FAILURE_REQUEST_MATRIX,
  SUCCESS_UPDATE_MATRIX,
  BEGIN_REQUEST_DATA,
  SUCCESS_REQUEST_DATA,
  FAILURE_REQUEST_DATA
} from './WorkflowActions';

const initialState = {
  name: 'Workflow',
  matrix: null,
  data: [],
  actions: [],
  datasources: []
};

function workflow(state = initialState, action) {
  switch (action.type) {

    // Retrieve workflow with attached rules
    case REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        isFetching: true
      });
    case RECEIVE_WORKFLOW:
      return Object.assign({}, state, {
        isFetching: false,
        name: action.name,
        matrix: action.matrix,
        actions: action.actions,
        datasources: action.datasources
      });
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
    case BEGIN_REQUEST_DATA:
      return Object.assign({}, state, {
        isFetchingData: true
      });
    case SUCCESS_REQUEST_DATA:
      return Object.assign({}, state, {
        isFetchingData: false,
        data: action.data,
        dataError: null
      });
    case FAILURE_REQUEST_DATA:
      return Object.assign({}, state, {
        isFetchingData: false,
        data: null,
        dataError: action.error
      });
    default:
      return state;
  }
};

export default workflow;