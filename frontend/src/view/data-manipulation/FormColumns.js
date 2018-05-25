import React from 'react';
import { Icon, Menu, Dropdown, message, Tooltip, Modal } from 'antd';
import moment from 'moment';

import EditableField from './EditableField';

const confirm = Modal.confirm;


const handleHeaderClick = (e, visualise, onEdit, openVisualisation) => {
  switch (e.key)  {
    case 'visualise':
      console.log(visualise);
      openVisualisation(visualise);
      break;
  
    case 'edit':
      onEdit({ ...visualise,  target: '_all' });
      break;

    default:
      break;
  };
};

const HeaderDropdown = ({ visualise, label, onEdit, openVisualisation }) => (
  <Dropdown trigger={["click"]} overlay={
    <Menu onClick={(e) => handleHeaderClick(e, visualise, onEdit, openVisualisation)}>
      <Menu.Item key="edit">
        <Icon type="edit" style={{ marginRight: 5 }}/>Enter data
      </Menu.Item>
      
      <Menu.Item key="visualise" disabled>
        <Icon type="area-chart" style={{ marginRight: 5 }}/>Visualise
      </Menu.Item>
    </Menu>
  }>
    <a className="column-header form">{label}</a>
  </Dropdown>
);

const Title = ({ visualise, label, editable, onEdit, confirmEdit, openVisualisation }) => (
  <div style={{ display: 'inline-block' }}>
    <HeaderDropdown visualise={visualise} label={label} onEdit={onEdit} openVisualisation={openVisualisation}/>

    { editable.target === '_all' &&
      <div className="column-header-icons" style={{ display: 'inline-block' }}>
        <Tooltip title="Discard changes">
          <Icon type="close" onClick={() => {
            if ('values' in editable) {
              confirm({
                title: 'Discard changes',
                content: 'Are you sure you want to discard changes made to the form?',
                okText: 'Yes, discard',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk() {
                  onEdit({});
                }
              });
            } else {
              onEdit({});
            };
          }}/>
        </Tooltip>
        <Tooltip title="Save data">
          <Icon type="save" onClick={confirmEdit}/>
        </Tooltip>
      </div>
    }
  </div>
);

const renderFormField = (stepIndex, primary, field, text, record, editable, onEdit, confirmEdit) => {
  let label;

  if (field.type === 'number' && field.numberDisplay === 'range' && text instanceof Array) {
    label = text[0] ? text[0] : 0;
    if (text[1]) label += ` - ${text[1]}`;
  } 

  if (field.textDisplay === 'list' || field.numberDisplay === 'list') {
    if (text instanceof Array) {
      if (field.name in record) record[field.name].forEach((value, i) => {
        const option = field.options.find(option => option.value === value);
        if (option) {
          if (i === 0) label = option.label;
          if (i > 0) label += `, ${option.label}`
        };
      });
    } else {
      const option = field.options.find(option => option.value === text);
      if (option) label = option.label;
    };
  } 

  else if (field.type === 'date') {
    if (text) text = moment(text).format('YYYY-MM-DD');
  }

  else if (field.type === 'checkbox') {
    text = text ? 'True' : 'False';
  };

  const isEditable = [record[primary], '_all'].includes(editable.target) && 'field' in editable && editable.field === field.name;

  if (isEditable) {
    return (
      <div className="editable-field">
        <EditableField 
          field={field} 
          value={text} 
          onChange={(e) => onEdit({ ...editable, values: { ...editable.values, [record[primary]]: e } })}
          onOk={confirmEdit}
          isColumnEdit={editable.target === '_all'}
        />
        { editable.target !== '_all' &&
          <div style={{ display: 'flex' }}>
            <Icon type="close" onClick={() => onEdit({})}/>
            <Icon type="save" onClick={confirmEdit}/>
          </div>
        }
      </div>
    );
  } else {
    return (
      <div className="form-field">
        {label ? label : text}
        <Icon 
          size="large" type="edit" 
          onClick={(e) => {
            if (record[primary]) {
              onEdit({ stepIndex, field: field.name, target: record[primary] });
            } else {
              message.warning(`This form field cannot be edited as the matching field (${primary}) for this record is empty.`);
            };
          }}
        />
      </div>
    );
  }
};

const formColumns = (step, stepIndex, sort, editable, onEdit, confirmEdit, openVisualisation) => {
  const currentStep = step && step.form;
  const columns = [];

  currentStep && currentStep.fields.forEach(field => {
    const label = field.name;
    const isPrimary = currentStep.primary === field;

    const visualise = { stepIndex, field: label };

    const title = isPrimary ? label : <Title visualise={visualise} label={label} editable={editable} onEdit={onEdit} confirmEdit={confirmEdit} openVisualisation={openVisualisation}/>;

    columns.push({
      title,
      dataIndex: label,
      key: label,
      sorter: (a, b) => {
        a = label in a ? a[label] : '';
        b = label in b ? b[label] : '';
        return a.localeCompare(b);
      },
      sortOrder: sort && sort.field === label && sort.order,
      render: (text, record) => renderFormField(stepIndex, currentStep.primary, field, text, record, editable, onEdit, confirmEdit)
    });

  });

  return columns;
};

export default formColumns;
