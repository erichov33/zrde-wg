"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowCanvas } from "./workflow-canvas"
import { RuleConfigurationPanel } from "./rule-configuration-panel"
import { SimulationPanel } from "./simulation-panel"
import { DataSourcePanel } from "./data-source-panel"
import { VersionControlPanel } from "./version-control-panel"
import { Save, Play, ArrowLeft, Settings, TestTube, Database, GitBranch, Download, Upload, Zap, Square } from "lucide-react"
import Link from "next/link"
import { WorkflowDefinition } from "@/lib/services/enhanced-decision-service"
import { RuleSet, Rule } from "@/lib/engines/rule-engine"

export interface EnhancedWorkflowNode {
  id: string
  type: "start" | "condition" | "action" | "end" | "data_source" | "rule_set"
  position: { x: number; y: number }
  data: {
    label: string
    config?: any
    rules?: Rule[]
    dataSource?: string
    conditions?: any[]
  }
}

export interface WorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
}

/**
 * Configuration for enhanced workflow node types
 */
const ENHANCED_NODE_TYPES = [
  {
    type: "start" as const,
    label: "Start",
    description: "Workflow entry point",
    icon: Play,
    color: "text-green-600",
  },
  {
    type: "data_source" as const,
    label: "Data Source",
    description: "External data integration",
    icon: Database,
    color: "text-blue-600",
  },
  {
    type: "condition" as const,
    label: "Rule Condition",
    description: "Decision point with rules",
    icon: GitBranch,
    color: "text-purple-600",
  },
  {
    type: "rule_set" as const,
    label: "Rule Set",
    description: "Collection of rules",
    icon: Settings,
    color: "text-orange-600",
  },
  {
    type: "action" as const,
    label: "Action",
    description: "Process or validation step",
    icon: Zap,
    color: "text-yellow-600",
  },
  {
    type: "end" as const,
    label: "Decision",
    description: "Final decision outcome",
    icon: Square,
    color: "text-red-600",
  },
] as const

/**
 * Rule templates for common use cases
 */
const RULE_TEMPLATES = [
  "Credit Score Rules",
  "Income Verification",
  "Fraud Detection",
  "KYC Compliance",
  "Debt-to-Income",
] as const

/**
 * Data source options for integration
 */
const DATA_SOURCE_OPTIONS = [
  { value: "credit_bureau", label: "Credit Bureau" },
  { value: "kyc_provider", label: "KYC Provider" },
  { value: "fraud_service", label: "Fraud Service" },
  { value: "income_verification", label: "Income Verification" },
] as const

/**
 * Default workflow configuration
 */
const DEFAULT_WORKFLOW: Partial<WorkflowDefinition> = {
  description: "",
  version: "1.0.0",
  dataRequirements: {
    required: [],
    optional: [],
    external: []
  }
}

/**
 * Enhanced Workflow Builder component with advanced features
 * Provides a comprehensive interface for creating complex decision workflows
 */
