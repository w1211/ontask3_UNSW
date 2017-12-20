import { combineReducers } from 'redux';

import containers from './container/ContainerReducers';


const rootReducer = combineReducers({
  containers
});

export default rootReducer;