import { notification, Modal, message } from 'antd';
import requestWrapper from '../shared/requestWrapper';
import { fetchContainers } from '../container/ContainerActions';

const confirm = Modal.confirm;

export const OPEN_VIEW_MODAL = 'OPEN_VIEW_MODAL';
export const CLOSE_VIEW_MODAL = 'CLOSE_VIEW_MODAL';
export const CLEAR_MATCHING_FIELD = 'CLEAR_MATCHING_FIELD';
export const RESOLVE_MATCHING_FIELD = 'RESOLVE_MATCHING_FIELD'
export const FAILURE_FIELD_MATCH_RESULT = 'FAILURE_FIELD_MATCH_RESULT';
export const RECIEVE_FIELD_MATCH_RESULT = 'RECIEVE_FIELD_MATCH_RESULT';
export const REFRESH_VIEW_FORM_STATE = 'REFRESH_VIEW_FORM_STATE';
export const UPDATE_VIEW_FORM_STATE = 'UPDATE_VIEW_FORM_STATE';

export const BEGIN_REQUEST_DATA_PREVIEW = 'BEGIN_REQUEST_DATA_PREVIEW';
export const FAILURE_REQUEST_DATA_PREVIEW = 'FAILURE_REQUEST_DATA_PREVIEW';
export const RECEIVE_DATA_PREVIEW = 'RECEIVE_DATA_PREVIEW';

export const BEGIN_REQUEST_VIEW = 'BEGIN_REQUEST_VIEW';
export const FAILURE_REQUEST_VIEW = 'FAILURE_REQUEST_VIEW';
export const SUCCESS_REQUEST_VIEW = 'SUCCESS_REQUEST_VIEW';

export const RECEIVE_VIEW = 'RECEIVE_VIEW';
export const OPEN_COLUMN_MODAL = 'OPEN_COLUMN_MODAL';
export const CLOSE_COLUMN_MODAL = 'CLOSE_COLUMN_MODAL';

export const UPDATE_BUILD = 'UPDATE_BUILD';
export const RECEIVE_DATASOURCES = 'RECIEVE_DATASOURCES';


export const openViewModal = (containerId, datasources, selected) => {
  let formState = {};
  
  // If a view is being edited, then construct the formstate based on its values
  // Form field objects are of the form { value: _value, error: _error } so we just provide the value
  if (selected) {
    formState.name = { value: selected.name };

    formState.fields = { value: [] };
    formState.defaultMatchingFields = {};

    formState.columns = selected.columns.map((column, index) => {
      const datasourceIndex = datasources.findIndex(datasource => datasource.id === column.datasource);
      const fieldIndex = datasources[datasourceIndex].fields.findIndex(field => field === column.field);
      if (index > 0) {
        formState.fields.value.push(`${datasourceIndex}_${fieldIndex}`);
      } else {
        formState.primary = { value: `${datasourceIndex}_${fieldIndex}`}
        // Set the matching default field for the datsource of the primary field
        formState.defaultMatchingFields[datasources[datasourceIndex].id] = { value: datasources[datasourceIndex].fields[fieldIndex] }
      }
    
      return {
        datasource: { value: column.datasource },
        field: { value: column.field },
        matching: { value: [column.matching] }, // Cascader requires an iterable value, so we just put [value]
        type: { value: [column.type] }, // Cascader requires an iterable value, so we just put [value]
        label: { value: column.label }
      };
    });

    if ('defaultMatchingFields' in selected) {
      selected.defaultMatchingFields.forEach(matchingField => {
        const datasourceId = matchingField.datasource;
        formState.defaultMatchingFields[datasourceId] = { value: matchingField.matching };
      });
    }
    
    if ('dropDiscrepencies' in selected) {
      formState.dropDiscrepencies = {};
      selected.dropDiscrepencies.forEach(discrepency => {
        const datasourceId = discrepency.datasource;
        const matchingField = discrepency.matching;

        formState.dropDiscrepencies[datasourceId] = {
          ...formState.dropDiscrepencies[datasourceId],
          [matchingField]: {
            primary: { value: discrepency.dropPrimary },
            matching: { value: discrepency.dropMatching }
          }
        };
      });
    }

  };

  return {
    type: OPEN_VIEW_MODAL,
    containerId,
    datasources,
    selectedId: selected ? selected.id : null,
    formState
  };
};

export const closeViewModal = () => ({
  type: CLOSE_VIEW_MODAL
});

