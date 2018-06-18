import {
  BEGIN_REQUEST_VIEW,
  FAILURE_REQUEST_VIEW,
  SUCCESS_REQUEST_VIEW,

  RECEIVE_VIEW,
  RECEIVE_DATASOURCES,

  OPEN_VISUALISATION_MODAL,
  CLOSE_VISUALISATION_MODAL,

  RESOLVE_MATCHING_FIELD,
  FAILURE_FIELD_MATCH_RESULT,
  RECEIVE_FIELD_MATCH_RESULT,

  UPDATE_BUILD,
  REFRESH_DATA,

  BEGIN_REQUEST_FORM_FIELD,
  FINISH_REQUEST_FORM_FIELD
} from './ViewActions';


function view(state = {}, action) {
  switch (action.type) {
    case BEGIN_REQUEST_VIEW:
      return Object.assign({}, state, {
        loading: true
      });
    case FAILURE_REQUEST_VIEW:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case SUCCESS_REQUEST_VIEW:
      return Object.assign({}, state, {
        loading: false,
        error: null,
        datasources: null,
        selectedId: null,
        build: null
      });

    case RECEIVE_DATASOURCES:
      return Object.assign({}, state, {
        loading: false,
        build: action.build,
        datasources: action.datasources,
        data: null,
        selectedId: null
      });
    case RECEIVE_VIEW:
      return Object.assign({}, state, {
        loading: false,
        error: null,
        selectedId: action.selectedId,
        build: action.build,
        data: action.data,
        datasources: action.datasources,
        containerId: action.containerId
      });

    case OPEN_VISUALISATION_MODAL:
      return Object.assign({}, state, {
        visualisation_visible: true,
        visualise: action.visualise,
        isRowWise: action.isRowWise
      });
    case CLOSE_VISUALISATION_MODAL:
      return Object.assign({}, state, {
        visualisation_visible: false,
        visualise: null,
        isRowWise: null,
        error: null
      });

    case RESOLVE_MATCHING_FIELD:
      return Object.assign({}, state, {
        discrepencies: null,
        error: null
      });
    case FAILURE_FIELD_MATCH_RESULT:
      return Object.assign({}, state, {
        error: action.error
      });
    case RECEIVE_FIELD_MATCH_RESULT:
      return Object.assign({}, state, {
        discrepencies: action.discrepenciesFound,
        error: null
      });

    case UPDATE_BUILD:
      return Object.assign({}, state, {
        build: action.build
      });
    case REFRESH_DATA:
      return Object.assign({}, state, {
        data: action.data
      });

    case BEGIN_REQUEST_FORM_FIELD:
      return Object.assign({}, state, {
        formFieldLoading: true
      });
    case FINISH_REQUEST_FORM_FIELD:
      return Object.assign({}, state, {
        formFieldLoading: false
      });

    default:
      return state;
  }
};

export default view;
