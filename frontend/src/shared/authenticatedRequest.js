const authenticatedRequest = (parameters) => {
  if (parameters.initialFn) parameters.initialFn();

  let fetchInit = { 
    headers: {
      'Authorization': `Token ${localStorage.getItem('token')}`,
    }
  };
  if (parameters.payload) {
    if (!parameters.isNotJSON) {
      parameters.payload = JSON.stringify(parameters.payload);
      fetchInit.headers['Content-Type'] = 'application/json';
    }
    fetchInit.body = parameters.payload;
  }
  fetch(parameters.url, {
    method: parameters.method,
    ...fetchInit
  })
  .then(response => {
    if (response.status === 401) {
      // localStorage.removeItem('token');
    }
    if (response.status >= 400 && response.status < 600) {
      response.json().then(error => {
        parameters.errorFn(error[0]);
      });
    } else {
      if (response.status === 204) { // Api call was a DELETE, therefore response is empty
        parameters.successFn();
      } else {
        response.json().then(response => {
          parameters.successFn(response);
        });  
      }
    }
  })
  .catch(error => {
    parameters.errorFn('Failed to contact server. Please try again.');
  });

};

export default authenticatedRequest;
