"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import type { WorkflowNode } from "./workflow-builder"

interface WorkflowPropertiesProps {
  selectedNode: WorkflowNode | null
  onNodeUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void
}

/**
 * Configuration for condition node properties
 */
const CONDITION_TYPES = [
  { value: "risk-score", label: "Risk Score" },
  { value: "credit-score", label: "Credit Score" },
  { value: "income", label: "Income Level" },
  { value: "age", label: "Age Range" },
  { value: "location", label: "Geographic Location" },
] as const

const OPERATORS = [
  { value: "greater-than", label: "Greater than" },
  { value: "less-than", label: "Less than" },
  { value: "equals", label: "Equals" },
  { value: "between", label: "Between" },
] as const

/**
 * Configuration for action node properties
 */
const ACTION_TYPES = [
  { value: "verify-identity", label: "Verify Identity" },
  { value: "check-credit", label: "Check Credit Bureau" },
  { value: "fraud-check", label: "Fraud Detection" },
  { value: "income-verification", label: "Income Verification" },
  { value: "send-notification", label: "Send Notification" },
] as const

const INTEGRATIONS = [
  { value: "smile-identity", label: "Smile Identity" },
  { value: "transunion", label: "TransUnion Africa" },
  { value: "experian", label: "Experian Africa" },
  { value: "mpesa", label: "M-Pesa API" },
] as const

/**
 * Configuration for end node properties
 */
const DECISION_OUTCOMES = [
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "review", label: "Manual Review" },
  { value: "pending", label: "Pending Information" },
] as const

/**
 * Default values for different node types
 */
const DEFAULT_VALUES = {
  riskScoreThreshold: 650,
  timeout: 30,
  approvedMessage: "Your application has been approved. You will receive further instructions via email.",
} as const

/**
 * WorkflowProperties component displays and manages properties for selected workflow nodes
 * Provides different property panels based on the node type (condition, action, end)
 */
export function WorkflowProperties({ selectedNode, onNodeUpdate }: WorkflowPropertiesProps) {
  /**
   * Updates a specific data field for the selected node
   */
  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return
    
    // Properties that should be stored in the config object
    const configProperties = ['description']
    
    if (configProperties.includes(key)) {
      onNodeUpdate(selectedNode.id, {
        data: {
          ...selectedNode.data,
          config: {
            ...selectedNode.data.config,
            [key]: value,
          },
        },
      })
    } else {
      onNodeUpdate(selectedNode.id, {
        data: {
          ...selectedNode.data,
          [key]: value,
        },
      })
    }
  }

  /**
   * Renders the empty state when no node is selected
   */
  const renderEmptyState = () => (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Select a node to edit its properties
          </p>
        </CardContent>
      </Card>
    </div>
  )

  /**
   * Renders properties specific to condition nodes
   */
  const renderConditionProperties = () => (
    <div className="space-y-4">
      <div>
        <Label>Condition Type</Label>
        <Select defaultValue="risk-score">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Risk Score Threshold</Label>
        <div className="space-y-2">
          <Slider 
            defaultValue={[DEFAULT_VALUES.riskScoreThreshold]} 
            max={1000} 
            min={0} 
            step={10} 
            className="w-full" 
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 (High Risk)</span>
            <span>{DEFAULT_VALUES.riskScoreThreshold}</span>
            <span>1000 (Low Risk)</span>
          </div>
        </div>
      </div>

      <div>
        <Label>Operator</Label>
        <Select defaultValue="greater-than">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((operator) => (
              <SelectItem key={operator.value} value={operator.value}>
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  /**
   * Renders properties specific to action nodes
   */
  const renderActionProperties = () => (
    <div className="space-y-4">
      <div>
        <Label>Action Type</Label>
        <Select defaultValue="verify-identity">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((action) => (
              <SelectItem key={action.value} value={action.value}>
                {action.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Integration</Label>
        <Select defaultValue="smile-identity">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTEGRATIONS.map((integration) => (
              <SelectItem key={integration.value} value={integration.value}>
                {integration.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Timeout (seconds)</Label>
        <Input 
          type="number" 
          defaultValue={DEFAULT_VALUES.timeout.toString()} 
          min="1" 
          max="300" 
        />
      </div>
    </div>
  )

  /**
   * Renders properties specific to end nodes
   */
  const renderEndProperties = () => (
    <div className="space-y-4">
      <div>
        <Label>Decision Outcome</Label>
        <Select defaultValue="approved">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DECISION_OUTCOMES.map((outcome) => (
              <SelectItem key={outcome.value} value={outcome.value}>
                {outcome.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Reason Code</Label>
        <Input placeholder="e.g., INSUFFICIENT_CREDIT_HISTORY" />
      </div>

      <div>
        <Label>Customer Message</Label>
        <Textarea
          placeholder="Message to display to the customer"
          defaultValue={DEFAULT_VALUES.approvedMessage}
        />
      </div>
    </div>
  )

  /**
   * Renders node-specific properties based on the selected node type
   */
  const renderNodeSpecificProperties = () => {
    if (!selectedNode) return null

    switch (selectedNode.type) {
      case "condition":
        return renderConditionProperties()
      case "action":
        return renderActionProperties()
      case "end":
        return renderEndProperties()
      default:
        return null
    }
  }

  /**
   * Renders the common properties section (label and description)
   */
  const renderCommonProperties = () => (
    <>
      <div>
        <Label>Node Label</Label>
        <Input
          value={selectedNode?.data.label || ""}
          onChange={(e) => updateNodeData("label", e.target.value)}
          placeholder="Enter node label"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          placeholder="Describe what this node does"
          defaultValue={selectedNode?.data.config?.description || ""}
          onChange={(e) => updateNodeData("description", e.target.value)}
        />
      </div>
    </>
  )

  /**
   * Renders the testing section
   */
  const renderTestingSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full bg-transparent" size="sm">
          Test This Node
        </Button>
      </CardContent>
    </Card>
  )

  // Return early if no node is selected
  if (!selectedNode) {
    return renderEmptyState()
  }

  return (
    <div className="p-4 space-y-4">
      {/* Main Properties Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Properties
            <Badge variant="outline" className="text-xs">
              {selectedNode.type}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderCommonProperties()}
          {renderNodeSpecificProperties()}
        </CardContent>
      </Card>

      {/* Testing Section */}
      {renderTestingSection()}
    </div>
  )
}
