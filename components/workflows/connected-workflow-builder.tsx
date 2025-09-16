"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Play, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  GitBranch,
  Workflow,
  Zap,
  Database,
  Shield,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from "lucide-react"
import { InteractiveWorkflowCanvas } from "./interactive-workflow-canvas"
import { ConnectionPropertiesPanel } from "./connection-properties-panel"
import { SimulationPanel } from "./simulation-panel"
import { DataSourcePanel } from "./data-source-panel"
import { WorkflowBusinessLogicService } from "@/lib/services/workflow-business-logic-service"
import { WorkflowConfigurationManager } from "@/lib/config/workflow-config"
import type { 
  UnifiedWorkflowNode, 
  WorkflowConnection,
  WorkflowBuilderMode,
  BusinessLogicTemplate,
  WorkflowTemplate 
} from "./unified-workflow-builder"

interface ConnectedWorkflowBuilderProps {
  mode?: WorkflowBuilderMode
  initialNodes?: UnifiedWorkflowNode[]
  initialConnections?: WorkflowConnection[]
  onSave?: (workflow: { nodes: UnifiedWorkflowNode[]; connections: WorkflowConnection[] }) => void
  onExecute?: (workflow: { nodes: UnifiedWorkflowNode[]; connections: WorkflowConnection[] }) => void
  className?: string
}

