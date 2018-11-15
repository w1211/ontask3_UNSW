import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import dataLab from './dataLab/DataLabReducers';
import staticPage from './staticPage/StaticPageReducers';

const rootReducer = combineReducers({
  containers,
  dataLab,
  staticPage
});

export default rootReducer;
