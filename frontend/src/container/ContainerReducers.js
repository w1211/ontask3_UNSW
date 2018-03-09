import {
  REQUEST_CONTAINERS,
  RECEIVE_CONTAINERS,
  CHANGE_CONTAINER_ACCORDION,

  OPEN_CONTAINER_MODAL,
  CLOSE_CONTAINER_MODAL,
  BEGIN_REQUEST_CONTAINER,
  FAILURE_REQUEST_CONTAINER,
  SUCCESS_REQUEST_CONTAINER,

  OPEN_WORKFLOW_MODAL,
  CLOSE_WORKFLOW_MODAL,
  BEGIN_REQUEST_WORKFLOW,
  FAILURE_REQUEST_WORKFLOW,
  SUCCESS_CREATE_WORKFLOW,
  SUCCESS_UPDATE_WORKFLOW,
  SUCCESS_DELETE_WORKFLOW
} from './ContainerActions';


const initialState = {
  uploadingFileList: []
}

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
        containers: action.containers
      });
    case CHANGE_CONTAINER_ACCORDION:
      return Object.assign({}, state, {
        containerAccordionKey: action.key
      });

    case OPEN_CONTAINER_MODAL:
      return Object.assign({}, state, {
        visible: true,
        selected: action.selected
      });
    case CLOSE_CONTAINER_MODAL:
      return Object.assign({}, state, {
        visible: false,
        error: null,
        loading: false,
        selected: null
      });
    case BEGIN_REQUEST_CONTAINER:
      return Object.assign({}, state, {
        loading: true
      });
    case FAILURE_REQUEST_CONTAINER:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case SUCCESS_REQUEST_CONTAINER:
      return Object.assign({}, state, {
        visible: false,
        loading: false,
        error: null,
        selected: null
      });

    // Shared container actions
    case OPEN_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        workflowModalVisible: true,
        containerId: action.containerId,
        workflow: action.workflow
      });
    case CLOSE_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        workflowModalVisible: false,
        workflowError: null,
        workflowLoading: false,
        workflow: null,
        containerId: null
      });
    case BEGIN_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        workflowLoading: true
      });
    case FAILURE_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        workflowLoading: false,
        workflowError: action.error
      });

    // Specific workflow actions
    case SUCCESS_CREATE_WORKFLOW:
      return Object.assign({}, state, {
        workflowModalVisible: false,
        workflowLoading: false,
        workflowError: null,
        workflow: null,
        containerId: null,
        didCreate: true,
        model: 'workflow'
      });
    case SUCCESS_UPDATE_WORKFLOW:
      return Object.assign({}, state, {
        workflowModalVisible: false,
        workflowLoading: false,
        workflowError: null,
        workflow: null,
        containerId: null,
        didUpdate: true,
        model: 'workflow'
      });
    case SUCCESS_DELETE_WORKFLOW:
      return Object.assign({}, state, {
        workflowLoading: false,
        workflow: null,
        containerId: null,
        didDelete: true,
        model: 'workflow'
      });

    default:
      return state;
  }
};

export default containers;
