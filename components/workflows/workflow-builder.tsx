"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { WorkflowCanvas } from "./workflow-canvas"
import { WorkflowToolbox } from "./workflow-toolbox"
import { WorkflowProperties } from "./workflow-properties"
import { Save, Play, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

// Type definitions for workflow components
export interface WorkflowNode {
  id: string
  type: "start" | "condition" | "action" | "end"
  position: { x: number; y: number }
  data: {
    label: string
    config?: any
  }
}

export interface WorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
}

// Constants for default values
const DEFAULT_WORKFLOW_NAME = "New Workflow"
const DEFAULT_NODE_POSITION = { x: 300, y: 200 }
const INITIAL_START_NODE: WorkflowNode = {
  id: "start-1",
  type: "start",
  position: { x: 100, y: 100 },
  data: { label: "Application Received" },
}

/**
 * WorkflowBuilder Component
 * 
 * A drag-and-drop workflow builder interface that allows users to:
 * - Create and edit workflow nodes
 * - Connect nodes to define workflow logic
 * - Configure node properties
 * - Save and test workflows
 */
export function WorkflowBuilder() {
  // State management
  const [workflowName, setWorkflowName] = useState(DEFAULT_WORKFLOW_NAME)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [nodes, setNodes] = useState<WorkflowNode[]>([INITIAL_START_NODE])
  const [connections, setConnections] = useState<WorkflowConnection[]>([])

  /**
   * Adds a new node to the workflow
   * @param type - The type of node to add
   * @param label - The display label for the node
   */
  const handleAddNode = useCallback((type: WorkflowNode["type"], label: string) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: DEFAULT_NODE_POSITION,
      data: { label },
    }
    setNodes(prevNodes => [...prevNodes, newNode])
  }, [])

  /**
   * Updates an existing node with new properties
   * @param nodeId - The ID of the node to update
   * @param updates - Partial node data to merge
   */
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    )
  }, [])

  /**
   * Deletes a node and all its connections
   * @param nodeId - The ID of the node to delete
   */
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId))
    
    // Remove all connections involving this node
    setConnections(prevConnections => 
      prevConnections.filter(conn => 
        conn.source !== nodeId && conn.target !== nodeId
      )
    )
    
    // Clear selection if the deleted node was selected
    setSelectedNode(prevSelected => 
      prevSelected?.id === nodeId ? null : prevSelected
    )
  }, [])

  /**
   * Handles workflow name changes
   * @param event - Input change event
   */
  const handleWorkflowNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setWorkflowName(event.target.value)
  }, [])

  /**
   * Renders the header section with navigation and actions
   */
  const renderHeader = () => (
    <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left section: Navigation and title */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard/workflows">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Workflows
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Input
              value={workflowName}
              onChange={handleWorkflowNameChange}
              className="font-bold bg-transparent border-none text-2xl p-0 h-auto focus-visible:ring-0 text-slate-900 dark:text-slate-100"
              placeholder="Enter workflow name"
            />
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
              Draft
            </Badge>
          </div>
        </div>

        {/* Right section: Action buttons */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 transition-all duration-200"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 bg-white/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
          >
            <Play className="h-4 w-4" />
            Test
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  )

  /**
   * Renders the main content area with toolbox, canvas, and properties panel
   */
  const renderMainContent = () => (
    <div className="flex-1 flex">
      {/* Toolbox Panel */}
      <div className="w-64 border-r border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <WorkflowToolbox onAddNode={handleAddNode} />
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30">
        <WorkflowCanvas
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
          onNodeUpdate={handleUpdateNode}
          onNodeDelete={handleDeleteNode}
        />
      </div>

      {/* Properties Panel */}
      <div className="w-80 border-l border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <WorkflowProperties 
          selectedNode={selectedNode} 
          onNodeUpdate={handleUpdateNode} 
        />
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {renderHeader()}
      {renderMainContent()}
    </div>
  )
}
