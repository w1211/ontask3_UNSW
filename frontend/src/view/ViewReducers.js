import {
  OPEN_VIEW_MODAL,
  CLOSE_VIEW_MODAL,
  
  CLEAR_MATCHING_FIELD,
  RESOLVE_MATCHING_FIELD,
  FAILURE_FIELD_MATCH_RESULT,
  RECIEVE_FIELD_MATCH_RESULT,
  REFRESH_VIEW_FORM_STATE,
  UPDATE_VIEW_FORM_STATE,

  BEGIN_REQUEST_DATA_PREVIEW,
  FAILURE_REQUEST_DATA_PREVIEW,
  RECEIVE_DATA_PREVIEW,

  BEGIN_REQUEST_VIEW,
  FAILURE_REQUEST_VIEW,
  SUCCESS_REQUEST_VIEW,

  RECEIVE_VIEW,
  OPEN_COLUMN_MODAL,
  CLOSE_COLUMN_MODAL
} from './ViewActions';

import _ from 'lodash';

function view(state = {}, action) {
  switch (action.type) {
    case OPEN_VIEW_MODAL:
      return Object.assign({}, state, {
        visible: true,
        containerId: action.containerId,
        datasources: action.datasources,
        selectedId: action.selectedId,
        formState: action.formState
      });
    case CLOSE_VIEW_MODAL:
      return Object.assign({}, state, {
        visible: false,
        error: null,
        loading: false,
        containerId: null,
        datasources: null,
        selectedId: null,
        formState: null,
        dataLoading: null,
        dataPreview: null
      });

    case CLEAR_MATCHING_FIELD:
      return Object.assign({}, state, {
        fieldMatchResult: null,
        matchingField: null,
        formState: action.payload
      });
    case RESOLVE_MATCHING_FIELD:
      return Object.assign({}, state, {
        fieldMatchResult: null,
        matchingField: null,
        error: null
      });
    case FAILURE_FIELD_MATCH_RESULT:
      return Object.assign({}, state, {
        error: action.error
      });
    case RECIEVE_FIELD_MATCH_RESULT:
      return Object.assign({}, state, {
        fieldMatchResult: action.fieldMatchResult,
        matchingField: action.matchingField,
        error: null
      });

    case REFRESH_VIEW_FORM_STATE:
      return Object.assign({}, state, {
        formState: action.payload
      });
    case UPDATE_VIEW_FORM_STATE:
      return Object.assign({}, state, {
        formState: _.merge(state.formState, action.payload)
      });

    case BEGIN_REQUEST_DATA_PREVIEW:
      return Object.assign({}, state, {
        dataLoading: true
      });
    case FAILURE_REQUEST_DATA_PREVIEW:
      return Object.assign({}, state, {
        dataLoading: false,
        error: action.error
      });
    case RECEIVE_DATA_PREVIEW:
      return Object.assign({}, state, {
        dataLoading: false,
        dataPreview: action.dataPreview
      });

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
        visible: false,
        loading: false,
        error: null,
        datasources: null,
        selectedId: null,
        formState: null
      });
      
    case RECEIVE_VIEW:
      return Object.assign({}, state, {
        loading: false,
        view: action.view
      });
    case OPEN_COLUMN_MODAL:
      return Object.assign({}, state, {
        visible: true,
        column: action.column,
        index: action.index
      });
    case CLOSE_COLUMN_MODAL:
      return Object.assign({}, state, {
        visible: false,
        column: null,
        index: null,
        error: null
      });

    default:
      return state;
  }
};

export default view;
