'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import { WorkflowNode as UnifiedWorkflowNode, WorkflowConnection } from '@/lib/types/unified-workflow'
import { CanvasState, CanvasActions } from '@/lib/hooks/useWorkflowCanvas'
import { cn } from '@/lib/utils'

import { WorkflowNode } from './WorkflowNode'
import { WorkflowConnectionLine } from './WorkflowConnectionLine'
import { SelectionArea } from './SelectionArea'
import { ConnectionPreview } from './ConnectionPreview'

export interface WorkflowCanvasProps {
  nodes: UnifiedWorkflowNode[]
  connections: WorkflowConnection[]
  selectedNode: UnifiedWorkflowNode | null
  selectedConnection: WorkflowConnection | null
  canvasState: CanvasState & { actions: CanvasActions; transform: string; canvasRef: React.RefObject<HTMLDivElement> }
  onNodeSelect: (nodeId: string | null) => void
  onNodeUpdate: (nodeId: string, updates: Partial<UnifiedWorkflowNode>) => void
  onNodeDelete: (nodeId: string) => void
  onConnectionSelect: (connectionId: string | null) => void
  onConnectionUpdate: (connectionId: string, updates: Partial<WorkflowConnection>) => void
  onConnectionDelete: (connectionId: string) => void
  readonly?: boolean
  mode?: 'simple' | 'enhanced' | 'advanced'
}

