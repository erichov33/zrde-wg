/**
 * Rule Type Converter Utility
 * Handles conversion between legacy Rule types and new BusinessRule types
 */

import type { BusinessRule, RuleCondition, RuleAction, ActionType, ComparisonOperator, LogicalOperator } from '@/lib/types'
import type { Rule, Condition, Operator } from '@/lib/engines/rule-engine'

/**
 * Map legacy action types to new ActionType values
 */
function mapLegacyActionType(legacyType: string): ActionType {
  const actionTypeMap: Record<string, ActionType> = {
    'approve': 'set_value',
    'decline': 'set_value', 
    'review': 'send_notification',
    'set_score': 'calculate',
    'add_flag': 'set_value',
    'require_document': 'send_notification'
  }
  
  return actionTypeMap[legacyType] || 'set_value'
}

/**
 * Map ComparisonOperator to rule engine Operator types
 */
function mapComparisonOperator(operator: ComparisonOperator): Operator {
  switch (operator) {
    case 'regex_match':
      // Rule engine doesn't support regex_match, fallback to contains
      return 'contains'
    default:
      // All other operators are compatible
      return operator as Operator
  }
}

/**
 * Map LogicalOperator to rule engine compatible values
 */
function mapLogicalOperator(operator?: LogicalOperator): 'AND' | 'OR' {
  switch (operator) {
    case 'NOT':
      // Rule engine doesn't support NOT, fallback to OR
      return 'OR'
    case 'OR':
      return 'OR'
    case 'AND':
    default:
      return 'AND'
  }
}

/**
 * Maps workflow ActionType to rule engine action types
 */
function mapActionType(actionType: ActionType): "approve" | "decline" | "review" | "set_score" | "add_flag" | "require_document" {
  switch (actionType) {
    case 'set_value':
      return 'set_score'
    case 'calculate':
      return 'set_score'
    case 'validate':
      return 'review'
    case 'transform':
      return 'review'
    case 'call_service':
      return 'require_document'
    case 'send_notification':
      return 'add_flag'
    case 'log_event':
      return 'add_flag'
    case 'stop_execution':
      return 'decline'
    default:
      // Fallback to review for unknown action types
      return 'review'
  }
}

/**
 * Convert legacy Rule to BusinessRule
 */
export function convertRuleToBusinessRule(rule: Rule): BusinessRule {
  // Convert first condition to new format
  const primaryCondition = rule.conditions?.[0]
  const condition: RuleCondition = primaryCondition ? {
    field: primaryCondition.field,
    operator: mapOperator(primaryCondition.operator),
    value: primaryCondition.value,
    dataType: mapDataType(primaryCondition.dataType),
    logicalOperator: rule.logicalOperator === 'AND' ? 'AND' : 'OR'
  } : {
    field: '',
    operator: 'equals',
    value: '',
    dataType: 'string'
  }

  // Convert first action to new format
  const primaryAction = rule.actions?.[0]
  const action: RuleAction = primaryAction ? {
    type: mapLegacyActionType(primaryAction.type),
    parameters: primaryAction.value ? { value: primaryAction.value } : {},
    outputField: primaryAction.message ? 'message' : undefined
  } : {
    type: 'set_value',
    parameters: {}
  }

  return {
    id: rule.id,
    name: rule.name,
    description: rule.description || '',
    condition,
    action,
    priority: rule.priority || 1,
    enabled: rule.enabled ?? true,
    metadata: {
      createdAt: new Date(rule.metadata?.createdAt || Date.now()),
      updatedAt: new Date(rule.metadata?.updatedAt || Date.now()),
      version: rule.metadata?.version || '1.0.0',
      author: rule.metadata?.createdBy || 'system'
    }
  }
}

/**
 * Convert BusinessRule to legacy Rule
 */
export function convertBusinessRuleToRule(businessRule: BusinessRule): Rule {
  const condition: Condition = {
    id: `${businessRule.id}-condition-${Date.now()}`,
    field: businessRule.condition.field,
    operator: mapComparisonOperator(businessRule.condition.operator),
    value: businessRule.condition.value,
    dataType: businessRule.condition.dataType
  }

  return {
    id: businessRule.id,
    name: businessRule.name,
    description: businessRule.description,
    priority: businessRule.priority,
    enabled: businessRule.enabled,
    conditions: [condition],
    logicalOperator: mapLogicalOperator(businessRule.condition.logicalOperator),
    actions: [{
      type: mapActionType(businessRule.action.type),
      value: businessRule.action.parameters,
      message: businessRule.action.outputField
    }],
    metadata: {
      createdAt: businessRule.metadata?.createdAt.toISOString() || new Date().toISOString(),
      updatedAt: businessRule.metadata?.updatedAt.toISOString() || new Date().toISOString(),
      createdBy: businessRule.metadata?.author || 'system',
      version: businessRule.metadata?.version || '1.0.0'
    }
  }
}

/**
 * Map legacy operators to new operators
 */
function mapOperator(operator: string): any {
  const operatorMap: Record<string, string> = {
    'eq': 'equals',
    'ne': 'not_equals',
    'gt': 'greater_than',
    'gte': 'greater_than_or_equal',
    'lt': 'less_than',
    'lte': 'less_than_or_equal',
    'contains': 'contains',
    'not_contains': 'not_contains',
    'starts_with': 'starts_with',
    'ends_with': 'ends_with',
    'in': 'in',
    'not_in': 'not_in',
    'is_null': 'is_null',
    'is_not_null': 'is_not_null'
  }
  
  return operatorMap[operator] || operator
}

/**
 * Map legacy data types to new data types
 */
function mapDataType(dataType: string): any {
  const typeMap: Record<string, string> = {
    'text': 'string',
    'numeric': 'number',
    'bool': 'boolean',
    'datetime': 'date',
    'list': 'array',
    'object': 'object'
  }
  
  return typeMap[dataType] || dataType
}

/**
 * Batch convert multiple rules
 */
export function convertRulesToBusinessRules(rules: Rule[]): BusinessRule[] {
  return rules.map(convertRuleToBusinessRule)
}

/**
 * Batch convert multiple business rules
 */
export function convertBusinessRulesToRules(businessRules: BusinessRule[]): Rule[] {
  return businessRules.map(convertBusinessRuleToRule)
}