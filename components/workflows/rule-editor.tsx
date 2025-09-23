/**
 * Rule Editor Component
 * Extracted from rule-configuration-panel.tsx for better modularity
 */

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Save, X } from 'lucide-react'
import type { 
  BusinessRule, 
  RuleCondition, 
  RuleAction, 
  ComparisonOperator, 
  LogicalOperator,
  DataType,
  ActionType 
} from '@/lib/types'

interface RuleEditorProps {
  rule: BusinessRule | null
  onSave: (rule: BusinessRule) => void
  onCancel: () => void
  availableFields: string[]
  isNew?: boolean
}

export function RuleEditor({ 
  rule, 
  onSave, 
  onCancel, 
  availableFields, 
  isNew = false 
}: RuleEditorProps) {
  const [editingRule, setEditingRule] = useState<BusinessRule>(
    rule || {
      id: `rule_${Date.now()}`,
      name: '',
      description: '',
      condition: {
        field: '',
        operator: 'equals',
        value: '',
        dataType: 'string'
      },
      action: {
        type: 'set_value',
        parameters: {}
      },
      priority: 1,
      enabled: true,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        author: 'system'
      }
    }
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateRule = useCallback((ruleToValidate: BusinessRule): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (!ruleToValidate.name.trim()) {
      newErrors.name = 'Rule name is required'
    }

    if (!ruleToValidate.condition.field) {
      newErrors.field = 'Field is required'
    }

    if (ruleToValidate.condition.value === '' || ruleToValidate.condition.value === null) {
      newErrors.value = 'Value is required'
    }

    if (!ruleToValidate.action.type) {
      newErrors.actionType = 'Action type is required'
    }

    return newErrors
  }, [])

  const handleSave = useCallback(() => {
    const validationErrors = validateRule(editingRule)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length === 0) {
      const now = new Date()
      const updatedRule = {
        ...editingRule,
        metadata: {
          createdAt: editingRule.metadata?.createdAt || now,
          updatedAt: now,
          version: editingRule.metadata?.version || '1.0.0',
          author: editingRule.metadata?.author || 'System',
          ...editingRule.metadata
        }
      }
      onSave(updatedRule)
    }
  }, [editingRule, validateRule, onSave])

  const updateCondition = useCallback((updates: Partial<RuleCondition>) => {
    setEditingRule(prev => ({
      ...prev,
      condition: { ...prev.condition, ...updates }
    }))
  }, [])

  const updateAction = useCallback((updates: Partial<RuleAction>) => {
    setEditingRule(prev => ({
      ...prev,
      action: { ...prev.action, ...updates }
    }))
  }, [])

  const comparisonOperators: ComparisonOperator[] = [
    'equals', 'not_equals', 'greater_than', 'greater_than_or_equal',
    'less_than', 'less_than_or_equal', 'contains', 'not_contains',
    'starts_with', 'ends_with', 'in', 'not_in', 'is_null', 'is_not_null'
  ]

  const dataTypes: DataType[] = ['string', 'number', 'boolean', 'date', 'array', 'object']

  const actionTypes = [
    'set_value', 'calculate', 'validate', 'transform', 'route', 'notify', 'log'
  ]

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isNew ? 'Create New Rule' : 'Edit Rule'}</span>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name *</Label>
            <Input
              id="rule-name"
              value={editingRule.name}
              onChange={(e) => setEditingRule(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-priority">Priority</Label>
            <Input
              id="rule-priority"
              type="number"
              value={editingRule.priority}
              onChange={(e) => setEditingRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
              min="1"
              max="100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rule-description">Description</Label>
          <Textarea
            id="rule-description"
            value={editingRule.description}
            onChange={(e) => setEditingRule(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this rule does"
            rows={3}
          />
        </div>

        {/* Condition Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Condition</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Field *</Label>
              <Select
                value={editingRule.condition.field}
                onValueChange={(value) => updateCondition({ field: value })}
              >
                <SelectTrigger className={errors.field ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.field && <p className="text-sm text-red-500">{errors.field}</p>}
            </div>

            <div className="space-y-2">
              <Label>Operator</Label>
              <Select
                value={editingRule.condition.operator}
                onValueChange={(value) => updateCondition({ operator: value as ComparisonOperator })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {comparisonOperators.map(op => (
                    <SelectItem key={op} value={op}>
                      {op.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select
                value={editingRule.condition.dataType}
                onValueChange={(value) => updateCondition({ dataType: value as DataType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Value *</Label>
              <Input
                value={editingRule.condition.value}
                onChange={(e) => updateCondition({ value: e.target.value })}
                placeholder="Enter value"
                className={errors.value ? 'border-red-500' : ''}
              />
              {errors.value && <p className="text-sm text-red-500">{errors.value}</p>}
            </div>
          </div>
        </div>

        {/* Action Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Action</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Action Type *</Label>
              <Select
                value={editingRule.action.type}
                onValueChange={(value) => updateAction({ type: value as ActionType })}
              >
                <SelectTrigger className={errors.actionType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.actionType && <p className="text-sm text-red-500">{errors.actionType}</p>}
            </div>

            <div className="space-y-2">
              <Label>Output Field</Label>
              <Input
                value={editingRule.action.outputField || ''}
                onChange={(e) => updateAction({ outputField: e.target.value })}
                placeholder="Field to store result"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Parameters (JSON)</Label>
            <Textarea
              value={JSON.stringify(editingRule.action.parameters, null, 2)}
              onChange={(e) => {
                try {
                  const params = JSON.parse(e.target.value)
                  updateAction({ parameters: params })
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='{"key": "value"}'
              rows={4}
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Rule Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="rule-enabled">Enabled</Label>
            <input
              id="rule-enabled"
              type="checkbox"
              checked={editingRule.enabled}
              onChange={(e) => setEditingRule(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded"
            />
          </div>

          <Badge variant={editingRule.enabled ? "default" : "secondary"}>
            {editingRule.enabled ? "Active" : "Disabled"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}