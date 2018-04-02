import { notification, Modal } from 'antd';
import requestWrapper from '../shared/requestWrapper';
import { fetchContainers } from '../container/ContainerActions';

export const OPEN_SCHEDULER_MODAL = 'OPEN_SCHEDULER_MODAL';
export const CLOSE_SCHEDULER_MODAL = 'CLOSE_SCHEDULER_MODAL';

const confirm = Modal.confirm;

export const openSchedulerModal = (datasourceId, schedule) => ({
    type: OPEN_SCHEDULER_MODAL,
    datasourceId,
    schedule
});

export const closeSchedulerModal = () => ({
    type: CLOSE_SCHEDULER_MODAL,
});

export const createSchedule = (datasourceId, payload) => dispatch => {
    payload.datasourceId = datasourceId;
    const parameters = {
        url: `/datasource/${datasourceId}/create_schedule/`,
        method: 'PATCH',
        errorFn: (error) => {
          notification['error']({
            message: 'Datasource deletion failed',
            description: error
          });
        },
        successFn: () => {
            dispatch(closeSchedulerModal());
            dispatch(fetchContainers());
            notification['success']({
            message: 'Schedule created',
            description: 'The schedule was successfully created.'
          });
        },
        payload: payload,
        isNotJSON: false
    }
    requestWrapper(parameters);
  };

export const deleteSchedule = (datasourceId) => dispatch => {
    const parameters = {
      url: `/datasource/${datasourceId}/delete_schedule/`,
      method: 'PATCH',
      errorFn: (error) => {
        notification['error']({
          message: 'Datasource deletion failed',
          description: error
        });
      },
      successFn: () => {
        dispatch(closeSchedulerModal());
        dispatch(fetchContainers());
        notification['success']({
          message: 'Schedule deleted',
          description: 'The schedule was successfully deleted.'
        });
      }
    }
    confirm({
      title: 'Confirm schedule deletion',
      content: 'Are you sure you want to delete this schedule?',
      okText: 'Continue with deletion',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        requestWrapper(parameters);
      }
    });
  };