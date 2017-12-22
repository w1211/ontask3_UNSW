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
  FAILURE_UPDATE_CONTAINER
} from './ContainerActions';

const initialState = {
  isFetching: false,
  items: [],
  createModalVisible: false,
  isCreating: false,
  createError: null,
  selected: null,
  updateModalVisible: false,
  isUpdating: false,
  updateError: null
};

function containers(state = initialState, action) {
  switch (action.type) {

    // List containers
    case REQUEST_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case RECEIVE_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.containers
      });

    // Create container
    case OPEN_CREATE_CONTAINER:
      return Object.assign({}, state, {
        createModalVisible: true
      });
    case CLOSE_CREATE_CONTAINER:
      return Object.assign({}, state, {
        createModalVisible: false,
        isCreating: false,
        createError: null
      });
    case REQUEST_CREATE_CONTAINER:
      return Object.assign({}, state, {
        isCreating: true
      });
    case SUCCESS_CREATE_CONTAINER:
      return Object.assign({}, state, {
        createModalVisible: false,
        isCreating: false,
        createError: null
      });
    case FAILURE_CREATE_CONTAINER:
      return Object.assign({}, state, {
        isCreating: false,
        createError: action.error
      });

    // Update container
    case OPEN_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        updateModalVisible: true,
        selected: action.container
      });
    case CLOSE_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        updateModalVisible: false,
        isUpdating: false,
        updateError: null,
        selected: null
      });
    case REQUEST_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        isUpdating: true
      });
    case SUCCESS_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        updateModalVisible: false,
        isUpdating: false,
        updateError: null,
        selected: null
      });
    case FAILURE_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        isUpdating: false,
        updateError: action.error
      });
      
    default:
      return state;
  }
};

export default containers;