import { useState, useCallback, useRef, useMemo } from 'react'
import { WorkflowNode, WorkflowConnection } from '@/lib/types/unified-workflow'
import { BaseWorkflowNode } from '@/lib/types/workflow'

export interface CanvasState {
  scale: number
  offset: { x: number; y: number }
  isDragging: boolean
  dragStart: { x: number; y: number } | null
  selectedArea: { start: { x: number; y: number }; end: { x: number; y: number } } | null
  isConnecting: boolean
  connectionStart: string | null
  connectionPreview: { x: number; y: number } | null
}

export interface CanvasActions {
  // Zoom and pan
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setScale: (scale: number) => void
  pan: (deltaX: number, deltaY: number) => void
  centerView: (nodes: WorkflowNode[]) => void
  
  // Drag operations
  startDrag: (x: number, y: number) => void
  updateDrag: (x: number, y: number) => void
  endDrag: () => void
  
  // Selection
  startAreaSelection: (x: number, y: number) => void
  updateAreaSelection: (x: number, y: number) => void
  endAreaSelection: () => string[]
  
  // Connection creation
  startConnection: (nodeId: string) => void
  updateConnectionPreview: (x: number, y: number) => void
  endConnection: (targetNodeId?: string) => void
  
  // Coordinate conversion
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number }
  canvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number }
}

const initialState: CanvasState = {
  scale: 1,
  offset: { x: 0, y: 0 },
  isDragging: false,
  dragStart: null,
  selectedArea: null,
  isConnecting: false,
  connectionStart: null,
  connectionPreview: null
}

export function useWorkflowCanvas(
  nodes: WorkflowNode[],
  onConnectionCreate?: (sourceId: string, targetId: string) => void
) {
  const [state, setState] = useState<CanvasState>(initialState)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Zoom operations
  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3)
    }))
  }, [])

  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.1)
    }))
  }, [])

  const resetZoom = useCallback(() => {
    setState(prev => ({
      ...prev,
      scale: 1,
      offset: { x: 0, y: 0 }
    }))
  }, [])

  const setScale = useCallback((scale: number) => {
    setState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(scale, 3))
    }))
  }, [])

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setState(prev => ({
      ...prev,
      offset: {
        x: prev.offset.x + deltaX,
        y: prev.offset.y + deltaY
      }
    }))
  }, [])

  const centerView = useCallback((nodesToCenter: WorkflowNode[]) => {
    if (nodesToCenter.length === 0 || !canvasRef.current) return

    const bounds = nodesToCenter.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.position.x),
        maxX: Math.max(acc.maxX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxY: Math.max(acc.maxY, node.position.y)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    )

    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const canvasCenterX = canvasRect.width / 2
    const canvasCenterY = canvasRect.height / 2

    setState(prev => ({
      ...prev,
      offset: {
        x: canvasCenterX - centerX * prev.scale,
        y: canvasCenterY - centerY * prev.scale
      }
    }))
  }, [])

  // Drag operations
  const startDrag = useCallback((x: number, y: number) => {
    setState(prev => ({
      ...prev,
      isDragging: true,
      dragStart: { x, y }
    }))
  }, [])

  const updateDrag = useCallback((x: number, y: number) => {
    setState(prev => {
      if (!prev.isDragging || !prev.dragStart) return prev

      const deltaX = x - prev.dragStart.x
      const deltaY = y - prev.dragStart.y

      return {
        ...prev,
        offset: {
          x: prev.offset.x + deltaX,
          y: prev.offset.y + deltaY
        },
        dragStart: { x, y }
      }
    })
  }, [])

  const endDrag = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDragging: false,
      dragStart: null
    }))
  }, [])

  // Area selection
  const startAreaSelection = useCallback((x: number, y: number) => {
    const canvasPos = screenToCanvas(x, y)
    setState(prev => ({
      ...prev,
      selectedArea: {
        start: canvasPos,
        end: canvasPos
      }
    }))
  }, [])

  const updateAreaSelection = useCallback((x: number, y: number) => {
    const canvasPos = screenToCanvas(x, y)
    setState(prev => ({
      ...prev,
      selectedArea: prev.selectedArea ? {
        ...prev.selectedArea,
        end: canvasPos
      } : null
    }))
  }, [])

  const endAreaSelection = useCallback((): string[] => {
    if (!state.selectedArea) return []

    const { start, end } = state.selectedArea
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)

    const selectedNodeIds = nodes
      .filter(node => 
        node.position.x >= minX &&
        node.position.x <= maxX &&
        node.position.y >= minY &&
        node.position.y <= maxY
      )
      .map(node => node.id)

    setState(prev => ({
      ...prev,
      selectedArea: null
    }))

    return selectedNodeIds
  }, [state.selectedArea, nodes])

  // Connection creation
  const startConnection = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      isConnecting: true,
      connectionStart: nodeId,
      connectionPreview: null
    }))
  }, [])

  const updateConnectionPreview = useCallback((x: number, y: number) => {
    const canvasPos = screenToCanvas(x, y)
    setState(prev => ({
      ...prev,
      connectionPreview: canvasPos
    }))
  }, [])

  const endConnection = useCallback((targetNodeId?: string) => {
    if (state.connectionStart && targetNodeId && state.connectionStart !== targetNodeId) {
      onConnectionCreate?.(state.connectionStart, targetNodeId)
    }

    setState(prev => ({
      ...prev,
      isConnecting: false,
      connectionStart: null,
      connectionPreview: null
    }))
  }, [state.connectionStart, onConnectionCreate])

  // Coordinate conversion
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: screenX, y: screenY }

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (screenX - rect.left - state.offset.x) / state.scale
    const y = (screenY - rect.top - state.offset.y) / state.scale

    return { x, y }
  }, [state.scale, state.offset])

  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    if (!canvasRef.current) return { x: canvasX, y: canvasY }

    const rect = canvasRef.current.getBoundingClientRect()
    const x = canvasX * state.scale + state.offset.x + rect.left
    const y = canvasY * state.scale + state.offset.y + rect.top

    return { x, y }
  }, [state.scale, state.offset])

  // Computed values
  const transform = useMemo(() => {
    return `translate(${state.offset.x}px, ${state.offset.y}px) scale(${state.scale})`
  }, [state.offset, state.scale])

  const actions: CanvasActions = {
    zoomIn,
    zoomOut,
    resetZoom,
    setScale,
    pan,
    centerView,
    startDrag,
    updateDrag,
    endDrag,
    startAreaSelection,
    updateAreaSelection,
    endAreaSelection,
    startConnection,
    updateConnectionPreview,
    endConnection,
    screenToCanvas,
    canvasToScreen
  }

  return {
    ...state,
    actions,
    transform,
    canvasRef
  }
}