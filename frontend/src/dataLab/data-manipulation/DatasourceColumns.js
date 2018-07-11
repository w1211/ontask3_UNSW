import React from "react";
import { Icon, Menu, Dropdown, Popover } from "antd";

const handleHeaderClick = (e, visualise, openVisualisation) => {
  switch (e.key) {
    case "visualise":
      openVisualisation(visualise);
      break;

    default:
      break;
  }
};

const HeaderDropdown = ({ visualise, label, openVisualisation }) => (
  <Dropdown
    trigger={["click"]}
    overlay={
      <Menu onClick={e => handleHeaderClick(e, visualise, openVisualisation)}>
        <Menu.Item key="visualise">
          <Icon type="area-chart" style={{ marginRight: 5 }} />Visualise
        </Menu.Item>
      </Menu>
    }
  >
    <a className="column-header datasource">{label}</a>
  </Dropdown>
);

const DatasourceColumns = ({ step, stepIndex, sort, openVisualisation }) => {
  const columns = [];

  step.fields.forEach(field => {
    const label = step.labels[field];
    const isPrimaryOrMatching = [step.matching, step.primary].includes(field);

    const visualise = { stepIndex, field };

    const truncatedLabel =
      label.length > 15 ? (
        <Popover mouseEnterDelay={0} content={label}>{`${label.slice(
          0,
          15
        )}...`}</Popover>
      ) : (
        label
      );

    const title = isPrimaryOrMatching ? (
      truncatedLabel
    ) : (
      <HeaderDropdown
        label={truncatedLabel}
        visualise={visualise}
        openVisualisation={openVisualisation}
      />
    );

    columns.push({
      stepIndex,
      field,
      dataIndex: label,
      key: label,
      sorter: (a, b) => {
        a = label in a ? a[label] : "";
        b = label in b ? b[label] : "";
        return a.localeCompare(b);
      },
      sortOrder: sort && sort.field === label && sort.order,
      title,
      render: text => text
    });
  });

  return columns;
};

export default DatasourceColumns;
