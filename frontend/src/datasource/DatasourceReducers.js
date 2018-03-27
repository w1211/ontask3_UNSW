import {
  OPEN_DATASOURCE_MODAL,
  CLOSE_DATASOURCE_MODAL,

  BEGIN_REQUEST_DATASOURCE,
  FAILURE_REQUEST_DATASOURCE,
  SUCCESS_REQUEST_DATASOURCE,
  SUCCESS_REQUEST_DATASOURCE_WITHOUT_CLOSE,
  
  RECEIVE_SHEETNAMES
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
        selected: null,
        sheetnames: null
      });
      
    case RECEIVE_SHEETNAMES:
      return Object.assign({}, state, {
        sheetnames: action.sheetnames
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
        containerId: null,
        sheetnames: null
      });
    case SUCCESS_REQUEST_DATASOURCE_WITHOUT_CLOSE:
      return Object.assign({}, state, {
        loading: false,
        error: null,
      });
    default:
      return state;
  }
};

export default datasource;
