"use client"

import type React from "react"

import { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, GitBranch, Zap, Square, Trash2 } from "lucide-react"
import type { WorkflowNode, WorkflowConnection } from "./workflow-builder"

// Component props interface
interface WorkflowCanvasProps {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  selectedNode: WorkflowNode | null
  onNodeSelect: (node: WorkflowNode | null) => void
  onNodeUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onNodeDelete: (nodeId: string) => void
}

// Drag state interface
interface DragState {
  nodeId: string | null
  offset: { x: number; y: number }
}

// Constants
const GRID_SIZE = 20
const NODE_WIDTH = 128 // w-32
const NODE_HEIGHT = 64 // h-16
const NODE_CENTER_OFFSET = { x: 60, y: 30 } // Center point for connections

/**
 * Gets the appropriate icon component for a node type
 * @param type - The node type
 * @returns The corresponding Lucide icon component
 */
const getNodeIcon = (type: WorkflowNode["type"]) => {
  const iconMap = {
    start: Play,
    condition: GitBranch,
    action: Zap,
    end: Square,
  } as const

  return iconMap[type]
}

/**
 * Gets the appropriate color classes for a node type
 * @param type - The node type
 * @returns CSS classes for border and background colors
 */
const getNodeColor = (type: WorkflowNode["type"]) => {
  const colorMap = {
    start: "border-accent bg-accent/10",
    condition: "border-primary bg-primary/10",
    action: "border-chart-4 bg-chart-4/10",
    end: "border-muted-foreground bg-muted/10",
  } as const

  return colorMap[type]
}

/**
 * WorkflowCanvas Component
 * 
 * A drag-and-drop canvas for building workflows with visual nodes and connections.
 * Features:
 * - Draggable nodes with visual feedback
 * - Connection lines between nodes
 * - Grid background for alignment
 * - Node selection and deletion
 */
export function WorkflowCanvas({
  nodes,
  connections,
  selectedNode,
  onNodeSelect,
  onNodeUpdate,
  onNodeDelete,
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    nodeId: null,
    offset: { x: 0, y: 0 }
  })

  /**
   * Calculates the mouse position relative to the canvas
   * @param event - Mouse event
   * @returns Position object with x and y coordinates
   */
  const getCanvasPosition = useCallback((event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }, [])

  /**
   * Handles the start of a node drag operation
   * @param event - Mouse down event
   * @param node - The node being dragged
   */
  const handleNodeMouseDown = useCallback((event: React.MouseEvent, node: WorkflowNode) => {
    event.preventDefault()
    
    const canvasPosition = getCanvasPosition(event)
    const offset = {
      x: canvasPosition.x - node.position.x,
      y: canvasPosition.y - node.position.y,
    }
    
    setDragState({ nodeId: node.id, offset })
    onNodeSelect(node)
  }, [getCanvasPosition, onNodeSelect])

  /**
   * Handles mouse movement during drag operations
   * @param event - Mouse move event
   */
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.nodeId) return
    
    const canvasPosition = getCanvasPosition(event)
    const newPosition = {
      x: canvasPosition.x - dragState.offset.x,
      y: canvasPosition.y - dragState.offset.y,
    }
    
    onNodeUpdate(dragState.nodeId, { position: newPosition })
  }, [dragState, getCanvasPosition, onNodeUpdate])

  /**
   * Handles the end of a drag operation
   */
  const handleCanvasMouseUp = useCallback(() => {
    setDragState({ nodeId: null, offset: { x: 0, y: 0 } })
  }, [])

  /**
   * Handles canvas clicks to deselect nodes
   * @param event - Click event
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onNodeSelect(null)
    }
  }, [onNodeSelect])

  /**
   * Handles node deletion
   * @param event - Click event
   * @param nodeId - ID of the node to delete
   */
  const handleNodeDelete = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation()
    onNodeDelete(nodeId)
  }, [onNodeDelete])

  /**
   * Renders the grid background pattern
   */
  const renderGridBackground = () => (
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(hsl(var(--border)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    />
  )

  /**
   * Renders connection lines between nodes
   */
  const renderConnections = () => (
    <svg className="absolute inset-0 pointer-events-none">
      {connections.map((connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source)
        const targetNode = nodes.find(n => n.id === connection.target)
        
        if (!sourceNode || !targetNode) return null

        const startPoint = {
          x: sourceNode.position.x + NODE_CENTER_OFFSET.x,
          y: sourceNode.position.y + NODE_CENTER_OFFSET.y,
        }
        
        const endPoint = {
          x: targetNode.position.x + NODE_CENTER_OFFSET.x,
          y: targetNode.position.y + NODE_CENTER_OFFSET.y,
        }

        return (
          <line
            key={connection.id}
            x1={startPoint.x}
            y1={startPoint.y}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="hsl(var(--border))"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        )
      })}
      
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          fill="hsl(var(--border))"
        >
          <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
      </defs>
    </svg>
  )

  /**
   * Renders a single workflow node
   * @param node - The node to render
   */
  const renderNode = (node: WorkflowNode) => {
    const Icon = getNodeIcon(node.type)
    const isSelected = selectedNode?.id === node.id
    const isDragging = dragState.nodeId === node.id

    return (
      <div
        key={node.id}
        className={`absolute cursor-move select-none group ${isSelected ? "z-10" : "z-0"}`}
        style={{
          left: node.position.x,
          top: node.position.y,
        }}
        onMouseDown={(event) => handleNodeMouseDown(event, node)}
      >
        <div
          className={`
            w-32 h-16 rounded-lg border-2 flex items-center justify-center gap-2 bg-card
            ${getNodeColor(node.type)}
            ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
            ${isDragging ? "shadow-lg scale-105" : ""}
            hover:shadow-lg transition-all duration-200
          `}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs font-medium truncate" title={node.data.label}>
            {node.data.label}
          </span>
        </div>

        {/* Delete button - only visible when node is selected */}
        {isSelected && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(event) => handleNodeDelete(event, node.id)}
            title="Delete node"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  /**
   * Renders instructional text when only the start node exists
   */
  const renderInstructions = () => {
    if (nodes.length > 1) return null

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Build Your Decision Workflow</p>
          <p className="text-sm">Drag nodes from the toolbox to create your decision process</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-background/50 relative overflow-hidden cursor-crosshair"
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onClick={handleCanvasClick}
    >
      {renderGridBackground()}
      {renderConnections()}
      {nodes.map(renderNode)}
      {renderInstructions()}
    </div>
  )
}
