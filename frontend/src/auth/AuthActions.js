import requestWrapper from "../shared/requestWrapper";

export const register = ({ payload, onError, onFinish }) => {
  const parameters = {
    url: `/auth/local/`,
    method: "PUT",
    errorFn: response => {
      const { error } = response;
      onError(error);
    },
    successFn: () => onFinish(),
    payload,
    isUnauthenticated: true
  };

  requestWrapper(parameters);
};

export const login = (values, beginLogin, finishLogin, onError) => {
  const parameters = {
    url: `/auth/local/`,
    method: "POST",
    initialFn: () => {
      beginLogin();
    },
    errorFn: error => {
      onError(error);
    },
    successFn: response => {
      finishLogin(response);
    },
    payload: values,
    isUnauthenticated: true
  };

  requestWrapper(parameters);
};

export const requestToken = (token, finishLogin) => {
  const parameters = {
    url: `/auth/token/`,
    method: "POST",
    errorFn: () => {},
    successFn: response => {
      finishLogin(response);
    },
    payload: { token },
    isUnauthenticated: true
  };

  requestWrapper(parameters);
};
