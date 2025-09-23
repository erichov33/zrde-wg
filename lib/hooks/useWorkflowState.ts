import { useState, useCallback, useMemo } from 'react'
import { 
  BaseWorkflowNode, 
  WorkflowConnection, 
  WorkflowDefinition,
  CreateNodeData,
  CreateConnectionData 
} from '@/lib/types/workflow'

export interface WorkflowState {
  workflow: WorkflowDefinition | null
  nodes: BaseWorkflowNode[]
  connections: WorkflowConnection[]
  selectedNode: BaseWorkflowNode | null
  selectedConnection: WorkflowConnection | null
  isDirty: boolean
  isLoading: boolean
  error: string | null
}

export interface WorkflowActions {
  // Node operations
  addNode: (nodeData: CreateNodeData) => void
  updateNode: (nodeId: string, updates: Partial<BaseWorkflowNode>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  moveNode: (nodeId: string, position: { x: number; y: number }) => void
  
  // Connection operations
  addConnection: (connectionData: CreateConnectionData) => void
  updateConnection: (connectionId: string, updates: Partial<WorkflowConnection>) => void
  deleteConnection: (connectionId: string) => void
  selectConnection: (connectionId: string | null) => void
  
  // Workflow operations
  loadWorkflow: (workflow: WorkflowDefinition) => void
  saveWorkflow: () => Promise<void>
  resetWorkflow: () => void
  validateWorkflow: () => ValidationResult[]
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearSelection: () => void
}

export interface ValidationResult {
  type: 'error' | 'warning'
  message: string
  nodeId?: string
  connectionId?: string
}

const initialState: WorkflowState = {
  workflow: null,
  nodes: [],
  connections: [],
  selectedNode: null,
  selectedConnection: null,
  isDirty: false,
  isLoading: false,
  error: null
}

export function useWorkflowState(initialWorkflow?: WorkflowDefinition) {
  const [state, setState] = useState<WorkflowState>(() => ({
    ...initialState,
    workflow: initialWorkflow || null,
    nodes: initialWorkflow?.nodes || [],
    connections: initialWorkflow?.connections || []
  }))

  // Node operations
  const addNode = useCallback((nodeData: CreateNodeData) => {
    const newNode: BaseWorkflowNode = {
      ...nodeData,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0'
      }
    }

    setState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      isDirty: true,
      error: null
    }))
  }, [])

  const updateNode = useCallback((nodeId: string, updates: Partial<BaseWorkflowNode>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              ...updates,
              metadata: {
                ...node.metadata,
                ...updates.metadata,
                createdAt: node.metadata?.createdAt || new Date(),
                updatedAt: new Date(),
                version: node.metadata?.version || updates.metadata?.version || '1.0.0'
              }
            }
          : node
      ),
      selectedNode: prev.selectedNode?.id === nodeId 
        ? { ...prev.selectedNode, ...updates }
        : prev.selectedNode,
      isDirty: true,
      error: null
    }))
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(
        conn => conn.source !== nodeId && conn.target !== nodeId
      ),
      selectedNode: prev.selectedNode?.id === nodeId ? null : prev.selectedNode,
      isDirty: true,
      error: null
    }))
  }, [])

  const selectNode = useCallback((nodeId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedNode: nodeId ? prev.nodes.find(node => node.id === nodeId) || null : null,
      selectedConnection: null
    }))
  }, [])

  const moveNode = useCallback((nodeId: string, position: { x: number; y: number }) => {
    updateNode(nodeId, { position })
  }, [updateNode])

  // Connection operations
  const addConnection = useCallback((connectionData: CreateConnectionData) => {
    const newConnection: WorkflowConnection = {
      ...connectionData,
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdAt: new Date()
      }
    }

    setState(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      isDirty: true,
      error: null
    }))
  }, [])

  const updateConnection = useCallback((connectionId: string, updates: Partial<WorkflowConnection>) => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.map(conn => 
        conn.id === connectionId ? { ...conn, ...updates } : conn
      ),
      selectedConnection: prev.selectedConnection?.id === connectionId 
        ? { ...prev.selectedConnection, ...updates }
        : prev.selectedConnection,
      isDirty: true,
      error: null
    }))
  }, [])

  const deleteConnection = useCallback((connectionId: string) => {
    setState(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId),
      selectedConnection: prev.selectedConnection?.id === connectionId ? null : prev.selectedConnection,
      isDirty: true,
      error: null
    }))
  }, [])

  const selectConnection = useCallback((connectionId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedConnection: connectionId 
        ? prev.connections.find(conn => conn.id === connectionId) || null 
        : null,
      selectedNode: null
    }))
  }, [])

  // Workflow operations
  const loadWorkflow = useCallback((workflow: WorkflowDefinition) => {
    setState(prev => ({
      ...prev,
      workflow,
      nodes: workflow.nodes,
      connections: workflow.connections,
      selectedNode: null,
      selectedConnection: null,
      isDirty: false,
      error: null
    }))
  }, [])

  const saveWorkflow = useCallback(async () => {
    if (!state.workflow) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const updatedWorkflow: WorkflowDefinition = {
        ...state.workflow,
        nodes: state.nodes,
        connections: state.connections,
        metadata: {
          ...state.workflow.metadata,
          updatedAt: new Date(),
          updatedBy: 'current_user' // This should come from auth context
        }
      }

      // Here you would call your API to save the workflow
      // await workflowService.saveWorkflow(updatedWorkflow)

      setState(prev => ({
        ...prev,
        workflow: updatedWorkflow,
        isDirty: false,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save workflow',
        isLoading: false
      }))
    }
  }, [state.workflow, state.nodes, state.connections])

  const resetWorkflow = useCallback(() => {
    setState(initialState)
  }, [])

  const validateWorkflow = useCallback((): ValidationResult[] => {
    const results: ValidationResult[] = []

    // Check for start node
    const startNodes = state.nodes.filter(node => node.type === 'start')
    if (startNodes.length === 0) {
      results.push({
        type: 'error',
        message: 'Workflow must have at least one start node'
      })
    } else if (startNodes.length > 1) {
      results.push({
        type: 'warning',
        message: 'Workflow has multiple start nodes'
      })
    }

    // Check for end nodes
    const endNodes = state.nodes.filter(node => node.type === 'end')
    if (endNodes.length === 0) {
      results.push({
        type: 'error',
        message: 'Workflow must have at least one end node'
      })
    }

    // Check for orphaned nodes
    state.nodes.forEach(node => {
      if (node.type !== 'start') {
        const hasIncomingConnection = state.connections.some(conn => conn.target === node.id)
        if (!hasIncomingConnection) {
          results.push({
            type: 'warning',
            message: `Node "${node.data.label}" has no incoming connections`,
            nodeId: node.id
          })
        }
      }

      if (node.type !== 'end') {
        const hasOutgoingConnection = state.connections.some(conn => conn.source === node.id)
        if (!hasOutgoingConnection) {
          results.push({
            type: 'warning',
            message: `Node "${node.data.label}" has no outgoing connections`,
            nodeId: node.id
          })
        }
      }
    })

    // Check for invalid connections
    state.connections.forEach(connection => {
      const sourceNode = state.nodes.find(node => node.id === connection.source)
      const targetNode = state.nodes.find(node => node.id === connection.target)

      if (!sourceNode) {
        results.push({
          type: 'error',
          message: 'Connection has invalid source node',
          connectionId: connection.id
        })
      }

      if (!targetNode) {
        results.push({
          type: 'error',
          message: 'Connection has invalid target node',
          connectionId: connection.id
        })
      }
    })

    return results
  }, [state.nodes, state.connections])

  // State management
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedNode: null,
      selectedConnection: null
    }))
  }, [])

  // Computed values
  const canSave = useMemo(() => {
    return state.isDirty && !state.isLoading && state.nodes.length > 0
  }, [state.isDirty, state.isLoading, state.nodes.length])

  const validationResults = useMemo(() => {
    return validateWorkflow()
  }, [validateWorkflow])

  const hasErrors = useMemo(() => {
    return validationResults.some(result => result.type === 'error')
  }, [validationResults])

  const actions: WorkflowActions = {
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    moveNode,
    addConnection,
    updateConnection,
    deleteConnection,
    selectConnection,
    loadWorkflow,
    saveWorkflow,
    resetWorkflow,
    validateWorkflow,
    setLoading,
    setError,
    clearSelection
  }

  return {
    ...state,
    actions,
    canSave,
    validationResults,
    hasErrors
  }
}