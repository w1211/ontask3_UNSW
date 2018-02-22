import {
  REQUEST_CONTAINERS,
  RECEIVE_CONTAINERS,
  CHANGE_CONTAINER_ACCORDION,

  OPEN_CONTAINER_MODAL,
  CLOSE_CONTAINER_MODAL,
  BEGIN_REQUEST_CONTAINER,
  FAILURE_REQUEST_CONTAINER,
  SUCCESS_CREATE_CONTAINER,
  SUCCESS_UPDATE_CONTAINER,
  SUCCESS_DELETE_CONTAINER,

  OPEN_WORKFLOW_MODAL,
  CLOSE_WORKFLOW_MODAL,
  BEGIN_REQUEST_WORKFLOW,
  FAILURE_REQUEST_WORKFLOW,
  SUCCESS_CREATE_WORKFLOW,
  SUCCESS_UPDATE_WORKFLOW,
  SUCCESS_DELETE_WORKFLOW,

  OPEN_DATASOURCE_MODAL,
  CLOSE_DATASOURCE_MODAL,
  CHANGE_DATASOURCE,
  BEGIN_REQUEST_DATASOURCE,
  FAILURE_REQUEST_DATASOURCE,
  SUCCESS_CREATE_DATASOURCE,
  SUCCESS_UPDATE_DATASOURCE,
  SUCCESS_DELETE_DATASOURCE,

  UPLOAD_EXTERNAL_FILE,
  ADD_UPLOADING_FILE,
  REMOVE_UPLOADING_FILE,

  OPEN_VIEW_MODAL,
  CLOSE_VIEW_MODAL,
  UPDATE_VIEW_FORM_STATE
} from './ContainerActions';

import _ from 'lodash';


const initialState = {
  uploadingFileList: []
}

