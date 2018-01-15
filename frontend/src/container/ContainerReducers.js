import {
  REQUEST_CONTAINERS,
  RECEIVE_CONTAINERS,
  RESELECT_CONTAINER,
  OPEN_CONTAINER_MODAL,
  CLOSE_CONTAINER_MODAL,
  BEGIN_REQUEST_CONTAINER,
  FAILURE_REQUEST_CONTAINER,
  SUCCESS_CREATE_CONTAINER,
  SUCCESS_UPDATE_CONTAINER,
  SUCCESS_DELETE_CONTAINER,
  OPEN_WORKFLOW_MODAL,
  CLOSE_WORKFLOW_MODAL,
  BEGIN_REQUEST_WORKFLOW,
  FAILURE_REQUEST_WORKFLOW,
  SUCCESS_CREATE_WORKFLOW,
  SUCCESS_UPDATE_WORKFLOW,
  SUCCESS_DELETE_WORKFLOW,
  OPEN_DATASOURCE_MODAL,
  CLOSE_DATASOURCE_MODAL,
  CHANGE_DATASOURCE,
  BEGIN_REQUEST_DATASOURCE,
  FAILURE_REQUEST_DATASOURCE,
  SUCCESS_CREATE_DATASOURCE,
  SUCCESS_UPDATE_DATASOURCE,
  SUCCESS_DELETE_DATASOURCE,
  CHANGE_ACTIVE_ACCORDION
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
    case CHANGE_ACTIVE_ACCORDION:
      return Object.assign({}, state, {
        activeAccordionKey: action.key
      });

    // Shared container actions
    case RESELECT_CONTAINER:
      return Object.assign({}, state, {
        selectedContainer: action.container
      });
    case OPEN_CONTAINER_MODAL:
      return Object.assign({}, state, {
        containerModalVisible: true,
        selectedContainer: action.container 
      });
    case CLOSE_CONTAINER_MODAL:
      return Object.assign({}, state, {
        containerModalVisible: false,
        containerError: null,
        containerLoading: false,
      });
    case BEGIN_REQUEST_CONTAINER:
      return Object.assign({}, state, {
        containerLoading: true
      });
    case FAILURE_REQUEST_CONTAINER:
      return Object.assign({}, state, {
        containerLoading: false,
        containerError: action.error
      });

    // Specific container actions
    case SUCCESS_CREATE_CONTAINER:
      return Object.assign({}, state, {
        containerModalVisible: false,
        containerLoading: false,
        containerError: null,
        didCreate: true,
        model: 'container'
      });
    case SUCCESS_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        containerModalVisible: false,
        containerLoading: false,
        containerError: null,
        didUpdate: true,
        model: 'container'
      });
    case SUCCESS_DELETE_CONTAINER:
      return Object.assign({}, state, {
        containerLoading: false,
        didDelete: true,
        model: 'container'
      });

    // Shared container actions
    case OPEN_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        workflowModalVisible: true,
        selectedContainer: action.container,
        selectedWorkflow: action.workflow
      });
    case CLOSE_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        workflowModalVisible: false,
        workflowError: null,
        workflowLoading: false
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
        didCreate: true,
        model: 'workflow'
      });
    case SUCCESS_UPDATE_WORKFLOW:
      return Object.assign({}, state, {
        workflowModalVisible: false,
        workflowLoading: false,
        workflowError: null,
        didUpdate: true,
        model: 'workflow'
      });
    case SUCCESS_DELETE_WORKFLOW:
      return Object.assign({}, state, {
        workflowLoading: false,
        didDelete: true,
        model: 'workflow'
      });

    // Shared container actions
    case OPEN_DATASOURCE_MODAL:
      return Object.assign({}, state, {
        datasourceModalVisible: true,
        selectedContainer: action.container
      });
    case CLOSE_DATASOURCE_MODAL:
      return Object.assign({}, state, {
        datasourceModalVisible: false,
        datasourceError: null,
        datasourceLoading: false,
        selectedDatasource: null
      });
    case CHANGE_DATASOURCE:
      return Object.assign({}, state, {
        selectedDatasource: action.datasource
      });
    case BEGIN_REQUEST_DATASOURCE:
      return Object.assign({}, state, {
        datasourceLoading: true
      });
    case FAILURE_REQUEST_DATASOURCE:
      return Object.assign({}, state, {
        datasourceLoading: false,
        datasourceError: action.error
      });

    // Specific datasource actions
    case SUCCESS_CREATE_DATASOURCE:
      return Object.assign({}, state, {
        datasourceModalVisible: false,
        datasourceLoading: false,
        datasourceError: null,
        didCreate: true,
        model: 'datasource'
      });
      case SUCCESS_UPDATE_DATASOURCE:
      return Object.assign({}, state, {
        datasourceModalVisible: false,
        datasourceLoading: false,
        datasourceError: null,
        didUpdate: true,
        model: 'datasource'
      });
    case SUCCESS_DELETE_DATASOURCE:
      return Object.assign({}, state, {
        datasourceLoading: false,
        didDelete: true,
        model: 'datasource',
        selectedDatasource: null
      });

    default:
      return state;
  }
};

export default containers;