const refreshViewFormState = (payload) => ({
  type: REFRESH_VIEW_FORM_STATE,
  payload
});

export const updateViewFormState = (payload) => ({
  type: UPDATE_VIEW_FORM_STATE,
  payload
});

export const getType = (str) => {
  // isNan() returns false if the input only contains numbers
  if (!isNaN(str)) return 'number';
  const dateCheck = new Date(str);
  if (isNaN(dateCheck.getTime())) return 'text';
  return 'date';
}

export const changePrimary = (primary) => (dispatch, getState) => {
  const { view } = getState();
  let formState = Object.assign({}, view.formState);
  
  // If the primary key hasn't changed, then we don't need to do anything  
  if (formState.primary && primary === formState.primary.value) return;

  const datasources = view.datasources;
  const [datasourceIndex, fieldIndex] = primary.split('_');
  const datasource = datasources[datasourceIndex];
  const datasourceId = datasource.id;
  const fieldName = datasource.fields[fieldIndex];

  // Reset any fields that have been set
  formState.fields = { value: [] };

  // Reset the columns if any have been set (since we are changing the primary key)
  // Set the first row of the columns list to reflect the new primary key
  formState.columns = [{
    datasource: { value: datasourceId },
    field: { value: fieldName },
    matching: { value: [fieldName] },
    type: { value: [getType(datasource.data[0][fieldName])] }
  }];

  // Reset the default mappings for every other datasource that might have been set against a different primary key
  // E.g. if the user completed the form for a given primary key, then went back and changed the primary key
  // Set the default matching field for the datasource of the primary key
  formState.defaultMatchingFields = {[datasourceId]: { value: fieldName }};

  // Update the primary key form object
  // IMPORTANT! We are overwriting the entire object so that any validation errors are cleared
  // This fixes a bug that occurs as follows:
  //    1. User presses Next without providing a value, primary field shows validation error
  //    2. User changes (provides) the value for primary field
  //    3. Update only primary field VALUE? Previous error due to missing value persists
  // Therefore, update the entire object and don't specify an error value, which is equivalent to no errors being present
  formState.primary = { value: primary };

  // Update the form state
  dispatch(refreshViewFormState(formState));
};

export const changeFields = (fields, label) => (dispatch, getState) => {
  const { view } = getState();
  let formState = Object.assign({}, view.formState);
  const datasources = view.datasources;

  const isAdd = (!formState.fields || fields.length > formState.fields.value.length);
  if (isAdd) {
    // Get the values of the newly added field (the last element in the list of fields, since its appended to end)
    const [datasourceIndex, fieldIndex] = fields[fields.length - 1].split('_');
    const datasource = datasources[datasourceIndex];
    const datasourceId = datasource.id;
    const fieldName = datasource.fields[fieldIndex];

    if (!formState.columns) formState.columns = [];
    
    // Add the new field to the columns (used by the details & preview mode)
    formState.columns.push({
      datasource: { value: datasourceId },
      field: { value: fieldName },
      matching: { value: [formState.defaultMatchingFields[datasourceId] ? formState.defaultMatchingFields[datasourceId].value : undefined] },
      type: { value: [getType(datasource.data[0][fieldName])] },
      label: { value: label } // This value is only provided to resolve the scenario where a field with a duplicate name is added
    })
  };

  const isRemove = (!isAdd && formState.fields && formState.fields.value.filter(field => fields.indexOf(field) < 0));
  if (isRemove) {
    // isRemove returns an array of fields that matched the filter
    // Since only one field is removed at a time, we can expect the array to always have a length of 1
    // So to extract the removed field from the array, we can just take the first element
    const removedField = isRemove[0];

    // Get the values of the newly removed field
    const [datasourceIndex, fieldIndex] = removedField.split('_');
    const datasourceId = datasources[datasourceIndex].id;
    const fieldName = datasources[datasourceIndex].fields[fieldIndex];

    // Remove this field from the list of columns
    formState.columns = formState.columns.filter(column => !(column.datasource.value === datasourceId && column.field.value === fieldName));
  }

  // Update fields form object
  formState.fields = { value: fields };

  // Update the form state
  dispatch(refreshViewFormState(formState));
};

const failureFieldMatchResult = (error) => ({
  type: FAILURE_FIELD_MATCH_RESULT,
  error
});

const receiveFieldMatchResult = (fieldMatchResult, matchingField) => ({
  type: RECIEVE_FIELD_MATCH_RESULT,
  fieldMatchResult,
  matchingField
});

