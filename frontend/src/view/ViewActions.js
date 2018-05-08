import { notification, Modal, message } from 'antd';
import requestWrapper from '../shared/requestWrapper';
import { fetchContainers } from '../container/ContainerActions';
import _ from 'lodash';

const confirm = Modal.confirm;


export const BEGIN_REQUEST_VIEW = 'BEGIN_REQUEST_VIEW';
export const FAILURE_REQUEST_VIEW = 'FAILURE_REQUEST_VIEW';
export const SUCCESS_REQUEST_VIEW = 'SUCCESS_REQUEST_VIEW';

export const RECEIVE_VIEW = 'RECEIVE_VIEW';
export const RECEIVE_DATASOURCES = 'RECIEVE_DATASOURCES';

export const RESOLVE_MATCHING_FIELD = 'RESOLVE_MATCHING_FIELD'
export const FAILURE_FIELD_MATCH_RESULT = 'FAILURE_FIELD_MATCH_RESULT';
export const RECEIVE_FIELD_MATCH_RESULT = 'RECEIVE_FIELD_MATCH_RESULT';

export const OPEN_VISUALISATION_MODAL = "OPEN_VISUALISATION_MODAL";
export const CLOSE_VISUALISATION_MODAL = "CLOSE_VISUALISATION_MODAL";

export const UPDATE_BUILD = 'UPDATE_BUILD';


const beginRequestView = () => ({
  type: BEGIN_REQUEST_VIEW
});

const failureRequestView = (error) => ({
  type: FAILURE_REQUEST_VIEW,
  error
});

const successRequestView = () => ({
  type: SUCCESS_REQUEST_VIEW
});

export const deleteView = (viewId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: `/view/${viewId}/`,
    method: 'DELETE',
    errorFn: (error) => {
      dispatch(failureRequestView()); // Don't pass in the error here since we don't need it stored in the state
      notification['error']({
        message: 'DataLab deletion failed',
        description: error
      });
    },
    successFn: () => {
      dispatch(successRequestView());
      dispatch(fetchContainers());
      notification['success']({
        message: 'DataLab deleted',
        description: 'The DataLab was successfully deleted.'
      });
    }
  }

  confirm({
    title: 'Confirm DataLab deletion',
    content: 'Are you sure you want to delete this DataLab?',
    okText: 'Continue with deletion',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk() {
      requestWrapper(parameters);
    }
  });
};

const receiveView = (view) => ({
  type: RECEIVE_VIEW,
  view
});

export const fetchView = (viewId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    // The 'retrieve_view' endpoint includes the datasources from the view's container, as 'datasources' in the response object
    // The datasources are used in the 'add imported column' interface of the view
    url: `/view/${viewId}/`,
    method: 'GET',
    errorFn: (error) => { 
      dispatch(failureRequestView(error));
    },
    successFn: (view) => {
      dispatch(receiveView(view));
    }
  }
  requestWrapper(parameters);
};

export const openVisualisationModal = (visualise, isRowWise) =>({
  type: OPEN_VISUALISATION_MODAL,
  visualise,
  isRowWise
})

export const closeVisualisationModal = () =>({
  type: CLOSE_VISUALISATION_MODAL
})

export const updateVisualisationChart = (viewId, chartType, numCols, rangeMin, rangeMax) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    // The 'retrieve_view' endpoint includes the datasources from the view's container, as 'datasources' in the response object
    // The datasources are used in the 'add imported column' interface of the view
    url: `/view/${viewId}/update_chart/`,
    method: 'PATCH',
    errorFn: (error) => { 
      dispatch(failureRequestView(error));
    },
    successFn: () => {
      notification['success']({
        message: 'Chart successfully saved',
        description: 'This chart were successfully saved.'
      });
    }
  }
  requestWrapper(parameters);
};

