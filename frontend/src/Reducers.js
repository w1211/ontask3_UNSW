import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import view from './view/ViewReducers';
import workflow from './workflow/WorkflowReducers';

const rootReducer = combineReducers({
  containers,
  view,
  workflow
});

export default rootReducer;