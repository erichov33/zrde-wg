"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnhancedWorkflowCanvas } from "./enhanced-workflow-canvas"
import { RuleConfigurationPanel } from "./rule-configuration-panel"
import { SimulationPanel } from "./simulation-panel"
import { DataSourcePanel } from "./data-source-panel"
import { VersionControlPanel } from "./version-control-panel"
import { WorkflowNodeToolbox } from "./workflow-node-toolbox"
import { WorkflowTemplatePanel } from "./workflow-template-panel"
import { BusinessLogicPanel } from "./business-logic-panel"
import { WorkflowConfigurationPanel } from "./workflow-configuration-panel"
import { Save, Play, ArrowLeft, Settings, TestTube, Database, GitBranch, Download, Upload, Zap, Square } from "lucide-react"
import Link from "next/link"
import { WorkflowBusinessLogicService } from "@/lib/services/workflow-business-logic-service"
import { WorkflowConfigurationManager } from "@/lib/config/workflow-config"

// Import unified types
import type { 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowDefinition,
  WorkflowMode
} from "@/lib/types/unified-workflow"
import { createDefaultWorkflow } from "@/lib/types/unified-workflow"
import { Rule } from "@/lib/engines/rule-engine"

// Type aliases for backward compatibility
export type UnifiedWorkflowNode = WorkflowNode
export type UnifiedWorkflowDefinition = WorkflowDefinition

export interface WorkflowBuilderProps {
  mode?: WorkflowMode
  initialWorkflow?: Partial<WorkflowDefinition>
  onSave?: (workflow: WorkflowDefinition) => void
  onTest?: (workflow: WorkflowDefinition) => void
}

export type WorkflowBuilderMode = "simple" | "enhanced"
export type BusinessLogicTemplate = {
  id: string
  name: string
  description: string
  businessLogic: string
  requiredFields: string[]
}
export type WorkflowTemplate = {
  id: string
  name: string
  description: string
  category: string
  nodes: any[]
  connections: any[]
}

/**
 * Default workflow configurations
 */
// Create default workflows using the unified utility
const getDefaultWorkflow = (mode: WorkflowMode): WorkflowDefinition => {
  switch (mode) {
    case "simple":
      return createDefaultWorkflow("Simple Workflow", "simple")
    case "enhanced":
      const enhanced = createDefaultWorkflow("Enhanced Decision Workflow", "enhanced")
      enhanced.description = "Advanced workflow with business rules and data sources"
      enhanced.dataRequirements = {
        required: ["creditScore", "income", "debtToIncomeRatio"],
        optional: ["employmentHistory", "bankingHistory"],
        external: ["credit_bureau", "income_verification"]
      }
      return enhanced
    default:
      return createDefaultWorkflow("Basic Workflow", "simple")
  }
}

/**
 * Unified Workflow Builder Component
 * 
 * A comprehensive workflow builder that supports both simple and enhanced modes:
 * - Simple mode: Basic drag-and-drop workflow creation
 * - Enhanced mode: Advanced features with business rules, data sources, and testing
 */
