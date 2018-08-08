const requestWrapper = ({
  initialFn,
  isUnauthenticated,
  method,
  payload,
  isNotJSON,
  url,
  errorFn,
  successFn
}) => {
  if (initialFn) initialFn();

  let options = {
    method,
    headers: {}
  };

  if (!isUnauthenticated) {
    options.headers.Authorization = `Token ${localStorage.getItem("token")}`;
  }

  if (payload) {
    if (!isNotJSON) {
      payload = JSON.stringify(payload);
      options.headers["Content-Type"] = "application/json";
    }
    options.body = payload;
  }

  fetch(`${process.env.REACT_APP_API_DOMAIN}${url}`, options)
    .then(response => {
      if (response.status === 401) {
        localStorage.removeItem("token");
        errorFn("Invalid credentials");
      } else if (response.status >= 400 && response.status < 600) {
        response.json().then(error => {
          errorFn(typeof error === "object" ? error : error[0]);
        });
      } else {
        if (response.status === 204) {
          // Api call was a DELETE, therefore response is empty
          successFn();
        } else {
          response.json().then(response => {
            successFn(response);
          });
        }
      }
    })
    .catch(() => {
      errorFn("Failed to contact server. Please try again.");
    });
};

export default requestWrapper;
