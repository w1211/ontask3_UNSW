import React from 'react';
import { Divider, Button, Dropdown, Menu, Alert, Modal, Icon } from 'antd';
import { convertToRaw, EditorState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import Draggable from 'react-draggable';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './Action.css';


const handleConditionGroupMenuClick = (e, openConditionGroupModal, confirmConditionGroupDelete, conditionGroup, i) => {
  switch (e.key) {
    case 'edit':
      openConditionGroupModal(conditionGroup)
      break;
    case 'delete':
      confirmConditionGroupDelete(i)
      break;
    default:
      break;
  }
}

const handleContent = (editorState, contentFunction) => {
  const payload = draftToHtml(convertToRaw(editorState.getCurrentContent()));
  contentFunction(payload);
}


class Action extends React.Component {
  state = { isInside: false };

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

    const { editorState, updateEditorState } = this.props;

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
    updateEditorState(newEditorState);
  }

  render() {
    const { 
      contentLoading, error, conditionGroups, editorState, onUpdateContent,
      previewLoading, previewVisible, previewContent, onPreviewContent, onClosePreview,
      openConditionGroupModal, confirmConditionGroupDelete, updateEditorState
    } = this.props;
  
    return (
      <div className="action">
        <h3>
          Filter
          <Button style={{ marginLeft: '10px' }} shape="circle" icon="plus" />
        </h3>
        No filters have been added yet.
  
        <Divider dashed />
        <h3>
          Condition groups
          <Button onClick={() => { openConditionGroupModal() }} style={{ marginLeft: '10px' }} shape="circle" icon="plus" />
        </h3>
        { conditionGroups && conditionGroups.length > 0 ?
          conditionGroups.map((conditionGroup, i) => {
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
                    <Menu onClick={(e) => { handleConditionGroupMenuClick(e, openConditionGroupModal, confirmConditionGroupDelete, conditionGroup, i) }}>
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
          onEditorStateChange={updateEditorState}
          editorRef={(el) => { this.editor = el; }}
        />
  
        <PreviewModal 
          content={previewContent} 
          visible={previewVisible} 
          onCancel={onClosePreview}
        />
  
        { error && <Alert message={error} type="error" style={{ marginTop: '10px' }}/>}
        <div style={{ marginTop: '10px' }}>
          <Button loading={previewLoading} style={{ marginRight: '10px' }} size="large" onClick={() => { handleContent(editorState, onPreviewContent) }}>Preview</Button>
          <Button loading={contentLoading} type="primary" size="large" onClick={() => { handleContent(editorState, onUpdateContent) }}>Save</Button>
        </div>
      </div>
    )

  };
};


class PreviewModal extends React.Component {
  state = { index: 0 };
  
  render() {
    const { 
      content, visible, onCancel
    } = this.props;
    
    return (
      <Modal
        visible={visible}
        title={`Preview content: ${this.state.index + 1}`}
        onCancel={onCancel}
        footer={null}
      >
        {content &&
          <div style={{ display: 'flex', flexDirection: 'column'}}>
            <Button.Group size="large" style={{ marginBottom: '10px', textAlign: 'center' }}>
              <Button type="primary" disabled={this.state.index === 0}
                onClick={() => { 
                  this.setState(prevState => {
                    return { index: prevState.index - 1 }
                  }) 
                }}
              >
                <Icon type="left" />Previous
              </Button>
              <Button type="primary" disabled={this.state.index === content.length - 1} 
                onClick={() => { 
                  this.setState(prevState => {
                    return { index: prevState.index + 1 }
                  }) 
                }}
              >
                Next<Icon type="right" />
              </Button>
            </Button.Group>

            <div style={{ padding: '10px', border: '1px solid #F1F1F1' }}
              dangerouslySetInnerHTML={{__html: content[this.state.index]}} 
            />

          </div>
        }
      </Modal>
    );
  };
};

export default Action;
