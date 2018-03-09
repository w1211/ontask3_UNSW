import { notification, Modal } from 'antd';
import requestWrapper from '../shared/requestWrapper';
import { fetchContainers } from '../container/ContainerActions';

const confirm = Modal.confirm;

export const OPEN_DATASOURCE_MODAL = 'OPEN_DATASOURCE_MODAL';
export const CLOSE_DATASOURCE_MODAL = 'CLOSE_DATASOURCE_MODAL';

export const BEGIN_REQUEST_DATASOURCE = 'BEGIN_REQUEST_DATASOURCE';
export const FAILURE_REQUEST_DATASOURCE = 'FAILURE_REQUEST_DATASOURCE';
export const SUCCESS_REQUEST_DATASOURCE = 'SUCCESS_REQUEST_DATASOURCE';


export const openDatasourceModal = (containerId, selected) => ({
  type: OPEN_DATASOURCE_MODAL,
  containerId,
  selected
});

export const closeDatasourceModal = () => ({
  type: CLOSE_DATASOURCE_MODAL
});

const beginRequestDatasource = () => ({
  type: BEGIN_REQUEST_DATASOURCE
});

const failureRequestDatasource = (error) => ({
  type: FAILURE_REQUEST_DATASOURCE,
  error
});

const successRequestDatasource = () => ({
  type: SUCCESS_REQUEST_DATASOURCE
});

export const createDatasource = (containerId, payload, file) => dispatch => {
  payload.container = containerId;

  const isFile = (payload.connection.dbType === 'file');
  let data;
  if (isFile) {
    data = new FormData();
    data.append('file', file);
    data.append('delimiter', payload.delimiter)
    data.append('container', containerId);
    data.append('name', payload.name);
    data.append('dbType', 'file');
  } else {
    data = payload;
  }

  const parameters = {
    initialFn: () => {
      dispatch(beginRequestDatasource());
    },
    url: `/datasource/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureRequestDatasource(error));
    },
    successFn: () => {
      dispatch(successRequestDatasource());
      dispatch(fetchContainers());
      notification['success']({
        message: 'Datasource created',
        description: 'The datasource was successfully created.'
      });
    },
    payload: data,
    isNotJSON: isFile
  }

  requestWrapper(parameters);
};

export const updateDatasource = (datasourceId, payload, file) => dispatch => {
  dispatch(beginRequestDatasource());

  const isFile = (payload.connection.dbType === 'file');
  let data;
  if (isFile) {
    data = new FormData();
    if (file) data.append('file', file);
    data.append('delimiter', payload.delimiter)
    data.append('name', payload.name);
    data.append('dbType', 'file');
  } else {
    data = payload;
  }
  const parameters = {
    initialFn: () => {
      dispatch(beginRequestDatasource());
    },
    url: `/datasource/${datasourceId}/`,
    method: 'PATCH',
    errorFn: (error) => {
      dispatch(failureRequestDatasource(error));
    },
    successFn: () => {
      dispatch(successRequestDatasource());
      dispatch(fetchContainers());
      notification['success']({
        message: 'Datasource updated',
        description: 'The datasource was successfully updated.'
      });
    },
    payload: data,
    isNotJSON: isFile
  }

  requestWrapper(parameters);
};

export const deleteDatasource = (datasourceId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestDatasource()); },
    url: `/datasource/${datasourceId}/`,
    method: 'DELETE',
    errorFn: (error) => {
      dispatch(failureRequestDatasource(error));
    },
    successFn: () => {
      dispatch(successRequestDatasource());
      dispatch(fetchContainers());
      notification['success']({
        message: 'Datasource deleted',
        description: 'The datasource was successfully deleted.'
      });
    }
  }

  confirm({
    title: 'Confirm datasource deletion',
    content: 'Are you sure you want to delete this datasource?',
    okText: 'Continue with deletion',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk() {
      requestWrapper(parameters);
    }
  });
};
