import apiRequest from "../shared/apiRequest";

export const register = ({ payload, onError, onFinish }) => {
  apiRequest("/auth/local/", {
    method: "PUT",
    payload,
    isAuthenticated: false,
    onSuccess: () => onFinish(),
    onError: response => onError(response.error)
  });
};

export const login = (payload, finishLogin, onError) => {
  apiRequest("/auth/local/", {
    method: "POST",
    payload,
    isAuthenticated: false,
    onSuccess: response => finishLogin(response),
    onError: error => onError(error)
  });
};

export const requestToken = (token, finishLogin) => {
  apiRequest("/auth/token/", {
    method: "POST",
    payload: { token },
    isAuthenticated: false,
    onSuccess: response => finishLogin(response)
  });
};
