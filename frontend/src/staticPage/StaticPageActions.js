import requestWrapper from '../shared/requestWrapper';

export const REQUEST_EMAIL_HISTORY = 'REQUEST_EMAIL_HISTORY';
export const RECEIVE_EMAIL_HISTORY = 'RECEIVE_EMAIL_HISTORY';
export const UPDATE_EMAIL_DATA = 'UPDATE_EMAIL_DATA';

const requestEmailHistory = () => ({
  type: REQUEST_EMAIL_HISTORY
});

const receiveEmailHistory = (data, columns) => ({
  type: RECEIVE_EMAIL_HISTORY,
  data,
  columns
});

//matchReg is for highlighting matched text
const updateEmailData = (data, matchReg, matchField) => ({
  type: UPDATE_EMAIL_DATA,
  data,
  matchReg,
  matchField
});

export const fetchEmailHistory = (workflowId) => dispatch => {
  const parameters = {
    initialFn: () => {
      dispatch(requestEmailHistory());
    },
    url: `/workflow/${workflowId}/retrieve_history/`,
    method: 'GET',
    errorFn: (error) => {
      console.error(error);
    },
    successFn: (response) => {
      dispatch(receiveEmailHistory(response['data'], response['columns']));
    }
  };
  requestWrapper(parameters);
};

const print = (colName) =>{
  console.log(colName);
}

//store matched row to data, matching item type can be text or date
export const onSearchColumn = (reg, field, data, isSearchDate) => dispatch => {
  if(isSearchDate){
    const updatedData = data.map((record) => {
      const date = record[field].split(" ")[-1];
      if (date === reg) {
        return {
          ...record
        };
      }
      return null;
    }).filter(record => !!record);
    dispatch(updateEmailData(updatedData, reg, field));
  }
  else{
    const updatedData = data.map((record) => {
      const match = record[field].match(reg);
      if (!match) {
        return null;
      }
      return {
        ...record,
      };
    }).filter(record => !!record);
    dispatch(updateEmailData(updatedData, reg, field));
  }
};