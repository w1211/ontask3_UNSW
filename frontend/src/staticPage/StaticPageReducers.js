import {
  RECEIVE_EMAIL_HISTORY,
  REQUEST_EMAIL_HISTORY,
  UPDATE_EMAIL_DATA
} from './StaticPageActions';

const initialState = {
  data: [],
  columns: []
}

function staticPage(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_EMAIL_HISTORY:
      return Object.assign({}, state, {
        isFetching: false,
        data: action.data,
        columns: action.columns
      });
    case REQUEST_EMAIL_HISTORY:
      return Object.assign({}, state, {
        isFetching: true
      });
    case UPDATE_EMAIL_DATA:
      return Object.assign({}, state, {
        data: action.data,
        matchReg: action.matchReg,
        matchField: action.matchField
      });
    default:
      return state;
  }
};

export default staticPage;
