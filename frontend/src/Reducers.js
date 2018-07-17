import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import dataLab from './dataLab/DataLabReducers';
import action from './action/ActionReducers';
import staticPage from './staticPage/StaticPageReducers';

const rootReducer = combineReducers({
  containers,
  dataLab,
  action,
  staticPage
});

export default rootReducer;