export function WorkflowCanvas({
  nodes,
  connections,
  selectedNode,
  selectedConnection,
  canvasState,
  onNodeSelect,
  onNodeUpdate,
  onNodeDelete,
  onConnectionSelect,
  onConnectionUpdate,
  onConnectionDelete,
  readonly = false,
  mode = 'enhanced'
}: WorkflowCanvasProps) {
  const { 
    scale, 
    offset, 
    isDragging, 
    selectedArea, 
    isConnecting, 
    connectionStart, 
    connectionPreview,
    actions,
    transform,
    canvasRef
  } = canvasState

  const [draggedNode, setDraggedNode] = React.useState<string | null>(null)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })

  // Handle canvas events
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (readonly) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const canvasPos = actions.screenToCanvas(x, y)

    if (e.button === 0) { // Left click
      if (e.shiftKey) {
        // Start area selection
        actions.startAreaSelection(canvasPos.x, canvasPos.y)
      } else {
        // Start panning
        actions.startDrag(x, y)
      }
    }
  }, [readonly, actions, canvasRef])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (readonly) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const canvasPos = actions.screenToCanvas(x, y)

    if (isDragging) {
      actions.updateDrag(x, y)
    } else if (selectedArea) {
      actions.updateAreaSelection(canvasPos.x, canvasPos.y)
    } else if (isConnecting) {
      actions.updateConnectionPreview(canvasPos.x, canvasPos.y)
    }
  }, [readonly, isDragging, selectedArea, isConnecting, actions])

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    if (readonly) return

    if (isDragging) {
      actions.endDrag()
    } else if (selectedArea) {
      const selectedNodeIds = actions.endAreaSelection()
      // Handle multi-selection
      if (selectedNodeIds.length > 0) {
        onNodeSelect(selectedNodeIds[0] || null) // For now, select the first node
      }
    } else if (isConnecting) {
      actions.endConnection()
    } else {
      // Clear selection if clicking on empty canvas
      onNodeSelect(null)
    }
  }, [readonly, isDragging, selectedArea, isConnecting, actions, onNodeSelect])

  // Handle node dragging
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readonly) return
    
    e.stopPropagation()
    setDraggedNode(nodeId)
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const canvasPos = actions.screenToCanvas(mouseX, mouseY)
    
    setDragOffset({
      x: canvasPos.x - node.position.x,
      y: canvasPos.y - node.position.y
    })

    onNodeSelect(nodeId)
  }, [readonly, nodes, actions, canvasRef, onNodeSelect])

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    if (readonly) return
    // Handle node editing
    onNodeSelect(nodeId)
  }, [readonly, onNodeSelect])

  const handleConnectionStart = useCallback((nodeId: string) => {
    if (readonly) return
    actions.startConnection(nodeId)
  }, [readonly, actions])

  const handleConnectionEnd = useCallback((nodeId: string) => {
    if (readonly) return
    actions.endConnection(nodeId)
  }, [readonly, actions])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readonly) return

      if (e.key === 'Delete' && selectedNode) {
        onNodeDelete(selectedNode.id)
      } else if (e.key === 'Escape') {
        if (isConnecting) {
          actions.endConnection()
        } else {
          onNodeSelect(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [readonly, selectedNode, isConnecting, actions, onNodeDelete, onNodeSelect])

  // Handle global mouse events for node dragging
  useEffect(() => {
    if (!draggedNode) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const canvasPos = actions.screenToCanvas(mouseX, mouseY)

      const newPosition = {
        x: canvasPos.x - dragOffset.x,
        y: canvasPos.y - dragOffset.y
      }

      onNodeUpdate(draggedNode, { position: newPosition })
    }

    const handleMouseUp = () => {
      setDraggedNode(null)
      setDragOffset({ x: 0, y: 0 })
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggedNode, dragOffset, actions, canvasRef, onNodeUpdate])

  // Calculate if connection preview is valid
  const isConnectionValid = useCallback(() => {
    if (!isConnecting || !connectionStart || !connectionPreview) return false
    
    // Check if there's a node at the current position
    const nodeAtPosition = nodes.find(node => {
      const nodeRect = {
        left: node.position.x,
        top: node.position.y,
        right: node.position.x + 120, // Assuming node width of 120
        bottom: node.position.y + 80   // Assuming node height of 80
      }
      
      return connectionPreview.x >= nodeRect.left &&
             connectionPreview.x <= nodeRect.right &&
             connectionPreview.y >= nodeRect.top &&
             connectionPreview.y <= nodeRect.bottom &&
             node.id !== connectionStart // Can't connect to self
    })
    
    return !!nodeAtPosition
  }, [isConnecting, connectionStart, connectionPreview, nodes])

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative w-full h-full overflow-hidden bg-gray-50',
        'cursor-grab active:cursor-grabbing',
        readonly && 'cursor-default'
      )}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      {/* Canvas Content */}
      <div style={{ transform }}>
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="pointer-events-none">
            <defs>
              <pattern
                id="grid"
                width={20 * scale}
                height={20 * scale}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${20 * scale} 0 L 0 0 0 ${20 * scale}`}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Connections */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map(connection => {
            const sourceNode = nodes.find(n => n.id === connection.source)
            const targetNode = nodes.find(n => n.id === connection.target)
            
            if (!sourceNode || !targetNode) return null

            return (
              <WorkflowConnectionLine
                key={connection.id}
                connection={connection}
                sourcePosition={sourceNode.position}
                targetPosition={targetNode.position}
                isSelected={selectedConnection?.id === connection.id}
                onSelect={() => onConnectionSelect(connection.id)}
                onUpdate={(updates) => onConnectionUpdate(connection.id, updates)}
                readonly={readonly}
                mode={mode}
              />
            )
          })}

          {/* Connection Preview */}
          {isConnecting && connectionStart && connectionPreview && (
            <ConnectionPreview
              startPosition={nodes.find(n => n.id === connectionStart)?.position || { x: 0, y: 0 }}
              currentPosition={connectionPreview}
              isValid={isConnectionValid()}
              connectionType="default"
            />
          )}
        </svg>

        {/* Nodes */}
        <div style={{ zIndex: 2 }}>
          {nodes.map(node => (
            <WorkflowNode
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              isDragging={draggedNode === node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onDoubleClick={() => handleNodeDoubleClick(node.id)}
              onConnectionStart={() => handleConnectionStart(node.id)}
              onConnectionEnd={() => handleConnectionEnd(node.id)}
              onUpdate={(updates) => onNodeUpdate(node.id, updates)}
              readonly={readonly}
              mode={mode}
            />
          ))}
        </div>

        {/* Selection Area */}
        {selectedArea && (
          <SelectionArea
            start={selectedArea.start}
            end={selectedArea.end}
          />
        )}
      </div>

      {/* Canvas Controls */}
      {mode !== 'simple' && (
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={actions.zoomIn}
            className="p-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={actions.zoomOut}
            className="p-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={actions.resetZoom}
            className="p-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 text-xs"
            title="Reset Zoom"
          >
            1:1
          </button>
        </div>
      )}
    </div>
  )
}