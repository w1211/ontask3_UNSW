import {
  OPEN_VIEW_MODAL,
  CLOSE_VIEW_MODAL,
  CLEAR_MATCHING_FIELD,
  RESOLVE_MATCHING_FIELD,
  RECIEVE_FIELD_MATCH_RESULT,
  REFRESH_VIEW_FORM_STATE,
  UPDATE_VIEW_FORM_STATE
} from './ViewActions';

import _ from 'lodash';

function view(state = {}, action) {
  switch (action.type) {
    case OPEN_VIEW_MODAL:
      return Object.assign({}, state, {
        visible: true,
        containerId: action.containerId,
        datasources: action.datasources,
        views: action.views
      });

    case CLOSE_VIEW_MODAL:
      return Object.assign({}, state, {
        visible: false,
        error: null,
        loading: false,
        containerId: null,
        datasources: null,
        views: null,
        view: null,
        formState: null
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
        matchingField: null
      });

    case RECIEVE_FIELD_MATCH_RESULT:
      return Object.assign({}, state, {
        fieldMatchResult: action.fieldMatchResult,
        matchingField: action.matchingField
      });

    case REFRESH_VIEW_FORM_STATE:
      return Object.assign({}, state, {
        formState: action.payload
      });

    case UPDATE_VIEW_FORM_STATE:
      return Object.assign({}, state, {
        formState: _.merge(state.formState, action.payload)
      });

    default:
      return state;
  }
};

export default view;
