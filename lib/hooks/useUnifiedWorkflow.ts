/**
 * Unified Workflow Hook
 * 
 * This hook consolidates all workflow state management and replaces
 * the multiple competing hooks with a single, comprehensive solution.
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { 
  WorkflowConfig, 
  WorkflowNode, 
  WorkflowConnection, 
  WorkflowState, 
  WorkflowActions,
  Position,
  NodeType,
  ConnectionType
} from "@/lib/types/unified-workflow"
import { workflowService } from "@/lib/services/unified-workflow-service"

interface UseUnifiedWorkflowOptions {
  workflowId?: string
  autoSave?: boolean
  autoSaveDelay?: number
}

export function useUnifiedWorkflow(options: UseUnifiedWorkflowOptions = {}) {
  const { workflowId, autoSave = false, autoSaveDelay = 2000 } = options
  
  // State
  const [state, setState] = useState<WorkflowState>({
    workflow: null,
    selectedNode: null,
    connectionPreview: null,
    isLoading: false,
    error: null,
    isDirty: false
  })

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout>()

  // Auto-save effect
  useEffect(() => {
    if (autoSave && state.isDirty && state.workflow) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
      
      autoSaveTimer.current = setTimeout(() => {
        actions.saveWorkflow()
      }, autoSaveDelay)
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [state.isDirty, state.workflow, autoSave, autoSaveDelay])

  // Load workflow on mount
  useEffect(() => {
    if (workflowId) {
      actions.loadWorkflow(workflowId)
    } else {
      // Create new workflow
      const newWorkflow = workflowService.createDefaultWorkflow()
      setState(prev => ({ ...prev, workflow: newWorkflow }))
    }
  }, [workflowId])

  // Actions
  const actions: WorkflowActions = {
    // Workflow operations
    loadWorkflow: useCallback(async (id: string) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        const workflow = await workflowService.getWorkflow(id)
        setState(prev => ({ 
          ...prev, 
          workflow, 
          isLoading: false, 
          isDirty: false 
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : "Failed to load workflow",
          isLoading: false 
        }))
      }
    }, []),

    saveWorkflow: useCallback(async (workflow?: WorkflowConfig) => {
      const workflowToSave = workflow || state.workflow
      if (!workflowToSave) return

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const savedWorkflow = await workflowService.saveWorkflow(workflowToSave)
        setState(prev => ({ 
          ...prev, 
          workflow: savedWorkflow, 
          isLoading: false, 
          isDirty: false 
        }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : "Failed to save workflow",
          isLoading: false 
        }))
      }
    }, [state.workflow]),

    updateWorkflow: useCallback((updates: Partial<WorkflowConfig>) => {
      setState(prev => {
        if (!prev.workflow) return prev
        
        return {
          ...prev,
          workflow: { ...prev.workflow, ...updates },
          isDirty: true
        }
      })
    }, []),

    // Node operations
    addNode: useCallback((type: NodeType, position: Position) => {
      setState(prev => {
        if (!prev.workflow) return prev

        const newNode: WorkflowNode = {
          id: `${type}-${Date.now()}`,
          type,
          position,
          data: { label: `New ${type}` },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: "1.0"
          }
        }

        return {
          ...prev,
          workflow: {
            ...prev.workflow,
            nodes: [...prev.workflow.nodes, newNode]
          },
          isDirty: true
        }
      })
    }, []),

    updateNode: useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
      setState(prev => {
        if (!prev.workflow) return prev

        return {
          ...prev,
          workflow: {
            ...prev.workflow,
            nodes: prev.workflow.nodes.map(node =>
              node.id === nodeId 
                ? { 
                    ...node, 
                    ...updates,
                    metadata: {
                      ...node.metadata,
                      updatedAt: new Date().toISOString(),
                      version: node.metadata?.version ? 
                        `${parseFloat(node.metadata.version) + 0.1}` : 
                        "1.1"
                    }
                  }
                : node
            )
          },
          selectedNode: prev.selectedNode?.id === nodeId 
            ? { ...prev.selectedNode, ...updates } 
            : prev.selectedNode,
          isDirty: true
        }
      })
    }, []),

    deleteNode: useCallback((nodeId: string) => {
      setState(prev => {
        if (!prev.workflow) return prev

        return {
          ...prev,
          workflow: {
            ...prev.workflow,
            nodes: prev.workflow.nodes.filter(node => node.id !== nodeId),
            connections: prev.workflow.connections.filter(conn => 
              conn.source !== nodeId && conn.target !== nodeId
            )
          },
          selectedNode: prev.selectedNode?.id === nodeId ? null : prev.selectedNode,
          isDirty: true
        }
      })
    }, []),

    moveNode: useCallback((nodeId: string, position: Position) => {
      actions.updateNode(nodeId, { position })
    }, []),

    selectNode: useCallback((nodeId: string | null) => {
      setState(prev => {
        if (!prev.workflow) return prev

        const selectedNode = nodeId 
          ? prev.workflow.nodes.find(node => node.id === nodeId) || null
          : null

        return { ...prev, selectedNode }
      })
    }, []),

    // Connection operations
    createConnection: useCallback((source: string, target: string, type: ConnectionType = "default") => {
      setState(prev => {
        if (!prev.workflow) return prev

        const newConnection: WorkflowConnection = {
          id: `connection-${Date.now()}`,
          source,
          target,
          type
        }

        return {
          ...prev,
          workflow: {
            ...prev.workflow,
            connections: [...prev.workflow.connections, newConnection]
          },
          connectionPreview: null,
          isDirty: true
        }
      })
    }, []),

    deleteConnection: useCallback((connectionId: string) => {
      setState(prev => {
        if (!prev.workflow) return prev

        return {
          ...prev,
          workflow: {
            ...prev.workflow,
            connections: prev.workflow.connections.filter(conn => conn.id !== connectionId)
          },
          isDirty: true
        }
      })
    }, []),

    startConnection: useCallback((nodeId: string, position: Position) => {
      setState(prev => ({
        ...prev,
        connectionPreview: {
          startNodeId: nodeId,
          currentPosition: position
        }
      }))
    }, []),

    endConnection: useCallback((nodeId?: string) => {
      setState(prev => {
        if (!prev.connectionPreview) return prev

        if (nodeId && nodeId !== prev.connectionPreview.startNodeId) {
          // Create the connection
          actions.createConnection(prev.connectionPreview.startNodeId, nodeId)
        }

        return {
          ...prev,
          connectionPreview: null
        }
      })
    }, []),

    updateConnectionPreview: useCallback((position: Position) => {
      setState(prev => {
        if (!prev.connectionPreview) return prev

        return {
          ...prev,
          connectionPreview: {
            ...prev.connectionPreview,
            currentPosition: position
          }
        }
      })
    }, []),

    // Utility operations
    clearError: useCallback(() => {
      setState(prev => ({ ...prev, error: null }))
    }, []),

    resetWorkflow: useCallback(() => {
      const newWorkflow = workflowService.createDefaultWorkflow()
      setState(prev => ({ 
        ...prev, 
        workflow: newWorkflow, 
        selectedNode: null, 
        connectionPreview: null,
        isDirty: false,
        error: null
      }))
    }, [])
  }

  return {
    // State
    workflow: state.workflow,
    nodes: state.workflow?.nodes || [],
    connections: state.workflow?.connections || [],
    selectedNode: state.selectedNode,
    connectionPreview: state.connectionPreview,
    isLoading: state.isLoading,
    error: state.error,
    isDirty: state.isDirty,
    
    // Actions
    actions
  }
}