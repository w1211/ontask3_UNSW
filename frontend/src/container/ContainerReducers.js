import {
  REQUEST_CONTAINERS,
  RECEIVE_CONTAINERS,
  OPEN_CREATE_CONTAINER,
  CLOSE_CREATE_CONTAINER,
  REQUEST_CREATE_CONTAINER,
  SUCCESS_CREATE_CONTAINER,
  FAILURE_CREATE_CONTAINER,
} from './ContainerActions';

const initialState = {
  isFetching: false,
  items: []
};

function containers(state = initialState, action) {
  switch (action.type) {
    case REQUEST_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: true,
      });
    case RECEIVE_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: false,
        items: action.containers
      });
    case OPEN_CREATE_CONTAINER:
      return Object.assign({}, state, {
        modalVisible: true
      });
    case CLOSE_CREATE_CONTAINER:
      return Object.assign({}, state, {
        modalVisible: false,
        isSaving: false,
        submitError: null
      });
    case REQUEST_CREATE_CONTAINER:
      return Object.assign({}, state, {
        isSaving: true
      });
    case SUCCESS_CREATE_CONTAINER:
      return Object.assign({}, state, {
        modalVisible: false,
        isSaving: false,
        submitError: null
      });
    case FAILURE_CREATE_CONTAINER:
      console.log(action.error)
      return Object.assign({}, state, {
        isSaving: false,
        submitError: action.error
      });
    default:
      return state;
  }
};

export default containers;