export const retrieveDataLab = (dataLabId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: `/view/${dataLabId}/retrieve_view/`,
    method: 'GET',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
    },
    successFn: (dataLab) => {
      dispatch({
        type: RECEIVE_VIEW,
        selectedId: dataLab.id,
        build: { 
          name: dataLab.name, 
          steps: dataLab.steps, 
          errors: { steps: [] }
        },
        data: dataLab.data,
        datasources: dataLab.datasources
      });
    }
  }

  requestWrapper(parameters);
};

export const retrieveDatasources = (containerId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: `/container/${containerId}/retrieve_datasources/`,
    method: 'GET',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
    },
    successFn: (datasources) => {
      dispatch({
        type: RECEIVE_DATASOURCES,
        build: {
          steps: [],
          errors: { steps: [] }
        },
        datasources
      });
    }
  }

  requestWrapper(parameters);
};

export const addModule = (mod) => (dispatch, getState) => {
  const { view } = getState();
  let build = Object.assign({}, view.build);

  // Initialize an object that represents this type of module
  // The form will then initialize form fields conditionally based on this type
  switch (mod.type) {
    case 'datasource':
      build.steps.push({ type: mod.type, datasource: { fields: [], labels: {} } });
      break;
    case 'form':
      build.steps.push({ type: mod.type, form: { } });
      break;
    default:
      break;
  }

  // Initialize an object that will store errors for this module
  build.errors.steps.push({});

  dispatch({
    type: UPDATE_BUILD,
    build
  });
};

export const deleteStep = () => (dispatch, getState) => {
  const { view } = getState();
  let build = Object.assign({}, view.build);

  // Delete the last step
  build.steps = build.steps.slice(0, -1);
  
  // Remove this step's errors
  build.errors.steps = build.errors.steps.slice(0, -1);

  dispatch({
    type: UPDATE_BUILD,
    build
  });
};

const datasourceFunction = (step, field, value) => {
  if (field === 'id') {
    // The datasource was changed, so reset the fields
    delete step.primary;
    delete step.matching;
    step.fields = []; // The fields to use from the given datasource
    step.labels = {}; // Object to hold the labels with (key, value) being (field, label)
  };

  if (field === 'edit' || field === 'remove') {
    // Remove the field from the list of fields (if it's there)
    step.fields = ('fields' in step) ? step.fields.filter(field => field !== value) : [];
    // Remove this field's label
    delete step.labels[value];
  };
};

const failureFieldMatchResult = (error) => ({
  type: FAILURE_FIELD_MATCH_RESULT,
  error
});

const receiveFieldMatchResult = (discrepenciesFound) => ({
  type: RECEIVE_FIELD_MATCH_RESULT,
  discrepenciesFound
});

