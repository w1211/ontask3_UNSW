import requestWrapper from '../shared/requestWrapper';

export const OPEN_VIEW_MODAL = 'OPEN_VIEW_MODAL';
export const CLOSE_VIEW_MODAL = 'CLOSE_VIEW_MODAL';
export const CLEAR_MATCHING_FIELD = 'CLEAR_MATCHING_FIELD';
export const RESOLVE_MATCHING_FIELD = 'RESOLVE_MATCHING_FIELD'
export const RECIEVE_FIELD_MATCH_RESULT = 'RECIEVE_FIELD_MATCH_RESULT';
export const REFRESH_VIEW_FORM_STATE = 'REFRESH_VIEW_FORM_STATE';
export const UPDATE_VIEW_FORM_STATE = 'UPDATE_VIEW_FORM_STATE';

export const BEGIN_REQUEST_DATA_PREVIEW = 'BEGIN_REQUEST_DATA_PREVIEW';
export const FAILURE_REQUEST_DATA_PREVIEW = 'FAILURE_REQUEST_DATA_PREVIEW';
export const RECEIVE_DATA_PREVIEW = 'RECEIVE_DATA_PREVIEW';


export const openViewModal = (containerId, datasources, views) => ({
  type: OPEN_VIEW_MODAL,
  containerId,
  datasources,
  views
});

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

const getType = (str) => {
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
      console.log(error);
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