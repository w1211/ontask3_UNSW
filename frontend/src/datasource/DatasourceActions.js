import { notification } from "antd";
import requestWrapper from "../shared/requestWrapper";
import { fetchContainers } from "../container/ContainerActions";

export const fetchSheetnames = ({
  file,
  payload,
  onError,
  onSuccess
}) => dispatch => {
  let data;
  if (file) {
    data = new FormData();
    data.append("file", file, file.name);
  } else {
    data = payload;
  }

  const parameters = {
    url: `/datasource/get_sheetnames/`,
    method: "POST",
    errorFn: onError,
    successFn: response => {
      onSuccess(response.sheetnames);
    },
    payload: data,
    isNotJSON: file ? true : false
  };
  requestWrapper(parameters);
};


export const getDatasourceData = ({
  datasourceId,
  onError,
  onSuccess
}) => dispatch => {
  const parameters = {
    url: `/datasource/${datasourceId}/`,
    method: 'GET',
    errorFn: onError,
    successFn: response => onSuccess(response.data)
  }
  requestWrapper(parameters);
}

export const createDatasource = ({
  containerId,
  payload,
  file,
  onError,
  onSuccess
}) => dispatch => {
  payload.container = containerId;

  let data;
  if (file) {
    data = new FormData();
    data.append("file", file, file.name);
    data.append("name", payload.name);
    data.append("container", payload.container);
    data.append("payload", JSON.stringify(payload));
  } else {
    data = payload;
  }

  const parameters = {
    url: `/datasource/`,
    method: "POST",
    errorFn: onError,
    successFn: () => {
      onSuccess();
      dispatch(fetchContainers());
      notification["success"]({
        message: "Datasource created",
        description: "The datasource was successfully created."
      });
    },
    payload: data,
    isNotJSON: file ? true : false
  };

  requestWrapper(parameters);
};

export const updateDatasource = ({
  datasourceId,
  payload,
  file,
  onError,
  onSuccess
}) => dispatch => {
  let data;
  if (file) {
    data = new FormData();
    data.append("file", file, file.name);
    data.append("name", payload.name);
    data.append("payload", JSON.stringify(payload));
  } else {
    data = payload;
  }

  const parameters = {
    url: `/datasource/${datasourceId}/`,
    method: "PATCH",
    errorFn: onError,
    successFn: () => {
      onSuccess();
      dispatch(fetchContainers());
      notification["success"]({
        message: "Datasource updated",
        description: "The datasource was successfully updated."
      });
    },
    payload: data,
    isNotJSON: file ? true : false
  };

  requestWrapper(parameters);
};

export const deleteDatasource = ({ datasourceId, onFinish }) => dispatch => {
  const parameters = {
    url: `/datasource/${datasourceId}/`,
    method: "DELETE",
    errorFn: error => {
      onFinish();
      notification["error"]({
        message: "Datasource deletion failed",
        description: error
      });
    },
    successFn: () => {
      onFinish();
      dispatch(fetchContainers());
      notification["success"]({
        message: "Datasource deleted",
        description: "The datasource was successfully deleted."
      });
    }
  };

  requestWrapper(parameters);
};

export const updateSchedule = ({
  selected,
  payload,
  onError,
  onSuccess,
  isCreate
}) => dispatch => {
  const parameters = {
    url: `/datasource/${selected}/update_schedule/`,
    method: "PATCH",
    errorFn: onError,
    successFn: () => {
      onSuccess();
      dispatch(fetchContainers());
      notification["success"]({
        message: `Schedule ${isCreate ? "created" : "updated"}`,
        description: `The schedule was successfully ${
          isCreate ? "created" : "updated"
        }.`
      });
    },
    payload
  };

  requestWrapper(parameters);
};

export const deleteSchedule = ({
  selected,
  onError,
  onSuccess
}) => dispatch => {
  const parameters = {
    url: `/datasource/${selected}/delete_schedule/`,
    method: "PATCH",
    errorFn: onError,
    successFn: () => {
      onSuccess();
      dispatch(fetchContainers());
      notification["success"]({
        message: "Schedule deleted",
        description: "The schedule was successfully deleted."
      });
    }
  };
  requestWrapper(parameters);
};
