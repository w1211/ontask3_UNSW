import React from 'react';

import { Button } from 'antd';

import RuleForm from './RuleForm';
import RulesList from './RulesList';
import ConditionGroupsForm from './ConditionGroupsForm';

const Rules = ({ 
  openRuleModal, onCreateRule, onUpdateRule, onCancelRule, onDeleteRule, ruleModalVisible, ruleLoading, ruleError, rules, activeRuleAccordion, changeActiveAccordion, selectedRule,
  openConditionGroupModal, onCancelConditionGroup, conditionGroupModalVisible, selectedConditionGroup, conditionGroupLoading, conditionGroupError, onChangeConditionGroup, onCreateConditionGroup, onUpdateConditionGroup,
  matrix, transitoryConditionGroup, addCondition, addFormula, deleteCondition, deleteFormula,
  conditionGroupForm, updateConditionGroupForm, onDeleteConditionGroup
}) => (
  <div>
    <Button
      onClick={() => { openRuleModal(null) }} 
      type="primary" icon="plus" size="large" style={{marginBottom: '20px'}}
    >
      New rule
    </Button>
    <RuleForm
      onCreate={onCreateRule}
      onUpdate={onUpdateRule}
      onCancel={onCancelRule} 
      visible={ruleModalVisible}
      loading={ruleLoading}
      error={ruleError}
      rule={selectedRule}
      ref={(form) => {this.ruleForm = form}}
    />
    <ConditionGroupsForm
      ref={(form) => {this.conditionGroupsForm = form}}
      visible={conditionGroupModalVisible}
      loading={conditionGroupLoading}
      error={conditionGroupError}
      
      onChange={onChangeConditionGroup}
      onCreate={(payload) => { onCreateConditionGroup(selectedRule.id, payload) }}
      onUpdate={(selected, payload) => { onUpdateConditionGroup(selectedRule.id, selected, payload) }}
      onDelete={(index) => { onDeleteConditionGroup(selectedRule.id, index) }}
      onCancel={onCancelConditionGroup} 

      matrix={matrix}
      selected={selectedConditionGroup}
      groups={selectedRule ? selectedRule.conditionGroups : []}
      transitoryGroup={transitoryConditionGroup}

      addCondition={addCondition}
      addFormula={addFormula}
      deleteCondition={deleteCondition}
      deleteFormula={deleteFormula}

      conditionGroupForm={conditionGroupForm}
      updateConditionGroupForm={updateConditionGroupForm}
    />
    <RulesList
      rules={rules}
      activeKey={activeRuleAccordion}
      changeActiveAccordion={changeActiveAccordion}
      openRuleModal={openRuleModal}
      onDeleteRule={onDeleteRule}
      openConditionGroupModal={openConditionGroupModal}
    />
  </div>
)

export default Rules
