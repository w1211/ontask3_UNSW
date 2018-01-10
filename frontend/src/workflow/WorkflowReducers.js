import {
  REQUEST_WORKFLOW,
  RECEIVE_WORKFLOW
} from './WorkflowActions';

const initialState = {
  name: 'Workflow',
  matrix: null,
  data: [],
  actions: []
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
        actions: action.actions
      });

    default:
      return state;
  }
};

export default workflow;