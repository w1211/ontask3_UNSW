import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import view from './view/ViewReducers';
import datasource from './datasource/DatasourceReducers';
import workflow from './workflow/WorkflowReducers';
import staticPage from './staticPage/StaticPageReducers';
import scheduler from './scheduler/SchedulerReducers';

const rootReducer = combineReducers({
  containers,
  view,
  datasource,
  workflow,
  staticPage,
  scheduler
});

export default rootReducer;
