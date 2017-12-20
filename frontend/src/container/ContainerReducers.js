import {
  REQUEST_CONTAINERS,
  RECEIVE_CONTAINERS
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
    default:
      return state;
  }
};

export default containers;