export const UnifiedWorkflowBuilder = React.memo(function UnifiedWorkflowBuilder({ 
  mode = "enhanced", 
  initialWorkflow,
  onSave,
  onTest 
}: WorkflowBuilderProps) {
  // Core workflow state
  const defaultWorkflow = useMemo(() => getDefaultWorkflow(mode), [mode])
  
  const [workflowName, setWorkflowName] = useState(
    initialWorkflow?.name || defaultWorkflow.name
  )
  const [workflowDescription, setWorkflowDescription] = useState(
    initialWorkflow?.description || defaultWorkflow.description
  )
  const [selectedNode, setSelectedNode] = useState<UnifiedWorkflowNode | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<WorkflowConnection | null>(null)
  const [nodes, setNodes] = useState<UnifiedWorkflowNode[]>(
    (initialWorkflow as any)?.nodes || defaultWorkflow.nodes
  )
  const [connections, setConnections] = useState<WorkflowConnection[]>(
    (initialWorkflow as any)?.connections || defaultWorkflow.connections
  )
  const [selectedConfiguration, setSelectedConfiguration] = useState('loan_approval_config')

  // UI state
  const [activeTab, setActiveTab] = useState("canvas")
  const [sidebarTab, setSidebarTab] = useState("nodes")

  // Generate unique IDs
  const generateId = useCallback(() => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Node management
  const handleNodeAdd = useCallback((position: { x: number; y: number }, template?: string) => {
    const nodeTemplates = WorkflowBusinessLogicService.getNodeTemplates()
    const templateKey = template || 'start'
    const nodeTemplate = nodeTemplates[templateKey]
    
    if (!nodeTemplate) return

    const newNode: UnifiedWorkflowNode = {
      ...nodeTemplate,
      id: generateId(),
      position,
    }

    setNodes(prev => [...prev, newNode])
  }, [generateId])

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ))
  }, [])

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    setConnections(prev => prev.filter(conn => 
      conn.source !== nodeId && conn.target !== nodeId
    ))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }, [selectedNode])

  // Connection management
  const handleConnectionAdd = useCallback((connection: Omit<WorkflowConnection, 'id'>) => {
    const newConnection: WorkflowConnection = {
      ...connection,
      id: generateId(),
    }
    setConnections(prev => [...prev, newConnection])
  }, [generateId])

  const handleConnectionCreate = useCallback((connection: Omit<WorkflowConnection, 'id'>) => {
    const newConnection: WorkflowConnection = {
      ...connection,
      id: generateId(),
    }
    setConnections(prev => [...prev, newConnection])
  }, [generateId])

  const handleConnectionUpdate = useCallback((connectionId: string, updates: Partial<WorkflowConnection>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, ...updates } : conn
    ))
  }, [])

  const handleConnectionDelete = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId))
    if (selectedConnection?.id === connectionId) {
      setSelectedConnection(null)
    }
  }, [selectedConnection])

  // Wrapper function to match EnhancedWorkflowCanvas expected signature
  const handleConnectionCreateWrapper = useCallback((sourceId: string, targetId: string, label?: string) => {
    const connection: Omit<WorkflowConnection, 'id'> = {
      source: sourceId,
      target: targetId,
      type: "default",
      label: label || "",
      condition: "",
      conditions: {},
      metadata: {
        createdAt: new Date().toISOString(),
        priority: 1,
        description: ""
      }
    }
    handleConnectionCreate(connection)
  }, [handleConnectionCreate])

  // Template management
  const handleTemplateLoad = useCallback((templateId: string) => {
    const templates = WorkflowBusinessLogicService.getWorkflowTemplates()
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setNodes(template.nodes)
    setConnections(template.connections)
  }, [])

  // Configuration management
  const handleConfigurationChange = useCallback((configId: string) => {
    setSelectedConfiguration(configId)
    const config = WorkflowConfigurationManager.loadConfiguration(configId)
    if (config) {
      // Apply configuration rules to existing nodes
      setNodes(prev => prev.map(node => {
        const nodeConfig = config.nodeConfigurations[node.data.label.toLowerCase().replace(/\s+/g, '_')]
        if (nodeConfig) {
          return {
            ...node,
            data: {
              ...node.data,
              config: { ...node.data.config, ...nodeConfig }
            }
          }
        }
        return node
      }))
    }
  }, [])

  // Workflow operations
  const handleSave = useCallback(() => {
    const validation = WorkflowBusinessLogicService.validateWorkflow(nodes, connections)
    if (!validation.isValid) {
      // Log validation errors for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Workflow validation failed:', validation.errors)
      }
      // TODO: Show user-friendly error message in UI
      return
    }

    try {
      const workflow: UnifiedWorkflowDefinition = {
        id: generateId(),
        name: workflowName,
        description: workflowDescription,
        version: "1.0.0",
        nodes,
        connections,
        dataRequirements: {
          required: ["creditScore", "income", "debtToIncomeRatio"],
          optional: ["employmentHistory", "bankingHistory"],
          external: ["credit_bureau", "income_verification"]
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user"
        },
        status: "draft"
      }
      
      onSave?.(workflow)
    } catch (error) {
      // Handle save error with proper error service
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save workflow:', error)
      }
      // TODO: Integrate with error reporting service
    }
  }, [nodes, connections, workflowName, workflowDescription, onSave, generateId])

  const handleTest = useCallback(() => {
    const validation = WorkflowBusinessLogicService.validateWorkflow(nodes, connections)
    if (!validation.isValid) {
      // Log validation errors for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Cannot test invalid workflow:', validation.errors)
      }
      // TODO: Show user-friendly error message in UI
      return
    }

    try {
      const workflow: UnifiedWorkflowDefinition = {
        id: generateId(),
        name: workflowName,
        description: workflowDescription,
        version: "1.0.0",
        nodes,
        connections,
        dataRequirements: {
          required: ["creditScore", "income", "debtToIncomeRatio"],
          optional: ["employmentHistory", "bankingHistory"],
          external: ["credit_bureau", "income_verification"]
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user"
        },
        status: "draft"
      }
      
      onTest?.(workflow)
    } catch (error) {
      // Handle test error with proper error service
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to test workflow:', error)
      }
      // TODO: Integrate with error reporting service
    }
  }, [nodes, connections, workflowName, workflowDescription, onTest, generateId])

  // Current workflow for panels
  const currentWorkflow = useMemo((): WorkflowDefinition => ({
    id: initialWorkflow?.id || generateId(),
    name: workflowName,
    description: workflowDescription,
    version: initialWorkflow?.version || "1.0.0",
    nodes,
    connections,
    dataRequirements: initialWorkflow?.dataRequirements || {
      required: ["creditScore", "income", "debtToIncomeRatio"],
      optional: ["employmentHistory", "bankingHistory"],
      external: ["credit_bureau", "income_verification"]
    },
    metadata: initialWorkflow?.metadata || {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "user"
    },
    status: initialWorkflow?.status || "draft"
  }), [workflowName, workflowDescription, nodes, connections, initialWorkflow, generateId])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workflows">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{workflowName}</h1>
            <p className="text-sm text-muted-foreground">{workflowDescription}</p>
          </div>
          <Badge variant="outline">{mode}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="default" size="sm" onClick={handleTest}>
            <TestTube className="w-4 h-4 mr-2" />
            Test
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 m-4 mb-0">
              <TabsTrigger value="nodes">Nodes</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="logic">Logic</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="nodes" className="mt-0">
                <WorkflowNodeToolbox onNodeAdd={handleNodeAdd} />
              </TabsContent>
              
              <TabsContent value="templates" className="mt-0">
                <WorkflowTemplatePanel onTemplateLoad={handleTemplateLoad} />
              </TabsContent>
              
              <TabsContent value="logic" className="mt-0">
                <BusinessLogicPanel />
              </TabsContent>
              
              <TabsContent value="config" className="mt-0">
                <WorkflowConfigurationPanel
                  selectedConfiguration={selectedConfiguration}
                  onConfigurationChange={handleConfigurationChange}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-fit mx-4 mt-4">
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
              <TabsTrigger value="data">Data Sources</TabsTrigger>
              {mode === "enhanced" && (
                <TabsTrigger value="version">Version Control</TabsTrigger>
              )}
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="canvas" className="h-full m-0">
                <EnhancedWorkflowCanvas
                  nodes={nodes}
                  connections={connections}
                  selectedNode={selectedNode}
                  selectedConnection={selectedConnection}
                  onNodeSelect={setSelectedNode}
                  onConnectionSelect={setSelectedConnection}
                  onNodeUpdate={handleNodeUpdate}
                  onNodeDelete={handleNodeDelete}
                  onConnectionCreate={handleConnectionCreateWrapper}
                  onConnectionUpdate={handleConnectionUpdate}
                  onConnectionDelete={handleConnectionDelete}
                  mode={mode}
                />
              </TabsContent>
              
              <TabsContent value="rules" className="h-full m-0">
                <RuleConfigurationPanel
              nodes={nodes}
              onNodeUpdate={handleNodeUpdate}
              workflow={currentWorkflow}
              onWorkflowUpdate={(updates: Partial<WorkflowDefinition>) => {
                if (updates.nodes) setNodes(updates.nodes)
                if (updates.connections) setConnections(updates.connections)
              }}
            />
              </TabsContent>
              
              <TabsContent value="simulation" className="h-full m-0">
                <SimulationPanel
                  workflow={currentWorkflow}
                  businessLogicTemplates={WorkflowBusinessLogicService.getBusinessLogicTemplates()}
                />
              </TabsContent>
              
              <TabsContent value="data" className="h-full m-0">
                <DataSourcePanel
                  workflow={currentWorkflow}
                  onWorkflowUpdate={(updates) => {
                    if (updates.nodes) setNodes(updates.nodes)
                    if (updates.connections) setConnections(updates.connections)
                  }}
                />
              </TabsContent>
              
              {mode === "enhanced" && (
                <TabsContent value="version" className="h-full m-0">
                  <VersionControlPanel
                    workflowId={currentWorkflow.id || 'new-workflow'}
                    onVersionChange={(version) => {
                      // Handle version change if needed
                    }}
                    onCreateVersion={(versionData) => {
                      // Handle version creation if needed
                    }}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
})

UnifiedWorkflowBuilder.displayName = "UnifiedWorkflowBuilder"