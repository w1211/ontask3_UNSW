import requestWrapper from "../shared/requestWrapper";

export const login = (values, beginLogin, finishLogin, onError) => {
  const parameters = {
    url: `/user/local/`,
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
    isUnauthenticated: false
  };

  requestWrapper(parameters);
};

export const requestToken = (token, finishLogin) => {
  const parameters = {
    url: `/user/token/`,
    method: "POST",
    errorFn: () => {},
    successFn: response => {
      finishLogin(response);
    },
    payload: { token },
    isUnauthenticated: false
  };

  requestWrapper(parameters);
};