export const checkForDiscrepencies = (build, checkStep, isEdit) => dispatch => {
  const parameters = {
    url: `/view/check_discrepencies/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureFieldMatchResult(error));
    },
    successFn: (result) => {
      dispatch(receiveFieldMatchResult(result));
    },
    payload: { build, checkStep, isEdit }
  }

  requestWrapper(parameters);
};

const resolveMatchingField = () => ({
  type: RESOLVE_MATCHING_FIELD
});

export const resolveDiscrepencies = (didResolve, result) => (dispatch, getState) => {
  const { view } = getState();
  let build = Object.assign({}, view.build);
  const discrepencies = view.discrepencies;

  let step = build.steps[discrepencies.step];

  if (!didResolve && !discrepencies.isEdit) {
    step.datasource.matching = undefined;
  } else if (didResolve) {
    step.discrepencies = {};

    if ('primary' in result) step.discrepencies.primary = result.primary;
    if ('matching' in result) step.discrepencies.matching = result.matching;
  };

  dispatch({
    type: UPDATE_BUILD,
    build
  });
  dispatch(resolveMatchingField());
}

export const updateBuild = (stepIndex, field, value, isNotField) => (dispatch, getState) => {
  const { view } = getState();
  let build = Object.assign({}, view.build);

  // Any field related to a module will call this function with a step index
  let step = (stepIndex !== null) ? build.steps[stepIndex] : null;

  // If this relates to a specific module
  if (step) {
    // Run any specific functional required for this 
    if (step.type === 'datasource') datasourceFunction(step.datasource, field, value);

    if (!isNotField) {
      _.set(step[step.type], field, value);
      _.set(build.errors.steps[stepIndex], field, false);
    }
  // If this is a field for the DataLab itself (e.g. DataLab name), i.e. has no stepIndex
  } else {
    _.set(build, field, value);
    _.set(build.errors, field, false);
  }
  
  dispatch({
    type: UPDATE_BUILD,
    build
  });
};

const validateDatasourceModule = (build, step, stepIndex) => {
  build.errors.steps.push({
    id: !step.datasource.id,
    primary: !step.datasource.primary,
    matching: stepIndex > 0 && !step.datasource.matching,
    fields: !('fields' in step.datasource && step.datasource.fields.length > 0)
  });
};

const getType = (str) => {
  // isNan() returns false if the input only contains numbers
  if (!isNaN(str)) return 'number';
  const dateCheck = new Date(str);
  if (isNaN(dateCheck.getTime())) return 'text';
  return 'date';
}

const saveDatasourceModule = (datasources, build, step) => {
  if ('discrepencies' in step) {
    if (step.discrepencies === null) {
      delete step.discrepencies;
    } else {
      if ('matching' in step.discrepencies && step.discrepencies.matching === null) delete step.discrepencies.matching;
      if ('primary' in step.discrepencies && step.discrepencies.primary === null) delete step.discrepencies.primary;
    };
  };

  // Guess the type of each field in each module
  const datasource = datasources.find(datasource => datasource.id === step.datasource.id);
  const data = datasource.data[0];
  step.datasource.types = {};
  step.datasource.fields.forEach(field => step.datasource.types[field] = getType(data[field].toString()));
};

export const saveBuild = (history, containerId, selectedId) => (dispatch, getState) => {
  const { view } = getState();
  let build = Object.assign({}, view.build);
  const datasources = view.datasources;
  
  if (containerId) build.container = containerId;

  build.errors = { steps: [] };
  build.errors.name = !build.name;

  // Validate each of the modules based on its type
  'steps' in build && build.steps.forEach((step, i) => {
    if (step.type === 'datasource') validateDatasourceModule(build, step, i);
  });

  // Create an array of booleans that denote whether an error exists in each module or non-module field
  const errors = [build.errors.name, ...build.errors.steps.map(step => 
    Object.keys(step).map(field => step[field]).includes(true)
  )];

  // If no modules have been added, then show an error
  // And return out of this function
  if (!('steps' in build) || build.steps.length === 0) {
    message.error('DataLab cannot be saved unless there is at least one module.');
    return;
  };

  // If errors are detected then prevent saving, and propagate the errors to the component
  // And return out of this function
  if (errors.includes(true)) {
    message.error('DataLab cannot be saved until all required fields are provided.');
    dispatch({
      type: UPDATE_BUILD,
      build
    });
    return;
  };

  // Run custom functionality for each step depending on the module type
  'steps' in build && build.steps.forEach((step, i) => {
    if (step.type === 'datasource') saveDatasourceModule(datasources, build, step);
  });
  
  // Perform save API call
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: selectedId ? `/view/${selectedId}/` : '/view/',
    method: selectedId ? 'PATCH' : 'POST',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
      notification['error']({
        message: `DataLab ${selectedId ? 'update' : 'creation'} failed`,
        description: error
      });
    },
    successFn: (response) => {
      dispatch(successRequestView());
       // Redirect to data manipulation interface
       history.push({ pathname: `/view/${response.id}` });
       notification['success']({
         message: `DataLab ${selectedId ? 'updated' : 'created'}`,
         description: `The DataLab was successfully ${selectedId ? 'updated' : 'created'}.`
       });
    },
    payload: build
  }

  requestWrapper(parameters);
};
