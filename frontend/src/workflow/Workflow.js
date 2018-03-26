import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Layout, Breadcrumb, Icon, Spin, Button, Divider, Menu, Dropdown } from 'antd';
import Draggable from 'react-draggable';

import * as WorkflowActionCreators from './WorkflowActions';

import FilterModal from './modals/FilterModal';
import ConditionGroupModal from './modals/ConditionGroupModal';

import './Workflow.css';

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

  handleConditionGroupMenuClick = (e, conditionGroup, index) => {
    const { workflow } = this.props;

    switch (e.key) {
      case 'edit':
        this.boundActionCreators.openConditionGroupModal(conditionGroup);
        break;
      case 'delete':
        this.boundActionCreators.deleteConditionGroup(workflow.id, index);
        break;
      default:
        break;
    };
  };

  render() {
    const { isFetching, workflow } = this.props;

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
                { workflow && workflow.filter && workflow.filter.formulas.length > 0 ?
                  `${workflow.filtered_count} records selected out of ${workflow.view.data.length} (${workflow.view.data.length - workflow.filtered_count} filtered out)`
                :
                  'No filter is currently being applied' 
                }
                <FilterModal/>

                <Divider dashed />

                <h3>
                  Condition groups
                  <Button 
                    style={{ marginLeft: '10px' }} shape="circle" icon="plus"
                    onClick={() => { this.boundActionCreators.openConditionGroupModal(); }} 
                    />
                </h3>
                <ConditionGroupModal/>
                { workflow && workflow.conditionGroups && workflow.conditionGroups.length > 0 ?
                  workflow.conditionGroups.map((conditionGroup, i) => {
                    return (
                      <Draggable
                        key={i}
                        position={{ x: 0, y: 0 }}
                        // onDrag={ (e) => { this.isInsideContent(e, this.editor); }}
                        // onStop={ () => { this.stopDrag(conditionGroup); }}
                        onMouseDown={ (e) => { e.preventDefault(); }} // Keeps the content editor in focus when user starts to drag a condition group
                      >
                        <Dropdown.Button
                          overlay={
                            <Menu onClick={(e) => this.handleConditionGroupMenuClick(e, conditionGroup, i)}>
                              <Menu.Item key="edit">Edit</Menu.Item>
                              <Menu.Item key="delete">Delete</Menu.Item>
                            </Menu>
                          }
                          className="conditionGroupBtn"
                          key={i} type="primary" trigger={['click']}
                          style={{ marginRight: '5px', zIndex: 10 }}
                        >
                          {conditionGroup.name}
                        </Dropdown.Button>
                      </Draggable>
                    )
                  })
                :
                  'No condition groups have been added yet.'
                }
                {/*

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
