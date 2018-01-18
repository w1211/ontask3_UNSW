import React from 'react';
import { Button, Collapse, Badge, Tooltip, Icon } from 'antd';

const Panel = Collapse.Panel;

const ButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  verticalAlign: 'middle',
  marginRight: '10px',
}

const RulePanelHeader = ({ rule, openRuleModal, onDeleteRule, openConditionGroupModal }) => (
  <div>
  {rule.name}
  <div style={{float: "right", marginRight: "10px", marginTop: "-5px"}}>
    <Tooltip title="Edit rule">
      <Button icon="edit" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); openRuleModal(rule); }}/>
    </Tooltip>
    <Button style={ButtonStyle} onClick={(e) => { e.stopPropagation(); }}><Icon type="filter"/>Filter</Button>
    <Tooltip title="Modify condition groups">
      <Button icon="solution" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); openConditionGroupModal(rule); }}><Badge count={rule.conditionGroups.length} showZero style={{backgroundColor: '#616161'}} /></Button>
    </Tooltip>
    <Tooltip title="Delete rule">
      <Button type="danger" icon="delete" style={ButtonStyle} onClick={(e) => { e.stopPropagation(); onDeleteRule(rule); }}/>
    </Tooltip>
  </div>
</div>
);

const RulesList = ({ rules, activeKey, changeActiveAccordion, openRuleModal, onDeleteRule, openConditionGroupModal }) => (
  <div>
  { rules.length > 0 ?
    <Collapse accordion onChange={changeActiveAccordion} activeKey={activeKey}>
      { rules.map((rule, key) => {
        return (
          <Panel 
            header={
              <RulePanelHeader
                rule={rule}
                openRuleModal = {openRuleModal}
                onDeleteRule = {onDeleteRule}
                openConditionGroupModal = {openConditionGroupModal}
              />}
            key={key}
          >
            {rule.name}
          </Panel>        
        )
      })}
    </Collapse>
      :
      <p style={{margin: 0}}>No rules have been created yet.</p>
    }
</div>
)

export default RulesList;