export const changeDefaultMatchingField = (matchingField, primaryKey) => (dispatch, getState) => {
  const { view } = getState();
  let formState = Object.assign({}, view.formState);

  const datasourceId = matchingField.datasource;
  const matching = matchingField.field;

  // If the default matching field hasn't changed, then we don't need to do anything
  if (formState.defaultMatchingFields[datasourceId] && matching === formState.defaultMatchingFields[datasourceId].value) return;

  // Get all the fields which use this datasource
  const relatedFields = formState.columns.filter(column => (column.datasource.value === datasourceId));
  // For each field, update the matching field to the new one
  relatedFields.forEach(field => field.matching.value = [matching]);

  // Update matching field form object
  formState.defaultMatchingFields[datasourceId] = { value: matching };

  const parameters = {
    url: `/datasource/compare_matched_fields/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureFieldMatchResult(error));
    },
    successFn: (response) => {
      dispatch(receiveFieldMatchResult(response, matchingField));
    },
    payload: { matchingField, primaryKey }
  }

  requestWrapper(parameters);

  // Update the form state
  dispatch(refreshViewFormState(formState));
};

const clearMatchingField = (payload) => ({
  type: CLEAR_MATCHING_FIELD,
  payload
});

export const resolveMatchingField = () => ({
  type: RESOLVE_MATCHING_FIELD,
});

export const cancelResolveFieldMatch = () => (dispatch, getState) => {
  const { view } = getState();
  let formState = Object.assign({}, view.formState);

  const matchingField = view.matchingField;
  const datasourceId = matchingField.datasource;

  // Remove this matching field from all related fields
  // Get all the fields which use the same datasource as this matching field
  const relatedFields = formState.columns.filter(column => (column.datasource.value === datasourceId));
  // For each field, clear the matching field
  relatedFields.forEach(field => field.matching.value = undefined);

  // Clear the value of the matching field
  formState.defaultMatchingFields[datasourceId] = { value: undefined };

  dispatch(clearMatchingField(formState));
}

export const changeColumnOrder = (dragIndex, hoverIndex) => (dispatch, getState) => {
  const { view } = getState();
  let formState = Object.assign({}, view.formState);

  // Deduct 1 from the indices given that the primary key is excluded from the list of fields
  const tmpDragField = formState.fields.value[dragIndex - 1]
  formState.fields.value[dragIndex - 1] = formState.fields.value[hoverIndex - 1];
  formState.fields.value[hoverIndex - 1] = tmpDragField;
  
  // Swap the the fields in the list of columns
  // However, the form requires that each field name is written as a string like 'columns[0].field_name'
  // Therefore, we must iterate over each field's keys and change the name to reflect the new index
  const tmpDragColumn = formState.columns[dragIndex];

  formState.columns[dragIndex] = formState.columns[hoverIndex];
  Object.entries(formState.columns[dragIndex]).forEach(([key, value]) => {
    formState.columns[dragIndex][key].name = `columns[${dragIndex}].${key}`;
  })
  
  formState.columns[hoverIndex] = tmpDragColumn;
  Object.entries(formState.columns[hoverIndex]).forEach(([key, value]) => {
    formState.columns[hoverIndex][key].name = `columns[${hoverIndex}].${key}`;
  })

  dispatch(refreshViewFormState(formState));
};

const transformPayload = (payload) => {
  // When passing objects as parameters, JavaScript passes them by reference
  // Therefore we can directly modify the payload without needing to return anything from the function
  payload.columns = Object.entries(payload.columns).map(([key, value]) => ({
    ...value, 
    matching: value.matching && value.matching[0], 
    type: value.type && value.type[0] 
  }));
  
  if ('defaultMatchingFields' in payload) {
    payload.defaultMatchingFields = Object.entries(payload.defaultMatchingFields).map(([key, value]) => ({ 
      datasource: key, 
      matching: value 
    }));
  }
  
  if ('dropDiscrepencies' in payload) {
    let dropDiscrepencies = [];
    payload.dropDiscrepencies = Object.entries(payload.dropDiscrepencies).forEach(([datasource, fields]) => {
      Object.entries(fields).forEach(([field, value]) => {
        dropDiscrepencies.push({
          datasource: datasource, 
          matching: field, 
          dropMatching: value.matching,
          dropPrimary: value.primary
        })
      });
    });
    payload.dropDiscrepencies = dropDiscrepencies;
  }
}

const beginRequestDataPreview = () => ({
  type: BEGIN_REQUEST_DATA_PREVIEW
});

const failureRequestDataPreview = (error) => ({
  type: FAILURE_REQUEST_DATA_PREVIEW,
  error
});

const receiveDataPreview = (dataPreview) => ({
  type: RECEIVE_DATA_PREVIEW,
  dataPreview
});

export const previewData = (payload) => (dispatch, getState) => {
  // Modify the payload into a format that the backend is expecting
  transformPayload(payload);

  const parameters = {
    initialFn: () => { dispatch(beginRequestDataPreview()); },
    url: `/view/preview_data/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureRequestDataPreview(error));
    },
    successFn: (dataPreview) => {
      dispatch(receiveDataPreview(dataPreview));
    },
    payload: payload
  }

  requestWrapper(parameters);
};

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