export function EnhancedWorkflowBuilder() {
  // State management
  const [workflowName, setWorkflowName] = useState("New Decision Workflow")
  const [selectedNode, setSelectedNode] = useState<EnhancedWorkflowNode | null>(null)
  const [activeTab, setActiveTab] = useState("canvas")
  const [nodes, setNodes] = useState<EnhancedWorkflowNode[]>([
    {
      id: "start-1",
      type: "start",
      position: { x: 100, y: 100 },
      data: { label: "Application Received" },
    },
  ])
  const [connections, setConnections] = useState<WorkflowConnection[]>([])
  const [workflow, setWorkflow] = useState<Partial<WorkflowDefinition>>({
    name: workflowName,
    ...DEFAULT_WORKFLOW
  })

  /**
   * Adds a new node to the workflow
   */
  const addNode = useCallback((type: EnhancedWorkflowNode["type"], label: string) => {
    const newNode: EnhancedWorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 300, y: 200 },
      data: { label },
    }
    setNodes(prev => [...prev, newNode])
  }, [])

  /**
   * Updates an existing node with new properties
   */
  const updateNode = useCallback((nodeId: string, updates: Partial<EnhancedWorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ))
  }, [])

  /**
   * Removes a node and its connections from the workflow
   */
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    setConnections(prev => prev.filter(conn => 
      conn.source !== nodeId && conn.target !== nodeId
    ))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }, [selectedNode])

  /**
   * Creates a workflow definition from current state
   */
  const createWorkflowDefinition = useCallback((): WorkflowDefinition => {
    return {
      id: `wf_${Date.now()}`,
      name: workflowName,
      description: workflow.description || "",
      version: workflow.version || "1.0.0",
      ruleSet: {
        id: `rs_${Date.now()}`,
        name: `${workflowName} Rules`,
        description: `Rule set for ${workflowName}`,
        rules: nodes
          .filter(node => node.type === "condition" || node.type === "rule_set")
          .flatMap(node => node.data.rules || []),
        executionOrder: "priority"
      },
      dataRequirements: workflow.dataRequirements || DEFAULT_WORKFLOW.dataRequirements!,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "current_user",
        status: "draft"
      }
    }
  }, [workflowName, workflow, nodes])

  /**
   * Saves the current workflow
   */
  const saveWorkflow = useCallback(async () => {
    try {
      const workflowDefinition = createWorkflowDefinition()
      
      // Here you would save to your backend
      console.log("Saving workflow:", workflowDefinition)
      
      // Show success message
      alert("Workflow saved successfully!")
    } catch (error) {
      console.error("Error saving workflow:", error)
      alert("Error saving workflow. Please try again.")
    }
  }, [createWorkflowDefinition])

  /**
   * Creates export data structure
   */
  const createExportData = useCallback(() => {
    return {
      workflow,
      nodes,
      connections,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "1.0"
      }
    }
  }, [workflow, nodes, connections])

  /**
   * Downloads workflow as JSON file
   */
  const downloadWorkflowFile = useCallback((data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  /**
   * Exports the current workflow to a JSON file
   */
  const exportWorkflow = useCallback(() => {
    try {
      const exportData = createExportData()
      const filename = `${workflowName.replace(/\s+/g, "_")}.json`
      downloadWorkflowFile(exportData, filename)
    } catch (error) {
      console.error("Error exporting workflow:", error)
      alert("Error exporting workflow. Please try again.")
    }
  }, [createExportData, workflowName, downloadWorkflowFile])

  /**
   * Processes imported workflow data
   */
  const processImportedData = useCallback((data: any) => {
    setWorkflow(data.workflow)
    setNodes(data.nodes)
    setConnections(data.connections)
    setWorkflowName(data.workflow.name || "Imported Workflow")
  }, [])

  /**
   * Imports a workflow from a JSON file
   */
  const importWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        processImportedData(importData)
        alert("Workflow imported successfully!")
      } catch (error) {
        console.error("Error importing workflow:", error)
        alert("Error importing workflow: Invalid file format")
      }
    }
    reader.readAsText(file)
  }, [processImportedData])

  /**
   * Renders the workflow header with navigation and actions
   */
  const renderHeader = () => (
    <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workflows">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Workflows
            </Button>
          </Link>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
          <div>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Workflow Name"
            />
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                v{workflow.version}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {nodes.length} nodes
              </Badge>
              <Badge variant="outline" className="text-xs">
                {connections.length} connections
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importWorkflow}
            className="hidden"
            id="import-workflow"
          />
          <label htmlFor="import-workflow">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </label>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportWorkflow}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab("simulation")}>
            <TestTube className="h-4 w-4" />
            Test
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" onClick={saveWorkflow}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  )

  /**
   * Renders the tab navigation
   */
  const renderTabNavigation = () => (
    <TabsList className="grid w-full grid-cols-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50">
      <TabsTrigger value="canvas" className="gap-2">
        <Settings className="h-4 w-4" />
        Canvas
      </TabsTrigger>
      <TabsTrigger value="rules" className="gap-2">
        <GitBranch className="h-4 w-4" />
        Rules
      </TabsTrigger>
      <TabsTrigger value="data" className="gap-2">
        <Database className="h-4 w-4" />
        Data Sources
      </TabsTrigger>
      <TabsTrigger value="simulation" className="gap-2">
        <TestTube className="h-4 w-4" />
        Simulation
      </TabsTrigger>
      <TabsTrigger value="versions" className="gap-2">
        <GitBranch className="h-4 w-4" />
        Versions
      </TabsTrigger>
    </TabsList>
  )

  /**
   * Renders the canvas tab content
   */
  const renderCanvasTab = () => (
    <TabsContent value="canvas" className="flex-1 flex m-0">
      {/* Enhanced Toolbox */}
      <div className="w-64 border-r border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <EnhancedWorkflowToolbox onAddNode={addNode} />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30">
        <WorkflowCanvas
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
          onNodeUpdate={updateNode}
          onNodeDelete={deleteNode}
        />
      </div>

      {/* Enhanced Properties Panel */}
      <div className="w-80 border-l border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <EnhancedWorkflowProperties 
          selectedNode={selectedNode} 
          onNodeUpdate={updateNode}
          workflow={workflow}
          onWorkflowUpdate={setWorkflow}
        />
      </div>
    </TabsContent>
  )

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Header */}
      {renderHeader()}

      {/* Main Content */}
      <div className="flex-1 flex">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          {renderTabNavigation()}

          {renderCanvasTab()}

          <TabsContent value="rules" className="flex-1 m-0">
            <RuleConfigurationPanel 
              nodes={nodes}
              onNodeUpdate={updateNode}
              workflow={workflow}
              onWorkflowUpdate={setWorkflow}
            />
          </TabsContent>

          <TabsContent value="data" className="flex-1 m-0">
            <DataSourcePanel 
              workflow={workflow}
              onWorkflowUpdate={setWorkflow}
            />
          </TabsContent>

          <TabsContent value="simulation" className="flex-1 m-0">
            <SimulationPanel 
              workflow={workflow}
              nodes={nodes}
            />
          </TabsContent>

          <TabsContent value="versions" className="flex-1 m-0">
            <VersionControlPanel 
              workflow={workflow}
              onWorkflowUpdate={setWorkflow}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/**
 * Enhanced Toolbox Component
 * Provides draggable node types and rule templates for workflow creation
 */
