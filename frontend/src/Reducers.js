import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';
import workflow from './workflow/WorkflowReducers';

const rootReducer = combineReducers({
  containers,
  workflow
});

export default rootReducer;