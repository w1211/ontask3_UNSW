import React from 'react';
import { Divider, Button, Dropdown, Menu, Alert, Modal, Icon } from 'antd';
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

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

const Action = ({
  contentLoading, error, conditionGroups, editorState, content, onUpdateContent,
  previewLoading, previewVisible, previewContent, onPreviewContent, onClosePreview,
  openConditionGroupModal, confirmConditionGroupDelete, updateEditorState
}) => { 

  if (content && !editorState) {
    const blocksFromHtml = htmlToDraft(content);
    const { contentBlocks, entityMap } = blocksFromHtml;
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
    editorState = EditorState.createWithContent(contentState);
  }

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
            <Dropdown.Button 
              overlay={
                <Menu onClick={(e) => { handleConditionGroupMenuClick(e, openConditionGroupModal, confirmConditionGroupDelete, conditionGroup, i) }}>
                  <Menu.Item key="edit">Edit</Menu.Item>
                  <Menu.Item key="delete">Delete</Menu.Item>
                </Menu>
              } 
              key={i} type="primary" trigger={['click']}
              style={{ marginRight: '5px' }}
            >
              {conditionGroup.name}
            </Dropdown.Button>
          )
        })
      :
        'No condition groups have been added yet.'
      }
      
      <Divider dashed />

      <h3>Content</h3>
      <Editor
        toolbar={{
          options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'textAlign', 'colorPicker', 'link', 'emoji', 'history', 'list'],
          inline: { options: ['bold', 'italic', 'underline', 'strikethrough', 'monospace'] }
        }}
        wrapperClassName="editor-wrapper"
        editorClassName="editor"
        editorState={editorState}
        onEditorStateChange={updateEditorState}
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
}

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
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
            <Button.Group size="large" style={{ marginBottom: '10px' }}>
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
