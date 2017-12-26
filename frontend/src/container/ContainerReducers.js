import {
  REQUEST_CONTAINERS,
  RECEIVE_CONTAINERS,
  OPEN_CREATE_CONTAINER,
  CLOSE_CREATE_CONTAINER,
  REQUEST_CREATE_CONTAINER,
  SUCCESS_CREATE_CONTAINER,
  FAILURE_CREATE_CONTAINER,
  OPEN_UPDATE_CONTAINER,
  CLOSE_UPDATE_CONTAINER,
  REQUEST_UPDATE_CONTAINER,
  SUCCESS_UPDATE_CONTAINER,
  FAILURE_UPDATE_CONTAINER,
  REQUEST_DELETE_CONTAINER,
  SUCCESS_DELETE_CONTAINER,
  FAILURE_DELETE_CONTAINER,
  OPEN_CREATE_WORKFLOW,
  CLOSE_CREATE_WORKFLOW,
  REQUEST_CREATE_WORKFLOW,
  SUCCESS_CREATE_WORKFLOW,
  FAILURE_CREATE_WORKFLOW,
  OPEN_UPDATE_WORKFLOW,
  CLOSE_UPDATE_WORKFLOW,
  REQUEST_UPDATE_WORKFLOW,
  SUCCESS_UPDATE_WORKFLOW,
  FAILURE_UPDATE_WORKFLOW,
  REQUEST_DELETE_WORKFLOW,
  SUCCESS_DELETE_WORKFLOW,
  FAILURE_DELETE_WORKFLOW
} from './ContainerActions';

const initialState = {
  items: []
};

function containers(state = initialState, action) {
  switch (action.type) {

    // List containers
    case REQUEST_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: true,
        didCreate: false,
        didUpdate: false,
        didDelete: false
      });
    case RECEIVE_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.containers
      });

    // Create container
    case OPEN_CREATE_CONTAINER:
      return Object.assign({}, state, {
        createContainerVisible: true
      });
    case CLOSE_CREATE_CONTAINER:
      return Object.assign({}, state, {
        createContainerVisible: false,
        createError: null
      });
    case REQUEST_CREATE_CONTAINER:
      return Object.assign({}, state, {
        isCreating: true
      });
    case SUCCESS_CREATE_CONTAINER:
      return Object.assign({}, state, {
        createContainerVisible: false,
        isCreating: false,
        createError: null,
        didCreate: true,
        model: 'container'
      });
    case FAILURE_CREATE_CONTAINER:
      return Object.assign({}, state, {
        isCreating: false,
        createError: action.error
      });

    // Update container
    case OPEN_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        updateContainerVisible: true,
        selectedContainer: action.container
      });
    case CLOSE_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        updateContainerVisible: false,
        isUpdating: false,
        updateError: null,
      });
    case REQUEST_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        isUpdating: true
      });
    case SUCCESS_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        updateContainerVisible: false,
        isUpdating: false,
        updateError: null,
        didUpdate: true,
        model: 'container'
      });
    case FAILURE_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        isUpdating: false,
        updateError: action.error
      });
    
    // Delete container
    case REQUEST_DELETE_CONTAINER:
      return Object.assign({}, state, {
        isDeleting: true
      });
    case SUCCESS_DELETE_CONTAINER:
      return Object.assign({}, state, {
        isDeleting: false,
        didDelete: true,
        model: 'container'
      });
    case FAILURE_DELETE_CONTAINER:
      return Object.assign({}, state, {
        isDeleting: false
      });

    // Create workflow
    case OPEN_CREATE_WORKFLOW:
      return Object.assign({}, state, {
        createWorkflowVisible: true,
        selectedContainer: action.container
      });
    case CLOSE_CREATE_WORKFLOW:
      return Object.assign({}, state, {
        createWorkflowVisible: false,
        createError: null
      });
    case REQUEST_CREATE_WORKFLOW:
      return Object.assign({}, state, {
        isCreating: true
      });
    case SUCCESS_CREATE_WORKFLOW:
      return Object.assign({}, state, {
        createWorkflowVisible: false,
        isCreating: false,
        createError: null,
        didCreate: true,
        model: 'workflow'
      });
    case FAILURE_CREATE_WORKFLOW:
      return Object.assign({}, state, {
        isCreating: false,
        createError: action.error
      });

    // Update workflow
    case OPEN_UPDATE_WORKFLOW:
    return Object.assign({}, state, {
      updateWorkflowVisible: true,
      selectedContainer: action.container,
      selectedWorkflow: action.workflow
    });
  case CLOSE_UPDATE_WORKFLOW:
    return Object.assign({}, state, {
      updateWorkflowVisible: false,
      isUpdating: false,
      updateError: null,
    });
  case REQUEST_UPDATE_WORKFLOW:
    return Object.assign({}, state, {
      isUpdating: true
    });
  case SUCCESS_UPDATE_WORKFLOW:
    return Object.assign({}, state, {
      updateWorkflowVisible: false,
      isUpdating: false,
      updateError: null,
      didUpdate: true,
      model: 'workflow'
    });
  case FAILURE_UPDATE_WORKFLOW:
    return Object.assign({}, state, {
      isUpdating: false,
      updateError: action.error
    });

    // Delete workflow
    case REQUEST_DELETE_WORKFLOW:
    return Object.assign({}, state, {
      isDeleting: true
    });
  case SUCCESS_DELETE_WORKFLOW:
    return Object.assign({}, state, {
      isDeleting: false,
      didDelete: true,
      model: 'workflow'
    });
  case FAILURE_DELETE_WORKFLOW:
    return Object.assign({}, state, {
      isDeleting: false
    });

    default:
      return state;
  }
};

export default containers;