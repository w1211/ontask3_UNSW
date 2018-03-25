import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Layout, Breadcrumb, Icon, Modal, notification, Spin, Button, Divider, Alert } from 'antd';

import * as WorkflowActionCreators from './WorkflowActions';

import FilterModal from './modals/FilterModal';

const confirm = Modal.confirm;
const { Content } = Layout;


class Workflow extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch);
  }

  componentDidMount() {
    const { match } = this.props;
    this.boundActionCreators.fetchWorkflow(match.params.id);
  };


  render() {
    const { dispatch, isFetching, workflow, loading, error } = this.props;

    return (
      <Content style={{ padding: '0 50px' }}>

        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item><Link to="/">Dashboard</Link></Breadcrumb.Item>
          <Breadcrumb.Item><Link to="/containers">Containers</Link></Breadcrumb.Item>
          <Breadcrumb.Item>Workflow</Breadcrumb.Item>
        </Breadcrumb>

        <Layout style={{ padding: '24px 0', background: '#fff' }}>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
 
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1em' }}>
              <h1 style={{ display: 'inline-block', margin: 0 }}>{workflow && workflow.name}</h1>
              <Link to="/containers" style={{ width: 'fit-content' }}>
                <Icon type="arrow-left" />
                <span >Back to containers</span>
              </Link>
            </div>
            { isFetching ?
              <Spin size="large" />
            :
              <div>
                <h3>
                  Filter
                  <Button 
                    style={{ marginLeft: '10px' }} shape="circle" icon="edit"
                    onClick={() => { this.boundActionCreators.openFilterModal(workflow.filter); }} 
                  />
                </h3>
                { workflow && workflow.filtered_count ?
                  `${workflow.view.data.length - workflow.filtered_count} records selected out of ${workflow.view.data.length} (${workflow.filtered_count} filtered)`
                :
                  'No filter is currently being applied' 
                }
                <FilterModal/>

                <Divider dashed />

                {/* <FilterModal
                  visible={filterModalVisible}
                  loading={filterLoading}
                  error={filterError}
                  details={details}
                  formState={filterFormState}

                  onUpdate={(payload) => { this.boundActionCreators.updateFilter(match.params.id, payload) }}
                  onCancel={() => { dispatch(this.boundActionCreators.closeFilterModal()) }}

                  addFormula={this.boundActionCreators.addFormulaToFilter}
                  deleteFormula={this.boundActionCreators.deleteFormulaFromFilter}
                  updateFormState={this.boundActionCreators.updateFilterFormState}
                />
                <ConditionGroupModal
                  visible={conditionGroupModalVisible}
                  loading={conditionGroupLoading}
                  error={conditionGroupError}
                  details={details}
                  conditionGroup={conditionGroup}
                  formState={conditionGroupFormState}

                  onCreate={(payload) => { this.boundActionCreators.createConditionGroup(match.params.id, payload) }}
                  onUpdate={(conditionGroup, payload) => { this.boundActionCreators.updateConditionGroup(match.params.id, conditionGroup, payload) }}
                  onCancel={() => { dispatch(this.boundActionCreators.closeConditionGroupModal()) }}

                  addCondition={this.boundActionCreators.addConditionToConditionGroup}
                  deleteCondition={this.boundActionCreators.deleteConditionFromConditionGroup}
                  addFormula={this.boundActionCreators.addFormulaToConditionGroup}
                  deleteFormula={this.boundActionCreators.deleteFormulaFromConditionGroup}
                  updateFormState={this.boundActionCreators.updateConditionGroupFormState}
                />
                <Compose
                  contentLoading={actionContentLoading}
                  error={actionContentError}
                  conditionGroups={conditionGroups}
                  editorState={actionEditorState}
                  details={details}
                  filter={filter}

                  openFilterModal={() => { dispatch(this.boundActionCreators.openFilterModal(filter)) }}
                  confirmFilterDelete={this.confirmFilterDelete}

                  openConditionGroupModal={(conditionGroup) => { dispatch(this.boundActionCreators.openConditionGroupModal(conditionGroup)) }}
                  confirmConditionGroupDelete={(conditionGroupIndex) => { this.confirmConditionGroupDelete(match.params.id, conditionGroupIndex) }}

                  updateEditorState={(payload) => { dispatch(this.boundActionCreators.updateEditorState(payload)) }}
                  onUpdateContent={(payload) => { this.boundActionCreators.updateContent(match.params.id, payload) }}

                  previewLoading={previewContentLoading}
                  previewVisible={previewContentModalVisible}
                  previewContent={previewContent}
                  onPreviewContent={(payload) => { this.boundActionCreators.previewContent(match.params.id, payload) }}
                  onClosePreview={() => { dispatch(this.boundActionCreators.closePreviewContent()) }}
                /> */}

              </div>
            }

          </Content>
      </Layout>
    </Content>
    );
  };
};

const mapStateToProps = (state) => {
  const {
    isFetching, loading, error, workflow
  } = state.workflow;
  return {
    isFetching, loading, error, workflow
  };
}

export default connect(mapStateToProps)(Workflow)
