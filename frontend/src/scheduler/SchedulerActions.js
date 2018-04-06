export const OPEN_SCHEDULER_MODAL = 'OPEN_SCHEDULER_MODAL';
export const CLOSE_SCHEDULER_MODAL = 'CLOSE_SCHEDULER_MODAL';

export const BEGIN_REQUEST_SCHEDULER = 'BEGIN_REQUEST_SCHEDULER';
export const FAILURE_REQUEST_SCHEDULER = 'FAILURE_REQUEST_SCHEDULER';
export const SUCCESS_REQUEST_SCHEDULER = 'SUCCESS_REQUEST_SCHEDULER';


export const openSchedulerModal = (selectedId, schedule) => ({
  type: OPEN_SCHEDULER_MODAL,
  selectedId,
  schedule
});

export const closeSchedulerModal = () => ({
  type: CLOSE_SCHEDULER_MODAL,
});

export const beginRequestScheduler = () => ({
  type: BEGIN_REQUEST_SCHEDULER
});
  
export const failureRequestScheduler = (error) => ({
  type: FAILURE_REQUEST_SCHEDULER,
  error
});
  
export const successRequestScheduler = () => ({
  type: SUCCESS_REQUEST_SCHEDULER
});
