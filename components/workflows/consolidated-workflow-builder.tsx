/**
 * Consolidated Workflow Builder
 * 
 * A unified workflow builder that consolidates all previous builders into a single,
 * comprehensive component with modular architecture and clean separation of concerns.
 */

"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Save, 
  Play, 
  ArrowLeft, 
  Settings, 
  TestTube, 
  Database, 
  GitBranch, 
  Download, 
  Upload, 
  Zap, 
  Square,
  Workflow,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from "lucide-react"
import Link from "next/link"

// Import modular components
import { WorkflowCanvas } from "./workflow-canvas"
import { InteractiveWorkflowCanvas } from "./interactive-workflow-canvas"
import { RuleConfigurationPanel } from "./rule-configuration-panel"
import { SimulationPanel } from "./simulation-panel"
import { DataSourcePanel } from "./data-source-panel"
import { VersionControlPanel } from "./version-control-panel"
import { WorkflowNodeToolbox } from "./workflow-node-toolbox"
import { WorkflowTemplatePanel } from "./workflow-template-panel"
import { BusinessLogicPanel } from "./business-logic-panel"
import { WorkflowConfigurationPanel } from "./workflow-configuration-panel"
import { ConnectionPropertiesPanel } from "./connection-properties-panel"

// Import services
import { WorkflowBusinessLogicService } from "@/lib/services/workflow-business-logic-service"
import { WorkflowConfigurationManager } from "@/lib/config/workflow-config"
import { WorkflowDefinition } from "@/lib/services/enhanced-decision-service"

// Core interfaces
export interface ConsolidatedWorkflowNode {
  id: string
  type: "start" | "condition" | "action" | "end" | "data_source" | "rule_set" | "decision"
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    config?: any
    rules?: any[]
    dataSource?: string
    conditions?: any[]
    businessLogic?: string
    [key: string]: any
  }
}

export interface ConsolidatedWorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
  data?: any
}

export interface ConsolidatedWorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  nodes: ConsolidatedWorkflowNode[]
  connections: ConsolidatedWorkflowConnection[]
  dataRequirements?: {
    required: string[]
    optional: string[]
    external: string[]
  }
  metadata?: {
    created: string
    updated: string
    author: string
    tags: string[]
  }
}

export type WorkflowBuilderMode = "simple" | "enhanced" | "interactive"
export type WorkflowCanvasMode = "static" | "interactive"

interface ConsolidatedWorkflowBuilderProps {
  mode?: WorkflowBuilderMode
  canvasMode?: WorkflowCanvasMode
  initialWorkflow?: Partial<ConsolidatedWorkflowDefinition>
  onSave?: (workflow: ConsolidatedWorkflowDefinition) => void
  onTest?: (workflow: ConsolidatedWorkflowDefinition) => void
  onExecute?: (workflow: ConsolidatedWorkflowDefinition) => void
  showHeader?: boolean
  showSidebar?: boolean
  className?: string
}

/**
 * Default workflow configurations for different modes
 */
const DEFAULT_WORKFLOWS: Record<WorkflowBuilderMode, Partial<ConsolidatedWorkflowDefinition>> = {
  simple: {
    name: "Simple Workflow",
    description: "Basic workflow for simple decision processes",
    version: "1.0.0",
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 100 },
        data: { 
          label: "Application Received",
          description: "Starting point of the workflow"
        },
      }
    ],
    connections: [],
  },
  enhanced: {
    name: "Enhanced Decision Workflow",
    description: "Advanced workflow with business rules and data sources",
    version: "1.0.0",
    dataRequirements: {
      required: ["creditScore", "income", "debtToIncomeRatio"],
      optional: ["employmentHistory", "bankingHistory"],
      external: ["credit_bureau", "income_verification"]
    },
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 100 },
        data: { 
          label: "Application Received",
          description: "Starting point of the enhanced workflow"
        },
      }
    ],
    connections: [],
  },
  interactive: {
    name: "Interactive Workflow",
    description: "Interactive workflow with real-time collaboration",
    version: "1.0.0",
    dataRequirements: {
      required: ["creditScore", "income", "debtToIncomeRatio"],
      optional: ["employmentHistory", "bankingHistory"],
      external: ["credit_bureau", "income_verification"]
    },
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 100 },
        data: { 
          label: "Application Received",
          description: "Starting point of the interactive workflow"
        },
      }
    ],
    connections: [],
  }
}

/**
 * Consolidated Workflow Builder Component
 * 
 * This component unifies all previous workflow builders into a single, comprehensive
 * solution that supports multiple modes and canvas types while maintaining clean
 * separation of concerns through modular components.
 */