function EnhancedWorkflowToolbox({ onAddNode }: { onAddNode: (type: EnhancedWorkflowNode["type"], label: string) => void }) {
  /**
   * Renders a node type button
   */
  const renderNodeTypeButton = (nodeType: typeof ENHANCED_NODE_TYPES[number]) => {
    const IconComponent = nodeType.icon
    
    return (
      <Button
        key={nodeType.type}
        variant="ghost"
        className="w-full justify-start gap-3 h-auto p-3 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={() => onAddNode(nodeType.type, nodeType.label)}
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
   * Renders a rule template button
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
      {/* Workflow Components Section */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Workflow Components</h3>
        <div className="space-y-2">
          {ENHANCED_NODE_TYPES.map(renderNodeTypeButton)}
        </div>
      </div>

      {/* Rule Templates Section */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Rule Templates</h3>
        <div className="space-y-2">
          {RULE_TEMPLATES.map(renderTemplateButton)}
        </div>
      </div>
    </div>
  )
}

/**
 * Enhanced Properties Panel Component
 * Displays and manages properties for selected nodes and workflow settings
 */
function EnhancedWorkflowProperties({ 
  selectedNode, 
  onNodeUpdate,
  workflow,
  onWorkflowUpdate 
}: {
  selectedNode: EnhancedWorkflowNode | null
  onNodeUpdate: (nodeId: string, updates: Partial<EnhancedWorkflowNode>) => void
  workflow: Partial<WorkflowDefinition>
  onWorkflowUpdate: (updates: Partial<WorkflowDefinition>) => void
}) {
  /**
   * Renders workflow-level properties when no node is selected
   */
  const renderWorkflowProperties = () => (
    <div className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-3">Workflow Properties</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={workflow.description || ""}
                onChange={(e) => onWorkflowUpdate({ description: e.target.value })}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                rows={3}
                placeholder="Describe this workflow..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Version</label>
              <Input
                value={workflow.version || "1.0.0"}
                onChange={(e) => onWorkflowUpdate({ version: e.target.value })}
                className="mt-1"
                placeholder="1.0.0"
              />
            </div>
          </div>
        </div>
        
        <div className="text-center text-muted-foreground py-8">
          <p>Select a node to edit its properties</p>
        </div>
      </div>
    </div>
  )

  /**
   * Renders condition-specific properties
   */
  const renderConditionProperties = () => (
    <div>
      <label className="text-sm font-medium">Condition Logic</label>
      <textarea
        value={selectedNode?.data.config?.logic || ""}
        onChange={(e) => onNodeUpdate(selectedNode!.id, {
          data: { 
            ...selectedNode!.data, 
            config: { 
              ...selectedNode!.data.config, 
              logic: e.target.value 
            }
          }
        })}
        className="w-full mt-1 p-2 border rounded-md text-sm"
        rows={4}
        placeholder="if (creditScore >= 700) { approve() }"
      />
    </div>
  )

  /**
   * Renders data source properties
   */
  const renderDataSourceProperties = () => (
    <div>
      <label className="text-sm font-medium">Data Source</label>
      <select
        value={selectedNode?.data.dataSource || ""}
        onChange={(e) => onNodeUpdate(selectedNode!.id, {
          data: { ...selectedNode!.data, dataSource: e.target.value }
        })}
        className="w-full mt-1 p-2 border rounded-md text-sm"
      >
        <option value="">Select data source...</option>
        {DATA_SOURCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  /**
   * Renders node-specific properties based on type
   */
  const renderNodeSpecificProperties = () => {
    if (!selectedNode) return null

    switch (selectedNode.type) {
      case "condition":
        return renderConditionProperties()
      case "data_source":
        return renderDataSourceProperties()
      default:
        return null
    }
  }

  /**
   * Renders node properties when a node is selected
   */
  const renderNodeProperties = () => (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-3">Node Properties</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Label</label>
            <Input
              value={selectedNode!.data.label}
              onChange={(e) => onNodeUpdate(selectedNode!.id, {
                data: { ...selectedNode!.data, label: e.target.value }
              })}
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Type</label>
            <Badge variant="outline" className="mt-1 block w-fit">
              {selectedNode!.type}
            </Badge>
          </div>

          {renderNodeSpecificProperties()}
        </div>
      </div>
    </div>
  )

  // Return appropriate view based on selection
  if (!selectedNode) {
    return renderWorkflowProperties()
  }

  return renderNodeProperties()
}