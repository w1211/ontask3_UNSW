import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import workflow from './workflow/WorkflowReducers';
import staticPage from './staticPage/StaticPageReducers';

const rootReducer = combineReducers({
  containers,
  workflow,
  staticPage
});

export default rootReducer;