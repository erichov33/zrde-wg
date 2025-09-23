"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { WorkflowCanvas } from "./canvas/WorkflowCanvas"
import { WorkflowToolbox } from "./workflow-toolbox"
import { WorkflowPropertiesPanel } from "./panels/WorkflowPropertiesPanel"
import { Save, Play, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { useUnifiedWorkflow } from "@/lib/hooks/useUnifiedWorkflow"
import { useWorkflowCanvas } from "@/lib/hooks/useWorkflowCanvas"
import { workflowService } from "@/lib/services/unified-workflow-service"
import { WorkflowConnection, WorkflowConfig, WorkflowMode } from "@/lib/types/unified-workflow"

interface UnifiedWorkflowSystemProps {
  workflowId?: string
  mode?: "basic" | "enhanced" | "enterprise"
  readonly?: boolean
  onSave?: (workflow: WorkflowConfig) => void
  onExecute?: (workflow: WorkflowConfig) => void
}

/**
 * Unified Workflow System
 * 
 * A single, comprehensive workflow builder that replaces all duplicate components.
 * Supports multiple modes and configurations through props rather than separate components.
 */
export function UnifiedWorkflowSystem({
  workflowId,
  mode = "basic",
  readonly = false,
  onSave,
  onExecute
}: UnifiedWorkflowSystemProps) {
  // Local state for selectedConnection (not provided by useUnifiedWorkflow)
  const [selectedConnection, setSelectedConnection] = useState<WorkflowConnection | null>(null)

  // Unified state management using custom hook
  const {
    workflow,
    nodes,
    connections,
    selectedNode,
    isLoading,
    error,
    actions
  } = useUnifiedWorkflow({ workflowId })

  const {
    scale,
    offset,
    isDragging,
    dragStart,
    selectedArea,
    isConnecting,
    connectionStart,
    connectionPreview,
    actions: canvasActions,
    transform,
    canvasRef
  } = useWorkflowCanvas(nodes)

  // Connection handlers
  const handleConnectionSelect = useCallback((connectionId: string | null) => {
    const connection = connectionId 
      ? connections.find(conn => conn.id === connectionId) || null
      : null
    setSelectedConnection(connection)
  }, [connections])

  const handleConnectionUpdate = useCallback((connectionId: string, updates: Partial<WorkflowConnection>) => {
    // Update the connection in the workflow
    if (selectedConnection?.id === connectionId) {
      setSelectedConnection(prev => prev ? { ...prev, ...updates } : null)
    }
    // Note: The actual connection update should be handled by the workflow service
    // This is just for UI state consistency
  }, [selectedConnection])

  const handleConnectionDelete = useCallback((connectionId: string) => {
    if (selectedConnection?.id === connectionId) {
      setSelectedConnection(null)
    }
    actions.deleteConnection(connectionId)
  }, [selectedConnection, actions])

  // Event handlers
  const handleSave = useCallback(async () => {
    if (!workflow) return
    
    try {
      await actions.saveWorkflow()
      if (onSave) {
        // Convert WorkflowDefinition to WorkflowConfig
        const workflowConfig: WorkflowConfig = {
          ...workflow,
          mode: "simple" as const,
          settings: {
            autoSave: true,
            validation: true,
            execution: {
              timeout: 30000,
              retries: 3
            }
          }
        }
        onSave(workflowConfig)
      }
    } catch (error) {
      console.error("Failed to save workflow:", error)
    }
  }, [workflow, actions, onSave])

  const handleExecute = useCallback(async () => {
    if (!workflow) return
    
    try {
      await workflowService.executeWorkflow(workflow.id)
      if (onExecute) {
        // Convert WorkflowDefinition to WorkflowConfig
        const workflowConfig: WorkflowConfig = {
          ...workflow,
          mode: "simple" as const,
          settings: {
            autoSave: true,
            validation: true,
            execution: {
              timeout: 30000,
              retries: 3
            }
          }
        }
        onExecute(workflowConfig)
      }
    } catch (error) {
      console.error("Failed to execute workflow:", error)
    }
  }, [workflow, onExecute])

  // Wrapper function to adapt between WorkflowToolbox and actions.addNode signatures
  const handleAddNode = useCallback((type: "start" | "condition" | "action" | "end", label: string) => {
    // Generate a position for the new node (center of canvas with some randomization)
    const position = {
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 200
    }
    actions.addNode(type as any, position)
  }, [actions])

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading workflow...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/workflows">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Input
              value={workflow?.name || ""}
              onChange={(e) => actions.updateWorkflow({ name: e.target.value })}
              className="text-lg font-semibold border-none bg-transparent"
              placeholder="Workflow Name"
              disabled={readonly}
            />
            <Badge variant="outline">{mode}</Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={readonly}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={handleExecute}>
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 pt-20">
        {/* Toolbox */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <WorkflowToolbox
            onAddNode={handleAddNode}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            selectedNode={selectedNode}
            selectedConnection={null}
            canvasState={{
              scale,
              offset,
              isDragging,
              dragStart,
              selectedArea,
              isConnecting,
              connectionStart,
              connectionPreview,
              actions: canvasActions,
              transform,
              canvasRef
            }}
            onNodeSelect={actions.selectNode}
            onNodeUpdate={actions.updateNode}
            onNodeDelete={actions.deleteNode}
            onConnectionSelect={handleConnectionSelect}
            onConnectionUpdate={handleConnectionUpdate}
            onConnectionDelete={handleConnectionDelete}
            mode={mode === "basic" ? "simple" : mode === "enterprise" ? "advanced" : "enhanced"}
          />
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <WorkflowPropertiesPanel
              selectedNode={selectedNode}
              onUpdateNode={actions.updateNode}
              mode={mode === "basic" ? "simple" : mode === "enterprise" ? "advanced" : "enhanced"}
            />
          </div>
        )}
      </div>
    </div>
  )
}