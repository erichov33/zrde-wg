"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit3, ArrowRight, GitBranch } from "lucide-react"
import type { WorkflowConnection, WorkflowNode as UnifiedWorkflowNode } from "@/lib/types/unified-workflow"

interface ConnectionPropertiesPanelProps {
  connection: WorkflowConnection | null
  nodes: UnifiedWorkflowNode[]
  onConnectionUpdate: (connectionId: string, updates: Partial<WorkflowConnection>) => void
  onConnectionDelete: (connectionId: string) => void
}

/**
 * Predefined connection labels for common workflow patterns
 */
const CONNECTION_LABELS = [
  { value: "yes", label: "Yes", description: "Condition is true" },
  { value: "no", label: "No", description: "Condition is false" },
  { value: "approved", label: "Approved", description: "Decision approved" },
  { value: "declined", label: "Declined", description: "Decision declined" },
  { value: "pending", label: "Pending", description: "Requires review" },
  { value: "error", label: "Error", description: "Error occurred" },
  { value: "timeout", label: "Timeout", description: "Process timed out" },
  { value: "retry", label: "Retry", description: "Retry process" },
  { value: "escalate", label: "Escalate", description: "Escalate to manual review" },
  { value: "next", label: "Next", description: "Continue to next step" },
] as const

/**
 * Connection condition templates for business logic
 */
const CONDITION_TEMPLATES = [
  { value: "creditScore >= 650", label: "Credit Score ≥ 650", description: "Good credit score" },
  { value: "creditScore < 650", label: "Credit Score < 650", description: "Poor credit score" },
  { value: "income >= 50000", label: "Income ≥ $50,000", description: "Sufficient income" },
  { value: "debtToIncomeRatio <= 0.4", label: "DTI ≤ 40%", description: "Acceptable debt ratio" },
  { value: "debtToIncomeRatio > 0.4", label: "DTI > 40%", description: "High debt ratio" },
  { value: "riskScore <= 0.3", label: "Low Risk", description: "Risk score ≤ 30%" },
  { value: "riskScore > 0.7", label: "High Risk", description: "Risk score > 70%" },
  { value: "employmentVerified === true", label: "Employment Verified", description: "Employment confirmed" },
  { value: "bankingHistory.length >= 12", label: "Banking History ≥ 12 months", description: "Sufficient banking history" },
] as const

export function ConnectionPropertiesPanel({
  connection,
  nodes,
  onConnectionUpdate,
  onConnectionDelete,
}: ConnectionPropertiesPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    label: "",
    condition: "",
  })

  // Get source and target nodes for the connection
  const sourceNode = connection ? nodes.find(n => n.id === connection.source) : null
  const targetNode = connection ? nodes.find(n => n.id === connection.target) : null

  // Initialize edit form when connection changes
  const startEditing = useCallback(() => {
    if (connection) {
      setEditForm({
        label: connection.label || "",
        condition: connection.condition || "",
      })
      setIsEditing(true)
    }
  }, [connection])

  const cancelEditing = useCallback(() => {
    setIsEditing(false)
    setEditForm({ label: "", condition: "" })
  }, [])

  const saveChanges = useCallback(() => {
    if (connection) {
      onConnectionUpdate(connection.id, {
        label: editForm.label || undefined,
        condition: editForm.condition || undefined,
      })
      setIsEditing(false)
    }
  }, [connection, editForm, onConnectionUpdate])

  const handleDelete = useCallback(() => {
    if (connection && window.confirm("Are you sure you want to delete this connection?")) {
      onConnectionDelete(connection.id)
    }
  }, [connection, onConnectionDelete])

  const handleLabelSelect = useCallback((value: string) => {
    setEditForm(prev => ({ ...prev, label: value }))
  }, [])

  const handleConditionSelect = useCallback((value: string) => {
    setEditForm(prev => ({ ...prev, condition: value }))
  }, [])

  if (!connection) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No Connection Selected</p>
        <p className="text-sm">
          Click on a connection line to view and edit its properties.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Connection Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              <span>Connection Properties</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <Button size="sm" variant="outline" onClick={startEditing}>
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          <CardDescription>
            Configure the connection between workflow nodes
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Flow */}
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                {sourceNode?.type.replace('_', ' ')}
              </Badge>
              <p className="text-sm font-medium">{sourceNode?.data.label}</p>
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                {targetNode?.type.replace('_', ' ')}
              </Badge>
              <p className="text-sm font-medium">{targetNode?.data.label}</p>
            </div>
          </div>

          {/* Connection Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Connection ID</Label>
              <p className="font-mono">{connection.id}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Source Node</Label>
              <p>{connection.source}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Target Node</Label>
              <p>{connection.target}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Current Label</Label>
              <p>{connection.label || <span className="text-muted-foreground italic">No label</span>}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit Connection</CardTitle>
            <CardDescription>
              Modify the connection label and condition
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Label Configuration */}
            <div className="space-y-2">
              <Label htmlFor="connection-label">Connection Label</Label>
              <div className="space-y-2">
                <Input
                  id="connection-label"
                  value={editForm.label}
                  onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Enter custom label or select from presets"
                />
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Select</Label>
                  <Select onValueChange={handleLabelSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset label" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONNECTION_LABELS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.label}>
                          <div>
                            <div className="font-medium">{preset.label}</div>
                            <div className="text-xs text-muted-foreground">{preset.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Condition Configuration */}
            <div className="space-y-2">
              <Label htmlFor="connection-condition">Business Logic Condition</Label>
              <div className="space-y-2">
                <Input
                  id="connection-condition"
                  value={editForm.condition}
                  onChange={(e) => setEditForm(prev => ({ ...prev, condition: e.target.value }))}
                  placeholder="Enter condition (e.g., creditScore >= 650)"
                />
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Condition Templates</Label>
                  <Select onValueChange={handleConditionSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a condition template" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_TEMPLATES.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          <div>
                            <div className="font-medium">{template.label}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button onClick={saveChanges}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Information */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connection Details</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {connection.condition && (
              <div>
                <Label className="text-sm font-medium">Business Logic Condition</Label>
                <div className="mt-1 p-2 bg-muted/50 rounded font-mono text-sm">
                  {connection.condition}
                </div>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>
                This connection represents the flow from{" "}
                <span className="font-medium">{sourceNode?.data.label}</span> to{" "}
                <span className="font-medium">{targetNode?.data.label}</span>
                {connection.label && (
                  <>
                    {" "}when the condition is{" "}
                    <span className="font-medium">"{connection.label}"</span>
                  </>
                )}
                .
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}