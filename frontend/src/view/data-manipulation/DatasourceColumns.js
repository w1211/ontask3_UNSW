import React from 'react';
import { Icon, Menu, Dropdown } from 'antd';


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

    const title = isPrimaryOrMatching ? label : <HeaderDropdown visualise={visualise} label={label} openVisualisation={openVisualisation}/>;

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
      render: (text) => text
    });

  });

  return columns;
};

export default datasourceColumns;
