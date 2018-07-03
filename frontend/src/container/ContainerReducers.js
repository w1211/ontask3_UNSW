import {
  START_FETCHING,
  FINISH_FETCHING,
  STORE_CONTAINERS,
  CHANGE_CONTAINER_ACCORDION,
  CHANGE_CONTAINER_TAB
} from "./ContainerActions";

function containers(state = {}, action) {
  switch (action.type) {
    case START_FETCHING:
      return Object.assign({}, state, {
        isFetching: true
      });
    case FINISH_FETCHING:
      return Object.assign({}, state, {
        isFetching: false
      });
    case STORE_CONTAINERS:
      return Object.assign({}, state, {
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
    default:
      return state;
  }
}

export default containers;
