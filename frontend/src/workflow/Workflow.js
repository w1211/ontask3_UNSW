import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Layout, Breadcrumb, Icon, Spin, Button, Divider, Menu, Dropdown, Alert } from 'antd';
import { convertToRaw, EditorState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import Draggable from 'react-draggable';

import * as WorkflowActionCreators from './WorkflowActions';

import FilterModal from './modals/FilterModal';
import ConditionGroupModal from './modals/ConditionGroupModal';
import PreviewModal from './modals/PreviewModal';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './Workflow.css';

const { Content } = Layout;


class Workflow extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch);

    this.state = {
      isInside: false
    };
  };

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

  isInsideContent(mouseEvent, editor) {
    const contentEditor = editor.editorContainer.parentElement.parentElement.getBoundingClientRect();
    const isInsideX = mouseEvent.clientX >= contentEditor.x && mouseEvent.clientX <= (contentEditor.x + contentEditor.width);
    const isInsideY = mouseEvent.clientY >= contentEditor.y && mouseEvent.clientY <= (contentEditor.y + contentEditor.height);

    // isInside flag is consumed by:
    //   The conditional css class on the content editor (darkens the border)
    //   Determining whether to add the dragged condition group to the content editor after drag stops
    this.setState({ isInside: (isInsideX && isInsideY) ? true : false })
  }

  stopDrag(conditionGroup) {
    if (!this.state.isInside) return;
    this.setState({ isInside: false });

    const { editorState } = this.props;

    // Concatenate a string that will comprise the template tags to be added to the content editor
    let newText = '';
    conditionGroup.conditions.forEach((condition, i) => {
      if (i === 0) newText += `{% if ${condition.name} %}`
      if (i > 0) newText += `{% elif ${condition.name} %}`
    })
    newText += '{% endif %}'

    // Create a new content state in which the template tags string has been added
    const newContentState = Modifier.replaceText(
      editorState.getCurrentContent(),
      editorState.getSelection(), // Determine the cursor position inside the content editor
      newText, // The characters to add to the content editor at the cursor position
      editorState.getCurrentInlineStyle() // Determine the style around the cursor position, to apply to the new characters
    );

    // Create a new editor state to include the new content state created above
    let newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

    // Get the user's selection in the content editor at the time of dragging
    const previousSelection = editorState.getSelection();
    // Select the newly added template tags
    // Give the selection focus so that the text becomes highlighted
    const updatedSelection = previousSelection.merge({
      focusOffset: newText.length + previousSelection.focusOffset,
      hasFocus: true
    });

    // Apply the new selection to the new editor state
    newEditorState = EditorState.forceSelection(newEditorState, updatedSelection)

    // Update the editor state in redux, so that the component is re-rendered
    this.boundActionCreators.updateEditorState(newEditorState);
  }

  handleContent = (contentFunction) => {
    const { workflow, editorState } = this.props;

    const currentContent = editorState.getCurrentContent();
    if (!currentContent.hasText()) return;

    const payload = {
      html: draftToHtml(convertToRaw(currentContent)),
      plain: currentContent.getPlainText()
    };
    
    contentFunction(workflow.id, payload);
  }

  render() {
    const { isFetching, workflow, editorState, contentLoading, error, previewLoading } = this.props;

    return (
      <Content style={{ padding: '0 50px' }} className="workflow">

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
                        onDrag={ (e) => { this.isInsideContent(e, this.editor); }}
                        onStop={ () => { this.stopDrag(conditionGroup); }}
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

                <Divider dashed />

                <h3>Content</h3>
                <Editor
                  toolbar={{
                    options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'textAlign', 'colorPicker', 'link', 'history', 'list'],
                    inline: { options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'] }
                  }}
                  wrapperClassName="editor-wrapper"
                  editorClassName={{ 'editor': true, 'isInside': this.state.isInside }}
                  editorState={editorState}
                  onEditorStateChange={this.boundActionCreators.updateEditorState}
                  editorRef={(el) => { this.editor = el; }}
                />

                <PreviewModal/>

                <div style={{ marginTop: '10px' }}>
                  <Button loading={previewLoading} style={{ marginRight: '10px' }} size="large" onClick={() => { this.handleContent(this.boundActionCreators.previewContent) }}>Preview</Button>
                  <Button loading={contentLoading} type="primary" size="large" onClick={() => { this.handleContent(this.boundActionCreators.updateContent) }}>Save</Button>
                </div>

                { error && <Alert message={error} type="error" style={{ marginTop: '10px' }}/>}
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
    isFetching, error, workflow, editorState, contentLoading, previewLoading
  } = state.workflow;
  return {
    isFetching, error, workflow, editorState, contentLoading, previewLoading
  };
};

export default connect(mapStateToProps)(Workflow);
