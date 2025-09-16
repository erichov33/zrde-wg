"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WorkflowCanvas } from "./workflow-canvas"
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
import { WorkflowDefinition } from "@/lib/services/enhanced-decision-service"
import { RuleSet, Rule } from "@/lib/engines/rule-engine"
import { WorkflowBusinessLogicService } from "@/lib/services/workflow-business-logic-service"
import { WorkflowConfigurationManager } from "@/lib/config/workflow-config"

// Unified node interface that supports both simple and enhanced workflows
export interface UnifiedWorkflowNode {
  id: string
  type: "start" | "condition" | "action" | "end" | "data_source" | "rule_set" | "decision"
  position: { x: number; y: number }
  data: {
    label: string
    config?: any
    rules?: Rule[]
    dataSource?: string
    conditions?: any[]
    businessLogic?: string // Reference to business logic function
  }
}

export interface WorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
}

export interface WorkflowBuilderProps {
  mode?: "simple" | "enhanced"
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
const DEFAULT_WORKFLOWS = {
  simple: {
    name: "Simple Workflow",
    description: "Basic workflow for simple decision processes",
    nodes: [
      {
        id: "start-1",
        type: "start" as const,
        position: { x: 100, y: 100 },
        data: { label: "Application Received" },
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
        type: "start" as const,
        position: { x: 100, y: 100 },
        data: { label: "Application Received" },
      }
    ],
    connections: [],
  }
} as const

/**
 * Unified Workflow Builder Component
 * 
 * A comprehensive workflow builder that supports both simple and enhanced modes:
 * - Simple mode: Basic drag-and-drop workflow creation
 * - Enhanced mode: Advanced features with business rules, data sources, and testing
 */
export function UnifiedWorkflowBuilder({ 
  mode = "enhanced", 
  initialWorkflow,
  onSave,
  onTest 
}: WorkflowBuilderProps) {
  // Core workflow state
  const [workflowName, setWorkflowName] = useState(
    initialWorkflow?.name || DEFAULT_WORKFLOWS[mode].name
  )
  const [workflowDescription, setWorkflowDescription] = useState(
    initialWorkflow?.description || DEFAULT_WORKFLOWS[mode].description
  )
  const [selectedNode, setSelectedNode] = useState<UnifiedWorkflowNode | null>(null)
  const [nodes, setNodes] = useState<UnifiedWorkflowNode[]>(
    initialWorkflow?.nodes || DEFAULT_WORKFLOWS[mode].nodes
  )
  const [connections, setConnections] = useState<WorkflowConnection[]>(
    initialWorkflow?.connections || DEFAULT_WORKFLOWS[mode].connections
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

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<UnifiedWorkflowNode>) => {
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
      console.error('Workflow validation failed:', validation.errors)
      return
    }

    const workflow: WorkflowDefinition = {
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
      }
    }
    
    onSave?.(workflow)
  }, [nodes, connections, workflowName, workflowDescription, onSave, generateId])

  const handleTest = useCallback(() => {
    const validation = WorkflowBusinessLogicService.validateWorkflow(nodes, connections)
    if (!validation.isValid) {
      console.error('Cannot test invalid workflow:', validation.errors)
      return
    }

    const workflow: WorkflowDefinition = {
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
      }
    }
    
    onTest?.(workflow)
  }, [nodes, connections, workflowName, workflowDescription, onTest, generateId])

  // Current workflow for panels
  const currentWorkflow = useMemo(() => ({
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
    }
  }), [workflowName, workflowDescription, nodes, connections, generateId])

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
                <WorkflowCanvas
                  nodes={nodes}
                  connections={connections}
                  onNodeAdd={handleNodeAdd}
                  onNodeUpdate={handleNodeUpdate}
                  onNodeDelete={handleNodeDelete}
                  onNodeSelect={setSelectedNode}
                  onConnectionAdd={handleConnectionAdd}
                  selectedNode={selectedNode}
                />
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
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}