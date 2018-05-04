import { notification, Modal } from 'antd';
import requestWrapper from '../shared/requestWrapper';

const confirm = Modal.confirm;

export const REQUEST_CONTAINERS = 'REQUEST_CONTAINERS';
export const RECEIVE_CONTAINERS = 'RECEIVE_CONTAINERS';
export const CHANGE_CONTAINER_ACCORDION = 'CHANGE_CONTAINER_ACCORDION';
export const CHANGE_CONTAINER_TAB = 'CHANGE_CONTAINER_TAB';

export const OPEN_CONTAINER_MODAL = 'OPEN_CONTAINER_MODAL';
export const CLOSE_CONTAINER_MODAL = 'CLOSE_CONTAINER_MODAL';
export const BEGIN_REQUEST_CONTAINER = 'BEGIN_REQUEST_CONTAINER';
export const FAILURE_REQUEST_CONTAINER = 'FAILURE_CREATE_CONTAINER';
export const SUCCESS_REQUEST_CONTAINER = 'SUCCESS_CREATE_CONTAINER';


const requestContainers = () => ({
  type: REQUEST_CONTAINERS
});

const receiveContainers = (containers, accordionKey) => ({
  type: RECEIVE_CONTAINERS,
  containers,
  accordionKey
});

export const changeContainerAccordion = (key) => ({
  type: CHANGE_CONTAINER_ACCORDION,
  key
});

export const changeContainerTab = (key) => ({
  type: CHANGE_CONTAINER_TAB,
  key
});

export const fetchContainers = (accordionKey) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(requestContainers());
    },
    url: `/container/retrieve_containers/`,
    method: 'GET',
    errorFn: (error) => {
      console.error(error);
    },
    successFn: (containers) => {
      dispatch(receiveContainers(containers, accordionKey));
    }
  }

  requestWrapper(parameters);
};

export const openContainerModal = (selected) => ({
  type: OPEN_CONTAINER_MODAL,
  selected
});

export const closeContainerModal = () => ({
  type: CLOSE_CONTAINER_MODAL
});

const beginRequestContainer = () => ({
  type: BEGIN_REQUEST_CONTAINER
});

const failureRequestContainer = (error) => ({
  type: FAILURE_REQUEST_CONTAINER,
  error
});

const successRequestContainer = () => ({
  type: SUCCESS_REQUEST_CONTAINER
});

export const createContainer = (payload) => (dispatch, getState) => {
  const { containers } = getState();
  // Determine what index the newly created container would have
  // And set this index as the currently active accordion key
  const numberOfContainers = containers.containers.length;

  const parameters = {
    initialFn: () => {
      dispatch(beginRequestContainer());
    },
    url: `/container/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureRequestContainer(error));
    },
    successFn: () => {
      dispatch(successRequestContainer());
      dispatch(fetchContainers(numberOfContainers));
      notification['success']({
        message: 'Container created',
        description: 'The container was successfully created.'
      });
    },
    payload: payload
  }

  requestWrapper(parameters);
};

export const updateContainer = (containerId, payload) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestContainer());
    },
    url: `/container/${containerId}/`,
    method: 'PUT',
    errorFn: (error) => {
      dispatch(failureRequestContainer(error));
    },
    successFn: () => {
      dispatch(successRequestContainer());
      dispatch(fetchContainers());
      notification['success']({
        message: 'Container updated',
        description: 'The container was successfully updated.'
      });
    },
    payload: payload
  }

  requestWrapper(parameters);
};

export const deleteContainer = (containerId) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestContainer());
    },
    url: `/container/${containerId}/`,
    method: 'DELETE',
    errorFn: (error) => {
      dispatch(failureRequestContainer(error));
    },
    successFn: () => {
      dispatch(successRequestContainer());
      dispatch(fetchContainers());
      notification['success']({
        message: 'Container deleted',
        description: 'The container and its associated datasources, views and workflows have been successfully deleted.'
      });
    }
  }

  confirm({
    title: 'Confirm container deletion',
    content: 'All associated datasources, views and workflows will be irrevocably deleted with the container.',
    okText: 'Continue with deletion',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk() {
      requestWrapper(parameters);
    }
  });
};
