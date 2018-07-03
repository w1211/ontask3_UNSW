import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import dataLab from './dataLab/DataLabReducers';
import workflow from './workflow/WorkflowReducers';
import staticPage from './staticPage/StaticPageReducers';

const rootReducer = combineReducers({
  containers,
  dataLab,
  workflow,
  staticPage
});

export default rootReducer;
