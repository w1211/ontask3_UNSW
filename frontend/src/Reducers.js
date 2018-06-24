import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import view from './view/ViewReducers';
import workflow from './workflow/WorkflowReducers';
import staticPage from './staticPage/StaticPageReducers';
import scheduler from './scheduler/SchedulerReducers';

const rootReducer = combineReducers({
  containers,
  view,
  workflow,
  staticPage,
  scheduler
});

export default rootReducer;
