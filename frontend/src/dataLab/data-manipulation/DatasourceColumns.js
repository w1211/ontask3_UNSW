import React from 'react';
import { Icon, Menu, Dropdown, Popover } from 'antd';


const handleHeaderClick = (e, visualise, openVisualisation) => {
  switch (e.key)  {
    case 'visualise':
      openVisualisation(visualise);
      break;
  
    default:
      break;
  };
};

const HeaderDropdown = ({ visualise, label, openVisualisation }) => (
  <Dropdown trigger={["click"]} overlay={
    <Menu onClick={(e) => handleHeaderClick(e, visualise, openVisualisation)}>
      <Menu.Item key="visualise">
        <Icon type="area-chart" style={{ marginRight: 5 }}/>Visualise
      </Menu.Item>
    </Menu>
  }>
    <a className="column-header datasource">{label}</a>
  </Dropdown>
);

const datasourceColumns = (step, stepIndex, sort, openVisualisation) => {
  const currentStep = step && step.datasource;
  const columns = [];

  currentStep && currentStep.fields.forEach(field => {
    const label = currentStep.labels[field];
    const isPrimaryOrMatching = currentStep.matching === field || currentStep.primary === field;

    const visualise = { stepIndex, field };

    const truncatedLabel = label.length > 15 ? <Popover mouseEnterDelay={0} content={label}>{`${label.slice(0, 15)}...`}</Popover> : label;

    const title = isPrimaryOrMatching ? truncatedLabel : <HeaderDropdown visualise={visualise} label={truncatedLabel} openVisualisation={openVisualisation}/>;

    columns.push({
      stepIndex,
      field,
      title,
      dataIndex: label,
      key: label,
      sorter: (a, b) => {
        a = label in a ? a[label] : '';
        b = label in b ? b[label] : '';
        return a.localeCompare(b);
      },
      sortOrder: sort && sort.field === label && sort.order,
      render: (text) => text
    });

  });

  return columns;
};

export default datasourceColumns;
