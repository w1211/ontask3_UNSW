import {
    
    OPEN_SCHEDULER_MODAL,
    CLOSE_SCHEDULER_MODAL

} from './SchedulerActions';
  
  
  function scheduler(state = {}, action) {
    switch (action.type) {
      case OPEN_SCHEDULER_MODAL:
        return Object.assign({}, state, {
          visible: true,
          datasourceId: action.datasourceId,
          schedule: action.schedule
        });
      case CLOSE_SCHEDULER_MODAL:
        return Object.assign({}, state, {
          visible: false
        });
      default:
        return state;
    }
  };
  
  export default scheduler;
  