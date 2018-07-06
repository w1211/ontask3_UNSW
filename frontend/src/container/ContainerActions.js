import { notification } from "antd";
import requestWrapper from "../shared/requestWrapper";

export const START_FETCHING = "START_FETCHING";
export const FINISH_FETCHING = "FINISH_FETCHING";
export const STORE_CONTAINERS = "STORE_CONTAINERS";

export const CHANGE_CONTAINER_ACCORDION = "CHANGE_CONTAINER_ACCORDION";
export const CHANGE_CONTAINER_TAB = "CHANGE_CONTAINER_TAB";

const storeContainers = (containers, accordionKey) => ({
  type: STORE_CONTAINERS,
  containers,
  accordionKey
});

export const changeContainerAccordion = key => ({
  type: CHANGE_CONTAINER_ACCORDION,
  key
});

export const changeContainerTab = key => ({
  type: CHANGE_CONTAINER_TAB,
  key
});

export const fetchContainers = accordionKey => dispatch => {
  // isFetching is specifically set as a redux state variable instead of a local state
  // variable. This is because fetchContainers() is called from action generators used by
  // many different child components of the root Container component. Therefore we avoid
  // the need to pass in a setState() function to all of these child components that modify
  // the isFetching boolean in the root Container component.
  dispatch({ type: START_FETCHING });

  const parameters = {
    url: `/container/retrieve_containers/`,
    method: "GET",
    errorFn: error => {
      dispatch({ type: FINISH_FETCHING });
      console.error(error);
    },
    successFn: response => {
      const { containers } = response;
      dispatch({ type: FINISH_FETCHING });
      dispatch(storeContainers(containers, accordionKey));
    }
  };

  requestWrapper(parameters);
};

export const createContainer = ({ payload, onError, onSuccess }) => (
  dispatch,
  getState
) => {
  const { containers } = getState().containers;
  // Determine what index the newly created container would have
  // And set this index as the currently active accordion key
  const numberOfContainers = containers.length;

  const parameters = {
    url: `/container/`,
    method: "POST",
    errorFn: onError,
    successFn: container => {
      onSuccess();
      dispatch(fetchContainers(numberOfContainers));
      notification["success"]({
        message: "Container created",
        description: "The container was successfully created."
      });
    },
    payload
  };

  requestWrapper(parameters);
};

export const updateContainer = ({
  containerId,
  payload,
  onError,
  onSuccess
}) => dispatch => {
  const parameters = {
    url: `/container/${containerId}/`,
    method: "PATCH",
    errorFn: onError,
    successFn: () => {
      onSuccess();
      dispatch(fetchContainers());
      notification["success"]({
        message: "Container updated",
        description: "The container was successfully updated."
      });
    },
    payload
  };

  requestWrapper(parameters);
};

export const deleteContainer = ({ containerId, onFinish }) => dispatch => {
  const parameters = {
    url: `/container/${containerId}/`,
    method: "DELETE",
    errorFn: () => {
      notification["error"]({
        message: "Failed deletion",
        description: "The container was not deleted."
      });
    },
    successFn: () => {
      onFinish();
      dispatch(fetchContainers());
      notification["success"]({
        message: "Container deleted",
        description:
          "The container and its associated datasources, views and workflows have been successfully deleted."
      });
    }
  };

  requestWrapper(parameters);
};

export const surrenderAccess = ({ containerId, onFinish }) => dispatch => {
  const parameters = {
    url: `/container/${containerId}/surrender_access/`,
    method: "POST",
    errorFn: onFinish,
    successFn: () => {
      onFinish();
      dispatch(fetchContainers());
      notification["success"]({
        message: "Surrendered access",
        description: "You no longer have access to the container."
      });
    }
  };

  requestWrapper(parameters);
};
