"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, GitBranch, Zap, Square } from "lucide-react"
import type { WorkflowNode } from "./workflow-builder"

interface WorkflowToolboxProps {
  onAddNode: (type: WorkflowNode["type"], label: string) => void
}

/**
 * Configuration for different workflow node types
 * Each node type defines its appearance and behavior in the toolbox
 */
const NODE_TYPES = [
  {
    type: "start" as const,
    label: "Start",
    description: "Workflow entry point",
    icon: Play,
    color: "text-accent",
  },
  {
    type: "condition" as const,
    label: "Condition",
    description: "Decision point with rules",
    icon: GitBranch,
    color: "text-primary",
  },
  {
    type: "action" as const,
    label: "Action",
    description: "Process or validation step",
    icon: Zap,
    color: "text-chart-4",
  },
  {
    type: "end" as const,
    label: "End",
    description: "Final decision outcome",
    icon: Square,
    color: "text-muted-foreground",
  },
] as const

/**
 * Predefined workflow templates for common use cases
 */
const WORKFLOW_TEMPLATES = [
  "Credit Assessment",
  "Identity Verification", 
  "Fraud Detection",
  "KYC Compliance",
] as const

/**
 * WorkflowToolbox component provides a sidebar with draggable node types and templates
 * Users can click on node types to add them to the workflow canvas
 */
export function WorkflowToolbox({ onAddNode }: WorkflowToolboxProps) {
  /**
   * Handles adding a new node to the workflow
   */
  const handleAddNode = (type: WorkflowNode["type"], label: string) => {
    onAddNode(type, label)
  }

  /**
   * Renders a single node type button
   */
  const renderNodeTypeButton = (nodeType: typeof NODE_TYPES[number]) => {
    const IconComponent = nodeType.icon
    
    return (
      <Button
        key={nodeType.type}
        variant="ghost"
        className="w-full justify-start gap-3 h-auto p-3"
        onClick={() => handleAddNode(nodeType.type, nodeType.label)}
      >
        <IconComponent className={`h-4 w-4 ${nodeType.color}`} />
        <div className="text-left">
          <p className="font-medium">{nodeType.label}</p>
          <p className="text-xs text-muted-foreground">{nodeType.description}</p>
        </div>
      </Button>
    )
  }

  /**
   * Renders a template button
   */
  const renderTemplateButton = (template: string) => (
    <Button 
      key={template}
      variant="outline" 
      className="w-full justify-start bg-transparent" 
      size="sm"
    >
      {template}
    </Button>
  )

  return (
    <div className="p-4 space-y-4">
      {/* Node Types Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Nodes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {NODE_TYPES.map(renderNodeTypeButton)}
        </CardContent>
      </Card>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {WORKFLOW_TEMPLATES.map(renderTemplateButton)}
        </CardContent>
      </Card>
    </div>
  )
}
