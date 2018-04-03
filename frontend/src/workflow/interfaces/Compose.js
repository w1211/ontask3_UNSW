import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button, Divider, Menu, Dropdown, Alert } from 'antd';
import { convertToRaw, EditorState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import Draggable from 'react-draggable';

import * as WorkflowActionCreators from '../WorkflowActions';

import FilterModal from '../modals/FilterModal';
import ConditionGroupModal from '../modals/ConditionGroupModal';
import PreviewModal from '../modals/PreviewModal';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';


class Compose extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(WorkflowActionCreators, dispatch);

    this.state = {
      isInside: false
    };
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

  handleContent = (action) => {
    const { workflow, editorState } = this.props;

    const currentContent = editorState.getCurrentContent();
    if (!currentContent.hasText()) return;

    const payload = {
      html: draftToHtml(convertToRaw(currentContent)),
      plain: currentContent.getPlainText()
    };
    
    if (action === 'preview') {
      this.boundActionCreators.previewContent(workflow.id, payload, true);
    } else if (action === 'submit') {
      this.boundActionCreators.updateContent(workflow.id, payload);
    };

  };

  render() {
    const { workflow, editorState, contentLoading, error, previewLoading } = this.props;

    return (
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
          <Button loading={previewLoading} style={{ marginRight: '10px' }} size="large" onClick={() => { this.handleContent('preview') }}>Preview</Button>
          <Button loading={contentLoading} type="primary" size="large" onClick={() => { this.handleContent('submit') }}>Save</Button>
        </div>

        { error && <Alert message={error} type="error" style={{ marginTop: '10px' }}/>}
      </div>
    );
  };
};

const mapStateToProps = (state) => {
  const {
    error, workflow, editorState, contentLoading, previewLoading
  } = state.workflow;
  return {
    error, workflow, editorState, contentLoading, previewLoading
  };
};

export default connect(mapStateToProps)(Compose);
