import {
  RECEIVE_EMAIL_HISTORY,
  REQUEST_EMAIL_HISTORY
} from './StaticPageActions';

function staticPage(state = {}, action) {
  switch (action.type) {
    case RECEIVE_EMAIL_HISTORY:
      return Object.assign({}, state, {
        isFetching: false,
        emailHistory: action.emailHistory
      });
    case REQUEST_EMAIL_HISTORY:
      return Object.assign({}, state, {
        isFetching: true
      });
    default:
      return state;
  }
};

export default staticPage;