export const createView = (containerId, payload, history) => dispatch => {
  payload.container = containerId;
  
  // Modify the payload into a format that the backend is expecting
  transformPayload(payload);

  const parameters = {
    initialFn: () => {
      dispatch(beginRequestView());
    },
    url: `/view/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
    },
    successFn: (response) => {
      dispatch(successRequestView());
      // Redirect to data manipulation interface
      history.push(`view/${response.id}`);
      notification['success']({
        message: 'View created',
        description: 'The view was successfully created.'
      });
    },
    payload: payload
  }

  requestWrapper(parameters);
};

export const updateView = (containerId, selectedId, payload, history) => dispatch => {  
  
  // Modify the payload into a format that the backend is expecting
  transformPayload(payload);

  const parameters = {
    initialFn: () => {
      dispatch(beginRequestView());
    },
    url: `/view/${selectedId}/`,
    method: 'PATCH',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
    },
    successFn: (response) => {
      dispatch(successRequestView());
      // Redirect to data manipulation interface
      history.push(`view/${response.id}`);
      notification['success']({
        message: 'View updated',
        description: 'The view was successfully updated.'
      });
    },
    payload: payload
  }

  requestWrapper(parameters);
};

export const deleteView = (viewId) => dispatch => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: `/view/${viewId}/`,
    method: 'DELETE',
    errorFn: (error) => {
      dispatch(failureRequestView()); // Don't pass in the error here since we don't need it stored in the state
      notification['error']({
        message: 'View deletion failed',
        description: error
      });
    },
    successFn: () => {
      dispatch(successRequestView());
      dispatch(fetchContainers());
      notification['success']({
        message: 'View deleted',
        description: 'The view was successfully deleted.'
      });
    }
  }

  confirm({
    title: 'Confirm view deletion',
    content: 'Are you sure you want to delete this view?',
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

export const openColumnModal = (column, index) => ({
  type: OPEN_COLUMN_MODAL,
  column, 
  index
});

export const closeColumnModal = () => ({
  type: CLOSE_COLUMN_MODAL
});

export const updateColumns = (viewId, columns, dropDiscrepencies, isAdd) => (dispatch, getState) => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: `/view/${viewId}/update_columns/`,
    method: 'PUT',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
    },
    successFn: () => {
      dispatch(fetchView(viewId));
      dispatch(closeColumnModal());
      notification['success']({
        message: `Column ${isAdd ? 'added' : 'updated'}`,
        description: `The column was successfully ${isAdd ? 'added' : 'updated'}.`
      });
    },
    payload: { columns, dropDiscrepencies }
  }

  requestWrapper(parameters);
};

export const deleteColumn = (viewId, columnIndex) => (dispatch, getState) => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: `/view/${viewId}/delete_column/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
    },
    successFn: () => {
      dispatch(fetchView(viewId));
      notification['success']({
        message: 'Column deleted',
        description: 'The column was successfully deleted from the view.'
      });
    },
    payload: { columnIndex }
  }

  requestWrapper(parameters);
};

export const checkMatchingfield = (matchingField, primaryKey) => (dispatch, getState) => {
  const parameters = {
    url: `/datasource/compare_matched_fields/`,
    method: 'POST',
    errorFn: (error) => {
      dispatch(failureFieldMatchResult(error));
    },
    successFn: (response) => {
      dispatch(receiveFieldMatchResult(response, matchingField));
    },
    payload: { matchingField, primaryKey }
  }

  requestWrapper(parameters);
};

