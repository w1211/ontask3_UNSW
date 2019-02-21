const apiRequest = async (
  url,
  {
    method = "GET",
    payload = null,
    isAuthenticated = true,
    isJSON = true,
    onSuccess = () => {},
    onError = () => {}
  }
) => {
  const options = {
    method,
    headers: {}
  };

  if (isAuthenticated)
    options.headers.Authorization = `Token ${sessionStorage.getItem("token")}`;

  if (payload) {
    if (isJSON) {
      payload = JSON.stringify(payload);
      options.headers["Content-Type"] = "application/json";
    }

    options.body = payload;
  }

  // Perform the API request
  let response;
  try {
    response = await fetch(
      `${process.env.REACT_APP_API_DOMAIN}${url}`,
      options
    );
  } catch (err) {
    onError("Failed to contact server. Please try again.");
    return;
  }

  // 401 User unauthorized was returned
  if (response.status === 401) {
    onError("You are not authorized to perform that action.");
    return;
  }

  // If the request method was a DELETE, then the response body is empty
  if (response.status === 204) {
    onSuccess();
    return;
  }

  let result;

  const responseType = response.headers.get("content-type");
  if (responseType && responseType.indexOf("application/json") !== -1) {
    try {
      result = await response.json();
    } catch (err) {
      onError("Failed to parse response from server.");
      return;
    }
  }

  // If an error code was returned by the request (other than 401)
  if (response.status >= 400 && response.status < 600) {
    // Return the response as an error
    onError(result, response.status);
  } else {
    onSuccess(result);
  }
};

export default apiRequest;
