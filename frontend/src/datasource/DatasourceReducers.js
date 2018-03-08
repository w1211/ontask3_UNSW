import {
  OPEN_DATASOURCE_MODAL,
  CLOSE_DATASOURCE_MODAL,

  BEGIN_REQUEST_DATASOURCE,
  FAILURE_REQUEST_DATASOURCE,
  SUCCESS_REQUEST_DATASOURCE
} from './DatasourceActions';


function datasource(state = {}, action) {
  switch (action.type) {
    case OPEN_DATASOURCE_MODAL:
      return Object.assign({}, state, {
        visible: true,
        containerId: action.containerId,
        selected: action.selected
      });
    case CLOSE_DATASOURCE_MODAL:
      return Object.assign({}, state, {
        visible: false,
        error: null,
        loading: false,
        containerId: null,
        selected: null
      });
      
    case BEGIN_REQUEST_DATASOURCE:
      return Object.assign({}, state, {
        loading: true
      });
    case FAILURE_REQUEST_DATASOURCE:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case SUCCESS_REQUEST_DATASOURCE:
      return Object.assign({}, state, {
        visible: false,
        loading: false,
        error: null,
        selected: null,
        containerId: null
      });

    default:
      return state;
  }
};

export default datasource;