export const updateDiscrepencies = (viewId, dropDiscrepencies) => (dispatch, getState) => {
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: `/view/${viewId}/update_discrepencies/`,
    method: 'PUT',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
    },
    successFn: () => {
      dispatch(fetchView(viewId));
      notification['success']({
        message: 'Discrepency management updated',
        description: 'The discrepency management settings were successfully updated.'
      });
    },
    payload: { dropDiscrepencies }
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
  build.steps.push({ type: mod.type, datasource: { fields: [], labels: {} } });

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

export const updateBuild = (stepIndex, field, value, isNotField) => (dispatch, getState) => {
  const { view } = getState();
  let build = Object.assign({}, view.build);

  // Fields that are not part of a module do not have a stepIndex (as they are not in a step)
  // If no stepIndex is provided, then the step will return false
  let step = (stepIndex !== null) ? build.steps[stepIndex] : null;

  // If there is a step (i.e. a stepIndex was provided) then perform any module/field specific actions
  if (step && step.type === 'datasource') {
    step = step.datasource;
    if (field === 'id') {
      // The datasource was changed, so reset the fields
      delete step.primary;
      delete step.matching;
      step.fields = []; // The fields to use from the given datasource
      step.labels = {}; // Object to hold the labels with (key, value) being (field, label)
    }  
    else if (field === 'edit' || field === 'remove') {
      // Remove the field from the list of fields (if it's there)
      step.fields = ('fields' in step) ? step.fields.filter(field => field !== value) : [];
      // Remove this field's label
      delete step.labels[value];
    };
  };

  // If isNotField was *not* provided, 
  // Then automatically merge the field value into the state, by using the given field name
  if (!isNotField) {
    // If this is a field inside a module (i.e. a stepIndex was provided)
    if (step) {
      step[field] = value;
      if (build.errors.steps[stepIndex]) build.errors.steps[stepIndex][field] = false;
    // Otherwise, this must be a field that is not specific to a module/step, such as the DataLab name
    } else {
      build[field] = value;
      build.errors[field] = false;
    }
  };

  dispatch({
    type: UPDATE_BUILD,
    build
  });
};

export const saveBuild = (history, containerId, selectedId) => (dispatch, getState) => {
  const { view } = getState();
  let build = Object.assign({}, view.build);
  
  build.errors = { steps: [] };
  
  build.errors.name = !build.name;

  'steps' in build && build.steps.forEach((step, i) => {
    if ('discrepencies' in step) {
      if (step.discrepencies === null) {
        delete step.discrepencies;
      } else {
        if ('matching' in step.discrepencies && step.discrepencies.matching === null) delete step.discrepencies.matching;
        if ('primary' in step.discrepencies && step.discrepencies.primary === null) delete step.discrepencies.primary;
      }
    };

    if (step.type === 'datasource') {
      step = step.datasource;
      build.errors.steps.push({
        id: !step.id,
        primary: !step.primary,
        matching: i > 0 && !step.matching,
        fields: !(step.fields.length > 0)
      });
    };
  });

  const errors = [build.errors.name, ...build.errors.steps.map(step => 
    // Create an array of booleans that denote whether an error exists in each field
    Object.keys(step).map(field => step[field]).includes(true)
  )];

  // If no modules have been added, then show an error
  if (!('steps' in build) || build.steps.length === 0) {
    message.error('DataLab cannot be saved unless there is at least one module.');
    return;
  };

  // If errors are detected then prevent saving, and propagate the errors to the component
  if (errors.includes(true)) {
    message.error('DataLab cannot be saved until all required fields are provided.');
    dispatch({
      type: UPDATE_BUILD,
      build
    });
    return;
  };

  if (containerId) build.container = containerId;

  // Perform save API call
  const parameters = {
    initialFn: () => { dispatch(beginRequestView()); },
    url: selectedId ? `/view/${selectedId}/` : '/view/',
    method: selectedId ? 'PATCH' : 'POST',
    errorFn: (error) => {
      dispatch(failureRequestView(error));
    },
    successFn: (response) => {
      dispatch(successRequestView());
       // Redirect to data manipulation interface
       console.log(history);

       history.push(`/view/${response.id}`);
       notification['success']({
         message: `DataLab ${selectedId ? 'updated' : 'created'}`,
         description: `The DataLab was successfully ${selectedId ? 'updated' : 'created'}.`
       });
    },
    payload: build
  }

  requestWrapper(parameters);
};

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