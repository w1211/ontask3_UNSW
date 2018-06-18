import {
  REQUEST_CONTAINERS,
  RECEIVE_CONTAINERS,
  CHANGE_CONTAINER_ACCORDION,
  CHANGE_CONTAINER_TAB,
  OPEN_CONTAINER_MODAL,
  CLOSE_CONTAINER_MODAL,
  BEGIN_REQUEST_CONTAINER,
  FAILURE_REQUEST_CONTAINER,
  SUCCESS_REQUEST_CONTAINER
} from "./ContainerActions";

function containers(state = {}, action) {
  switch (action.type) {
    case REQUEST_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: true
      });
    case RECEIVE_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: false,
        containers: action.containers,
        // If an accordionKey is provided, then use it, and set the tabKey back to the first tab
        accordionKey: action.accordionKey
          ? action.accordionKey.toString()
          : state.accordionKey,
        tabKey: action.accordionKey ? "1" : state.tabKey
      });
    case CHANGE_CONTAINER_ACCORDION:
      return Object.assign({}, state, {
        accordionKey: action.key,
        tabKey: "1" // Reset the tab to the first key
      });
    case CHANGE_CONTAINER_TAB:
      return Object.assign({}, state, {
        tabKey: action.key
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

    default:
      return state;
  }
}

export default containers;
