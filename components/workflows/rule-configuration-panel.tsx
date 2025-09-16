"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Plus, Trash2, Copy, Edit, Play, Save } from "lucide-react"
import { Rule, Condition, Operator, DataType, RuleTemplates } from "@/lib/engines/rule-engine"
import { WorkflowDefinition } from "@/lib/services/enhanced-decision-service"
import { EnhancedWorkflowNode } from "./enhanced-workflow-builder"

interface RuleConfigurationPanelProps {
  nodes: EnhancedWorkflowNode[]
  onNodeUpdate: (nodeId: string, updates: Partial<EnhancedWorkflowNode>) => void
  workflow: Partial<WorkflowDefinition>
  onWorkflowUpdate: (updates: Partial<WorkflowDefinition>) => void
}

export function RuleConfigurationPanel({ 
  nodes, 
  onNodeUpdate, 
  workflow, 
  onWorkflowUpdate 
}: RuleConfigurationPanelProps) {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [editingRule, setEditingRule] = useState<Partial<Rule> | null>(null)

  // Get all rules from condition and rule_set nodes
  const allRules = nodes
    .filter(node => node.type === "condition" || node.type === "rule_set")
    .flatMap(node => node.data.rules || [])

  const createNewRule = () => {
    const newRule: Partial<Rule> = {
      id: `rule_${Date.now()}`,
      name: "New Rule",
      description: "",
      priority: 50,
      enabled: true,
      conditions: [],
      logicalOperator: "AND",
      actions: []
    }
    setEditingRule(newRule)
  }

  const saveRule = () => {
    if (!editingRule || !editingRule.id) return

    const rule = editingRule as Rule
    
    // Find the first condition or rule_set node to add this rule to
    const targetNode = nodes.find(node => 
      node.type === "condition" || node.type === "rule_set"
    )
    
    if (targetNode) {
      const existingRules = targetNode.data.rules || []
      const updatedRules = existingRules.some(r => r.id === rule.id)
        ? existingRules.map(r => r.id === rule.id ? rule : r)
        : [...existingRules, rule]
      
      onNodeUpdate(targetNode.id, {
        data: { ...targetNode.data, rules: updatedRules }
      })
    }
    
    setEditingRule(null)
    setSelectedRule(rule)
  }

  const deleteRule = (ruleId: string) => {
    nodes.forEach(node => {
      if (node.data.rules) {
        const updatedRules = node.data.rules.filter(r => r.id !== ruleId)
        onNodeUpdate(node.id, {
          data: { ...node.data, rules: updatedRules }
        })
      }
    })
    
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null)
    }
  }

  const duplicateRule = (rule: Rule) => {
    const duplicatedRule: Rule = {
      ...rule,
      id: `rule_${Date.now()}`,
      name: `${rule.name} (Copy)`,
      metadata: {
        ...rule.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
    setEditingRule(duplicatedRule)
  }

  const loadTemplate = (templateKey: string) => {
    const templates = RuleTemplates as any
    const template = templates[templateKey.split('.')[0]]?.[templateKey.split('.')[1]]
    
    if (template) {
      setEditingRule({
        ...template,
        id: `rule_${Date.now()}`,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "current_user",
          version: "1.0.0"
        }
      })
    }
  }

  return (
    <div className="h-full flex">
      {/* Rules List */}
      <div className="w-1/3 border-r border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Rules</h3>
            <Button size="sm" onClick={createNewRule} className="gap-2">
              <Plus className="h-4 w-4" />
              New Rule
            </Button>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => loadTemplate('creditScore.highCredit')}
            >
              High Credit Score Template
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => loadTemplate('creditScore.lowCredit')}
            >
              Low Credit Score Template
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => loadTemplate('income.debtToIncomeRatio')}
            >
              Debt-to-Income Template
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => loadTemplate('fraud.velocityCheck')}
            >
              Fraud Velocity Template
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {allRules.map((rule) => (
            <Card 
              key={rule.id} 
              className={`cursor-pointer transition-all duration-200 ${
                selectedRule?.id === rule.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
              onClick={() => setSelectedRule(rule)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{rule.name}</h4>
                  <div className="flex items-center gap-1">
                    <Badge variant={rule.enabled ? "default" : "secondary"} className="text-xs">
                      {rule.enabled ? "Active" : "Disabled"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingRule(rule)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateRule(rule)
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteRule(rule.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {rule.description || "No description"}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span>Priority: {rule.priority}</span>
                  <span>{rule.conditions.length} conditions</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rule Editor */}
      <div className="flex-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        {editingRule ? (
          <RuleEditor 
            rule={editingRule}
            onRuleChange={setEditingRule}
            onSave={saveRule}
            onCancel={() => setEditingRule(null)}
          />
        ) : selectedRule ? (
          <RuleViewer 
            rule={selectedRule}
            onEdit={() => setEditingRule(selectedRule)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No Rule Selected</p>
              <p className="text-sm">Select a rule to view details or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Rule Editor Component
function RuleEditor({ 
  rule, 
  onRuleChange, 
  onSave, 
  onCancel 
}: {
  rule: Partial<Rule>
  onRuleChange: (rule: Partial<Rule>) => void
  onSave: () => void
  onCancel: () => void
}) {
  const addCondition = () => {
    const newCondition: Condition = {
      id: `condition_${Date.now()}`,
      field: "",
      operator: "equals",
      value: "",
      dataType: "string"
    }
    
    onRuleChange({
      ...rule,
      conditions: [...(rule.conditions || []), newCondition]
    })
  }

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const updatedConditions = [...(rule.conditions || [])]
    updatedConditions[index] = { ...updatedConditions[index], ...updates }
    onRuleChange({ ...rule, conditions: updatedConditions })
  }

  const removeCondition = (index: number) => {
    const updatedConditions = [...(rule.conditions || [])]
    updatedConditions.splice(index, 1)
    onRuleChange({ ...rule, conditions: updatedConditions })
  }

  const addAction = () => {
    const newAction = {
      type: "approve" as const,
      message: ""
    }
    
    onRuleChange({
      ...rule,
      actions: [...(rule.actions || []), newAction]
    })
  }

  const updateAction = (index: number, updates: any) => {
    const updatedActions = [...(rule.actions || [])]
    updatedActions[index] = { ...updatedActions[index], ...updates }
    onRuleChange({ ...rule, actions: updatedActions })
  }

  const removeAction = (index: number) => {
    const updatedActions = [...(rule.actions || [])]
    updatedActions.splice(index, 1)
    onRuleChange({ ...rule, actions: updatedActions })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {rule.id?.startsWith('rule_') ? 'Edit Rule' : 'New Rule'}
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Rule
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Rule Name</Label>
              <Input
                value={rule.name || ""}
                onChange={(e) => onRuleChange({ ...rule, name: e.target.value })}
                placeholder="Enter rule name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                value={rule.description || ""}
                onChange={(e) => onRuleChange({ ...rule, description: e.target.value })}
                className="w-full p-2 border rounded-md text-sm"
                rows={3}
                placeholder="Describe what this rule does"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <div className="mt-2">
                  <Slider
                    value={[rule.priority || 50]}
                    onValueChange={([value]) => onRuleChange({ ...rule, priority: value })}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    Priority: {rule.priority || 50}
                  </div>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    checked={rule.enabled !== false}
                    onCheckedChange={(checked) => onRuleChange({ ...rule, enabled: checked })}
                  />
                  <span className="text-sm">
                    {rule.enabled !== false ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conditions</CardTitle>
              <Button size="sm" onClick={addCondition} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Condition
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rule.logicalOperator && (
              <div>
                <Label>Logical Operator</Label>
                <Select
                  value={rule.logicalOperator}
                  onValueChange={(value: "AND" | "OR") => 
                    onRuleChange({ ...rule, logicalOperator: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND (all conditions must be true)</SelectItem>
                    <SelectItem value="OR">OR (any condition can be true)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {rule.conditions?.map((condition, index) => (
              <ConditionEditor
                key={condition.id}
                condition={condition}
                onUpdate={(updates) => updateCondition(index, updates)}
                onRemove={() => removeCondition(index)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Actions</CardTitle>
              <Button size="sm" onClick={addAction} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Action
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rule.actions?.map((action, index) => (
              <ActionEditor
                key={index}
                action={action}
                onUpdate={(updates) => updateAction(index, updates)}
                onRemove={() => removeAction(index)}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Condition Editor Component
function ConditionEditor({ 
  condition, 
  onUpdate, 
  onRemove 
}: {
  condition: Condition
  onUpdate: (updates: Partial<Condition>) => void
  onRemove: () => void
}) {
  const operators: { value: Operator; label: string }[] = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "greater_than_or_equal", label: "Greater Than or Equal" },
    { value: "less_than_or_equal", label: "Less Than or Equal" },
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does Not Contain" },
    { value: "in", label: "In List" },
    { value: "not_in", label: "Not In List" },
    { value: "between", label: "Between" },
    { value: "is_null", label: "Is Null" },
    { value: "is_not_null", label: "Is Not Null" }
  ]

  const dataTypes: { value: DataType; label: string }[] = [
    { value: "string", label: "Text" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "True/False" },
    { value: "date", label: "Date" },
    { value: "array", label: "List" }
  ]

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Condition</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Field Path</Label>
          <Input
            value={condition.field}
            onChange={(e) => onUpdate({ field: e.target.value })}
            placeholder="e.g., applicationData.creditScore"
          />
        </div>
        <div>
          <Label>Data Type</Label>
          <Select
            value={condition.dataType}
            onValueChange={(value: DataType) => onUpdate({ dataType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dataTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Operator</Label>
          <Select
            value={condition.operator}
            onValueChange={(value: Operator) => onUpdate({ operator: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Value</Label>
          <Input
            value={condition.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Enter comparison value"
          />
        </div>
      </div>
      
      {condition.description !== undefined && (
        <div>
          <Label>Description</Label>
          <Input
            value={condition.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Optional description"
          />
        </div>
      )}
    </div>
  )
}

// Action Editor Component
function ActionEditor({ 
  action, 
  onUpdate, 
  onRemove 
}: {
  action: any
  onUpdate: (updates: any) => void
  onRemove: () => void
}) {
  const actionTypes = [
    { value: "approve", label: "Approve" },
    { value: "decline", label: "Decline" },
    { value: "review", label: "Require Review" },
    { value: "set_score", label: "Set Score" },
    { value: "add_flag", label: "Add Flag" },
    { value: "require_document", label: "Require Document" }
  ]

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Action</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Action Type</Label>
          <Select
            value={action.type}
            onValueChange={(value) => onUpdate({ type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(action.type === "set_score" || action.type === "add_flag" || action.type === "require_document") && (
          <div>
            <Label>Value</Label>
            <Input
              value={action.value || ""}
              onChange={(e) => onUpdate({ value: e.target.value })}
              placeholder={
                action.type === "set_score" ? "Score (0-100)" :
                action.type === "add_flag" ? "Flag name" :
                "Document type"
              }
            />
          </div>
        )}
      </div>
      
      <div>
        <Label>Message</Label>
        <Input
          value={action.message || ""}
          onChange={(e) => onUpdate({ message: e.target.value })}
          placeholder="Optional message for this action"
        />
      </div>
    </div>
  )
}

// Rule Viewer Component
function RuleViewer({ 
  rule, 
  onEdit 
}: {
  rule: Rule
  onEdit: () => void
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{rule.name}</h3>
            <p className="text-sm text-muted-foreground">{rule.description}</p>
          </div>
          <Button size="sm" onClick={onEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Rule
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Rule Details */}
        <Card>
          <CardHeader>
            <CardTitle>Rule Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Priority</Label>
                <p className="font-medium">{rule.priority}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={rule.enabled ? "default" : "secondary"}>
                  {rule.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div>
                <Label>Logic</Label>
                <Badge variant="outline">{rule.logicalOperator}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions ({rule.conditions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rule.conditions.map((condition, index) => (
              <div key={condition.id} className="border rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label>Field</Label>
                    <p className="font-mono">{condition.field}</p>
                  </div>
                  <div>
                    <Label>Condition</Label>
                    <p>{condition.operator} {condition.value}</p>
                  </div>
                </div>
                {condition.description && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {condition.description}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions ({rule.actions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rule.actions.map((action, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{action.type}</Badge>
                  {action.value && (
                    <span className="text-sm font-medium">{action.value}</span>
                  )}
                </div>
                {action.message && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {action.message}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}