export function ConnectedWorkflowBuilder({
  mode = 'enhanced',
  initialNodes = [],
  initialConnections = [],
  onSave,
  onExecute,
  className = "",
}: ConnectedWorkflowBuilderProps) {
  const [nodes, setNodes] = useState<UnifiedWorkflowNode[]>(initialNodes)
  const [connections, setConnections] = useState<WorkflowConnection[]>(initialConnections)
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('canvas')
  const [selectedConfiguration, setSelectedConfiguration] = useState('loan_approval_config')

  // Get node templates and workflow templates from business logic service
  const nodeTemplates = useMemo(() => WorkflowBusinessLogicService.getNodeTemplates(), [])
  const workflowTemplates = useMemo(() => WorkflowBusinessLogicService.getWorkflowTemplates(), [])
  const businessLogicTemplates = useMemo(() => WorkflowBusinessLogicService.getBusinessLogicTemplates(), [])
  const configurations = useMemo(() => WorkflowConfigurationManager.getAllConfigurations(), [])

  // Generate unique IDs
  const generateId = useCallback(() => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Node management
  const handleNodeAdd = useCallback((position: { x: number; y: number }, template?: string) => {
    const templateKey = template || 'start'
    const nodeTemplate = nodeTemplates[templateKey]
    
    if (!nodeTemplate) return

    const newNode: UnifiedWorkflowNode = {
      ...nodeTemplate,
      id: generateId(),
      position,
    }

    setNodes(prev => [...prev, newNode])
  }, [generateId, nodeTemplates])

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ))
  }, [])

  // Update the handleNodeDelete callback to use undefined instead of null
  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    setConnections(prev => prev.filter(conn => 
      conn.source !== nodeId && conn.target !== nodeId
    ))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(undefined)
    }
  }, [selectedNodeId])

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<UnifiedWorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ))
  }, [])

  // Connection management
  const handleConnectionAdd = useCallback((connection: Omit<WorkflowConnection, 'id'>) => {
    const newConnection: WorkflowConnection = {
      ...connection,
      id: generateId(),
    }
    setConnections(prev => [...prev, newConnection])
  }, [generateId])

  const handleConnectionDelete = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId))
    if (selectedConnectionId === connectionId) {
      setSelectedConnectionId(null)
    }
  }, [selectedConnectionId])

  const handleConnectionUpdate = useCallback((connectionId: string, updates: Partial<WorkflowConnection>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, ...updates } : conn
    ))
  }, [])

  // Template management
  const handleTemplateLoad = useCallback((templateId: string) => {
    const template = workflowTemplates.find(t => t.id === templateId)
    if (!template) return

    setNodes(template.nodes)
    setConnections(template.connections)
  }, [workflowTemplates])

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

  // Workflow validation
  const validateWorkflow = useCallback(() => {
    return WorkflowBusinessLogicService.validateWorkflow(nodes, connections)
  }, [nodes, connections])

  // Save workflow
  const handleSave = useCallback(() => {
    const validation = validateWorkflow()
    if (!validation.isValid) {
      console.error('Workflow validation failed:', validation.errors)
      return
    }

    const workflow = { nodes, connections }
    onSave?.(workflow)
  }, [nodes, connections, onSave, validateWorkflow])

  // Execute workflow
  const handleExecute = useCallback(() => {
    const validation = validateWorkflow()
    if (!validation.isValid) {
      console.error('Cannot execute invalid workflow:', validation.errors)
      return
    }

    const workflow = { nodes, connections }
    onExecute?.(workflow)
  }, [nodes, connections, onExecute, validateWorkflow])

  // Get selected node
  const selectedNode = useMemo(() => 
    selectedNodeId ? nodes.find(node => node.id === selectedNodeId) || null : null
  , [selectedNodeId, nodes])

  // Get selected connection
  const selectedConnection = useMemo(() => 
    selectedConnectionId ? connections.find(conn => conn.id === selectedConnectionId) || null : null
  , [selectedConnectionId, connections])

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Connected Workflow Builder</h1>
          <Badge variant="outline">{mode}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Configuration Selector */}
          <select 
            value={selectedConfiguration}
            onChange={(e) => handleConfigurationChange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            {configurations.map(config => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
          
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="default" size="sm" onClick={handleExecute}>
            <Play className="w-4 h-4 mr-2" />
            Execute
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Toolbox */}
        <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
          <Tabs defaultValue="nodes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="nodes">Nodes</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="logic">Logic</TabsTrigger>
            </TabsList>
            
            <TabsContent value="nodes" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Node Types</h3>
                <div className="grid gap-2">
                  {Object.entries(nodeTemplates).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-3"
                      onClick={() => handleNodeAdd({ x: 200, y: 200 }, key)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{template.data.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.data.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Workflow Templates</h3>
                <div className="space-y-2">
                  {workflowTemplates.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:bg-muted/50">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleTemplateLoad(template.id)}
                        >
                          Load Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="logic" className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Business Logic</h3>
                <div className="space-y-2">
                  {businessLogicTemplates.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:bg-muted/50">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-fit mx-4 mt-4">
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
              <TabsTrigger value="data">Data Sources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="canvas" className="flex-1 m-0">
              <InteractiveWorkflowCanvas
                nodes={nodes}
                connections={connections}
                selectedNodeId={selectedNodeId}
                selectedConnectionId={selectedConnectionId}
                onNodeMove={handleNodeMove}
                onNodeSelect={(nodeId: string | null) => setSelectedNodeId(nodeId ?? undefined)}
                onNodeDelete={handleNodeDelete}
                onConnectionAdd={handleConnectionAdd}
                onConnectionSelect={setSelectedConnectionId}
                onConnectionDelete={handleConnectionDelete}
                onCanvasClick={() => {
                  setSelectedNodeId(undefined)
                  setSelectedConnectionId(null)
                }}
              />
            </TabsContent>
            
            <TabsContent value="simulation" className="flex-1 m-0">
              <SimulationPanel
                workflow={{ nodes, connections }}
                businessLogicTemplates={businessLogicTemplates}
              />
            </TabsContent>
            
            <TabsContent value="data" className="flex-1 m-0">
              <DataSourcePanel
                nodes={nodes}
                onNodeUpdate={handleNodeUpdate}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
          {selectedNode && (
            <div className="space-y-4">
              <h3 className="font-semibold">Node Properties</h3>
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">{selectedNode.data.label}</CardTitle>
                  <CardDescription className="text-xs">
                    {selectedNode.data.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium">Type</label>
                    <div className="text-sm text-muted-foreground">{selectedNode.type}</div>
                  </div>
                  
                  {selectedNode.data.config && Object.keys(selectedNode.data.config).length > 0 && (
                    <div>
                      <label className="text-xs font-medium">Configuration</label>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(selectedNode.data.config, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {selectedConnection && (
            <ConnectionPropertiesPanel
              connection={selectedConnection}
              onUpdate={(updates) => handleConnectionUpdate(selectedConnection.id, updates)}
            />
          )}
          
          {!selectedNode && !selectedConnection && (
            <div className="text-center text-muted-foreground">
              <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select a node or connection to view properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}