import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import staticPage from './staticPage/StaticPageReducers';

const rootReducer = combineReducers({
  containers,
  staticPage
});

export default rootReducer;