export function ConsolidatedWorkflowBuilder({ 
  mode = "enhanced",
  canvasMode = "interactive",
  initialWorkflow,
  onSave,
  onTest,
  onExecute,
  showHeader = true,
  showSidebar = true,
  className = ""
}: ConsolidatedWorkflowBuilderProps) {
  // Initialize workflow state
  const defaultWorkflow = DEFAULT_WORKFLOWS[mode]
  const [workflowName, setWorkflowName] = useState(
    initialWorkflow?.name || defaultWorkflow.name || "New Workflow"
  )
  const [workflowDescription, setWorkflowDescription] = useState(
    initialWorkflow?.description || defaultWorkflow.description || ""
  )
  const [workflowVersion, setWorkflowVersion] = useState(
    initialWorkflow?.version || defaultWorkflow.version || "1.0.0"
  )
  
  // Node and connection state
  const [nodes, setNodes] = useState<ConsolidatedWorkflowNode[]>(
    initialWorkflow?.nodes || defaultWorkflow.nodes || []
  )
  const [connections, setConnections] = useState<ConsolidatedWorkflowConnection[]>(
    initialWorkflow?.connections || defaultWorkflow.connections || []
  )
  
  // Selection state
  const [selectedNode, setSelectedNode] = useState<ConsolidatedWorkflowNode | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<ConsolidatedWorkflowConnection | null>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState("canvas")
  const [sidebarTab, setSidebarTab] = useState("nodes")
  const [selectedConfiguration, setSelectedConfiguration] = useState('loan_approval_config')

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

    const newNode: ConsolidatedWorkflowNode = {
      ...nodeTemplate,
      id: generateId(),
      position,
    }

    setNodes(prev => [...prev, newNode])
  }, [generateId])

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<ConsolidatedWorkflowNode>) => {
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

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ))
  }, [])

  const handleNodeSelect = useCallback((node: ConsolidatedWorkflowNode | null) => {
    setSelectedNode(node)
    setSelectedConnection(null) // Clear connection selection
  }, [])

  // Connection management
  const handleConnectionAdd = useCallback((connection: Omit<ConsolidatedWorkflowConnection, 'id'>) => {
    // Prevent duplicate connections
    const exists = connections.some(conn => 
      conn.source === connection.source && conn.target === connection.target
    )
    
    if (exists) return

    const newConnection: ConsolidatedWorkflowConnection = {
      ...connection,
      id: generateId(),
    }
    setConnections(prev => [...prev, newConnection])
  }, [connections, generateId])

  const handleConnectionUpdate = useCallback((connectionId: string, updates: Partial<ConsolidatedWorkflowConnection>) => {
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

  const handleConnectionSelect = useCallback((connection: ConsolidatedWorkflowConnection | null) => {
    setSelectedConnection(connection)
    setSelectedNode(null) // Clear node selection
  }, [])

  // Template management
  const handleTemplateLoad = useCallback((templateId: string) => {
    const templates = WorkflowBusinessLogicService.getWorkflowTemplates()
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setNodes(template.nodes)
    setConnections(template.connections)
    setSelectedNode(null)
    setSelectedConnection(null)
  }, [])

  // Configuration management
  const handleConfigurationChange = useCallback((configId: string) => {
    setSelectedConfiguration(configId)
    const config = WorkflowConfigurationManager.loadConfiguration(configId)
    if (config) {
      // Apply configuration rules to existing nodes
      setNodes(prev => prev.map(node => {
        const nodeConfig = config.nodeConfigurations?.[node.data.label.toLowerCase().replace(/\s+/g, '_')]
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
      console.error('Workflow validation failed:', validation.errors)
      return
    }

    const workflow: ConsolidatedWorkflowDefinition = {
      id: generateId(),
      name: workflowName,
      description: workflowDescription,
      version: workflowVersion,
      nodes,
      connections,
      dataRequirements: {
        required: ["creditScore", "income", "debtToIncomeRatio"],
        optional: ["employmentHistory", "bankingHistory"],
        external: ["credit_bureau", "income_verification"]
      },
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        author: "current_user",
        tags: [mode, "workflow"]
      }
    }
    
    onSave?.(workflow)
  }, [nodes, connections, workflowName, workflowDescription, workflowVersion, mode, onSave, generateId])

  const handleTest = useCallback(() => {
    const validation = WorkflowBusinessLogicService.validateWorkflow(nodes, connections)
    if (!validation.isValid) {
      console.error('Cannot test invalid workflow:', validation.errors)
      return
    }

    const workflow: ConsolidatedWorkflowDefinition = {
      id: generateId(),
      name: workflowName,
      description: workflowDescription,
      version: workflowVersion,
      nodes,
      connections,
      dataRequirements: {
        required: ["creditScore", "income", "debtToIncomeRatio"],
        optional: ["employmentHistory", "bankingHistory"],
        external: ["credit_bureau", "income_verification"]
      }
    }
    
    onTest?.(workflow)
  }, [nodes, connections, workflowName, workflowDescription, workflowVersion, onTest, generateId])

  const handleExecute = useCallback(() => {
    const validation = WorkflowBusinessLogicService.validateWorkflow(nodes, connections)
    if (!validation.isValid) {
      console.error('Cannot execute invalid workflow:', validation.errors)
      return
    }

    const workflow: ConsolidatedWorkflowDefinition = {
      id: generateId(),
      name: workflowName,
      description: workflowDescription,
      version: workflowVersion,
      nodes,
      connections,
      dataRequirements: {
        required: ["creditScore", "income", "debtToIncomeRatio"],
        optional: ["employmentHistory", "bankingHistory"],
        external: ["credit_bureau", "income_verification"]
      }
    }
    
    onExecute?.(workflow)
  }, [nodes, connections, workflowName, workflowDescription, workflowVersion, onExecute, generateId])

  // Current workflow for panels
  const currentWorkflow = useMemo((): ConsolidatedWorkflowDefinition => ({
    id: generateId(),
    name: workflowName,
    description: workflowDescription,
    version: workflowVersion,
    nodes,
    connections,
    dataRequirements: {
      required: ["creditScore", "income", "debtToIncomeRatio"],
      optional: ["employmentHistory", "bankingHistory"],
      external: ["credit_bureau", "income_verification"]
    }
  }), [workflowName, workflowDescription, workflowVersion, nodes, connections, generateId])

  // Workflow statistics
  const workflowStats = useMemo(() => {
    const nodeTypes = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalNodes: nodes.length,
      totalConnections: connections.length,
      nodeTypes,
      hasStart: nodes.some(n => n.type === 'start'),
      hasEnd: nodes.some(n => n.type === 'end'),
      isValid: nodes.length > 0 && connections.length > 0,
    }
  }, [nodes, connections])

  // Render canvas based on mode
  const renderCanvas = () => {
    const canvasProps = {
      nodes,
      connections,
      onNodeAdd: handleNodeAdd,
      onNodeUpdate: handleNodeUpdate,
      onNodeDelete: handleNodeDelete,
      onNodeSelect: handleNodeSelect,
      onNodeMove: handleNodeMove,
      onConnectionAdd: handleConnectionAdd,
      onConnectionUpdate: handleConnectionUpdate,
      onConnectionDelete: handleConnectionDelete,
      onConnectionSelect: handleConnectionSelect,
      selectedNode,
      selectedConnection,
    }

    if (canvasMode === "interactive") {
      return <InteractiveWorkflowCanvas {...canvasProps} />
    } else {
      return <WorkflowCanvas {...canvasProps} />
    }
  }

  return (
    <div className={`flex flex-col h-screen bg-background ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/workflows">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Workflow className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">{workflowName}</h1>
                <p className="text-sm text-muted-foreground">{workflowDescription}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{mode}</Badge>
                <Badge variant="secondary">{canvasMode}</Badge>
              </div>
            </div>
            
            {/* Workflow Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Square className="w-3 h-3" />
                {workflowStats.totalNodes} nodes
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {workflowStats.totalConnections} connections
              </div>
              <div className="flex items-center gap-1">
                {workflowStats.isValid ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-500" />
                )}
                {workflowStats.isValid ? "Valid" : "Invalid"}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleTest}>
              <TestTube className="w-4 h-4 mr-2" />
              Test
            </Button>
            {onExecute && (
              <Button variant="default" size="sm" onClick={handleExecute}>
                <Play className="w-4 h-4 mr-2" />
                Execute
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {showSidebar && (
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
        )}

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
              {(selectedConnection || selectedNode) && (
                <TabsTrigger value="properties">Properties</TabsTrigger>
              )}
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="canvas" className="h-full m-0">
                {renderCanvas()}
              </TabsContent>
              
              <TabsContent value="rules" className="h-full m-0">
                <RuleConfigurationPanel
                  workflow={currentWorkflow}
                  selectedNode={selectedNode}
                  onWorkflowUpdate={(updates) => {
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
                  nodes={nodes}
                  onNodeUpdate={handleNodeUpdate}
                />
              </TabsContent>
              
              {mode === "enhanced" && (
                <TabsContent value="version" className="h-full m-0">
                  <VersionControlPanel
                    workflow={currentWorkflow}
                    onWorkflowUpdate={(updates) => {
                      if (updates.nodes) setNodes(updates.nodes)
                      if (updates.connections) setConnections(updates.connections)
                    }}
                  />
                </TabsContent>
              )}
              
              {(selectedConnection || selectedNode) && (
                <TabsContent value="properties" className="h-full m-0">
                  <ConnectionPropertiesPanel
                    selectedNode={selectedNode}
                    selectedConnection={selectedConnection}
                    onNodeUpdate={handleNodeUpdate}
                    onConnectionUpdate={handleConnectionUpdate}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Export for backward compatibility
export { ConsolidatedWorkflowBuilder as WorkflowBuilder }
export type { 
  ConsolidatedWorkflowNode as WorkflowNode,
  ConsolidatedWorkflowConnection as WorkflowConnection,
  ConsolidatedWorkflowDefinition as WorkflowDefinition
}