function containers(state = initialState, action) {
  switch (action.type) {
    // List containers
    case REQUEST_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: true,
        didCreate: false,
        didUpdate: false,
        didDelete: false
      });
    case RECEIVE_CONTAINERS:
      return Object.assign({}, state, {
        isFetching: false,
        containers: action.containers
      });
    case CHANGE_CONTAINER_ACCORDION:
      return Object.assign({}, state, {
        containerAccordionKey: action.key
      });

    // Shared container actions
    case OPEN_CONTAINER_MODAL:
      return Object.assign({}, state, {
        containerModalVisible: true,
        container: action.container
      });
    case CLOSE_CONTAINER_MODAL:
      return Object.assign({}, state, {
        containerModalVisible: false,
        containerError: null,
        containerLoading: false,
        container: null
      });
    case BEGIN_REQUEST_CONTAINER:
      return Object.assign({}, state, {
        containerLoading: true
      });
    case FAILURE_REQUEST_CONTAINER:
      return Object.assign({}, state, {
        containerLoading: false,
        containerError: action.error
      });

    // Specific container actions
    case SUCCESS_CREATE_CONTAINER:
      return Object.assign({}, state, {
        containerModalVisible: false,
        containerLoading: false,
        containerError: null,
        didCreate: true,
        model: 'container',
        container: null
      });
    case SUCCESS_UPDATE_CONTAINER:
      return Object.assign({}, state, {
        containerModalVisible: false,
        containerLoading: false,
        containerError: null,
        container: null,
        didUpdate: true,
        model: 'container'
      });
    case SUCCESS_DELETE_CONTAINER:
      return Object.assign({}, state, {
        containerLoading: false,
        container: null,
        didDelete: true,
        model: 'container'
      });

    // Shared container actions
    case OPEN_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        workflowModalVisible: true,
        containerId: action.containerId,
        workflow: action.workflow
      });
    case CLOSE_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        workflowModalVisible: false,
        workflowError: null,
        workflowLoading: false,
        workflow: null,
        containerId: null
      });
    case BEGIN_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        workflowLoading: true
      });
    case FAILURE_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        workflowLoading: false,
        workflowError: action.error
      });

    // Specific workflow actions
    case SUCCESS_CREATE_WORKFLOW:
      return Object.assign({}, state, {
        workflowModalVisible: false,
        workflowLoading: false,
        workflowError: null,
        workflow: null,
        containerId: null,
        didCreate: true,
        model: 'workflow'
      });
    case SUCCESS_UPDATE_WORKFLOW:
      return Object.assign({}, state, {
        workflowModalVisible: false,
        workflowLoading: false,
        workflowError: null,
        workflow: null,
        containerId: null,
        didUpdate: true,
        model: 'workflow'
      });
    case SUCCESS_DELETE_WORKFLOW:
      return Object.assign({}, state, {
        workflowLoading: false,
        workflow: null,
        containerId: null,
        didDelete: true,
        model: 'workflow'
      });

    // Shared datasource actions
    case OPEN_DATASOURCE_MODAL:
      return Object.assign({}, state, {
        datasourceModalVisible: true,
        containerId: action.containerId,
        datasources: action.datasources
      });
    case CLOSE_DATASOURCE_MODAL:
      return Object.assign({}, state, {
        datasourceModalVisible: false,
        datasourceError: null,
        datasourceLoading: false,
        containerId: null,
        datasource: null,
        datasources: null,
        uploadingFile: null,
        isExternalFile: false
      });
    case CHANGE_DATASOURCE:
      return Object.assign({}, state, {
        datasource: action.datasource,
        isExternalFile: action.isExternalFile
      });
    case BEGIN_REQUEST_DATASOURCE:
      return Object.assign({}, state, {
        datasourceLoading: true
      });
    case FAILURE_REQUEST_DATASOURCE:
      return Object.assign({}, state, {
        datasourceLoading: false,
        datasourceError: action.error
      });

    // Specific datasource actions
    case SUCCESS_CREATE_DATASOURCE:
      return Object.assign({}, state, {
        datasourceModalVisible: false,
        datasourceLoading: false,
        datasourceError: null,
        datasource: null,
        containerId: null,
        datasources: null,
        didCreate: true,
        isExternalFile: false,
        model: 'datasource'
      });
    case SUCCESS_UPDATE_DATASOURCE:
      return Object.assign({}, state, {
        datasourceModalVisible: false,
        datasourceLoading: false,
        datasourceError: null,
        datasource: null,
        containerId: null,
        datasources: null,
        didUpdate: true,
        isExternalFile: false,
        model: 'datasource'
      });
    case SUCCESS_DELETE_DATASOURCE:
      return Object.assign({}, state, {
        datasourceModalVisible: false,
        datasourceLoading: false,
        datasource: null,
        containerId: null,
        datasources: null,
        didDelete: true,
        isExternalFile: false,
        model: 'datasource'
      });

    case UPLOAD_EXTERNAL_FILE:
      return Object.assign({}, state, {
        isExternalFile: action.isExternalFile
      });

    //for interacting with datasource form uploaidng file list
    case ADD_UPLOADING_FILE:
      return Object.assign({}, state, {
        uploadingFile: action.file
      });

    case REMOVE_UPLOADING_FILE:
      return Object.assign({}, state, {
        uploadingFile: null,
        isExternalFile: false
      });

    // Shared view actions
    case OPEN_VIEW_MODAL:
      return Object.assign({}, state, {
        viewModalVisible: true,
        containerId: action.containerId,
        datasources: action.datasources,
        views: action.views
      });
    case CLOSE_VIEW_MODAL:
      return Object.assign({}, state, {
        viewModalVisible: false,
        viewError: null,
        viewLoading: false,
        containerId: null,
        datasources: null,
        views: null,
        view: null
      });
    case UPDATE_VIEW_FORM_STATE:
      return Object.assign({}, state, {
        viewFormState: _.merge(state.viewFormState, action.payload)
      });

    default:
      return state;
  }
};

export default containers;
