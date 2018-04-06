import {
    OPEN_SCHEDULER_MODAL,
    CLOSE_SCHEDULER_MODAL,

    BEGIN_REQUEST_SCHEDULER,
    FAILURE_REQUEST_SCHEDULER,
    SUCCESS_REQUEST_SCHEDULER
} from './SchedulerActions';
  
  
function scheduler(state = {}, action) {
    switch (action.type) {
        case OPEN_SCHEDULER_MODAL:
            return Object.assign({}, state, {
                visible: true,
                selectedId: action.selectedId,
                schedule: action.schedule
            });
        case CLOSE_SCHEDULER_MODAL:
            return Object.assign({}, state, {
                visible: false,
                selectedId: null,
                schedule: null
            });

        case BEGIN_REQUEST_SCHEDULER:
            return Object.assign({}, state, {
                loading: true
            });
        case FAILURE_REQUEST_SCHEDULER:
            return Object.assign({}, state, {
                loading: false,
                error: action.error
            });
        case SUCCESS_REQUEST_SCHEDULER:
            return Object.assign({}, state, {
                visible: false,
                loading: false,
                error: null,
                selectedId: null,
                schedule: null
            });

        default:
            return state;
    }
};
  
export default scheduler;
