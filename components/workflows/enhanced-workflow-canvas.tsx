"use client"

import type React from "react"
import { useRef, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Play, GitBranch, Zap, Square, Trash2, Plus, Database, Settings } from "lucide-react"
import type { UnifiedWorkflowNode, WorkflowConnection } from "./unified-workflow-builder"

// Enhanced component props interface
interface EnhancedWorkflowCanvasProps {
  nodes: UnifiedWorkflowNode[]
  connections: WorkflowConnection[]
  selectedNode: UnifiedWorkflowNode | null
  selectedConnection: WorkflowConnection | null
  onNodeSelect: (node: UnifiedWorkflowNode | null) => void
  onConnectionSelect: (connection: WorkflowConnection | null) => void
  onNodeUpdate: (nodeId: string, updates: Partial<UnifiedWorkflowNode>) => void
  onNodeDelete: (nodeId: string) => void
  onConnectionCreate: (sourceId: string, targetId: string, label?: string) => void
  onConnectionUpdate: (connectionId: string, updates: Partial<WorkflowConnection>) => void
  onConnectionDelete: (connectionId: string) => void
  mode?: "simple" | "enhanced"
}

// Enhanced drag state interface
interface DragState {
  nodeId: string | null
  offset: { x: number; y: number }
}

// Connection creation state
interface ConnectionState {
  isCreating: boolean
  sourceNodeId: string | null
  tempEndPoint: { x: number; y: number } | null
}

// Constants
const GRID_SIZE = 20
const NODE_WIDTH = 160 // Increased for better visibility
const NODE_HEIGHT = 80 // Increased for better visibility
const NODE_CENTER_OFFSET = { x: 80, y: 40 } // Center point for connections
const CONNECTION_HANDLE_SIZE = 8

/**
 * Gets the appropriate icon component for a node type
 */
const getNodeIcon = (type: UnifiedWorkflowNode["type"]) => {
  const iconMap = {
    start: Play,
    condition: GitBranch,
    action: Zap,
    end: Square,
    data_source: Database,
    rule_set: Settings,
    decision: GitBranch, // Use same icon as condition
  } as const

  return iconMap[type]
}

/**
 * Gets the appropriate color classes for a node type
 */
const getNodeColor = (type: UnifiedWorkflowNode["type"]) => {
  const colorMap = {
    start: "border-green-500 bg-green-50 text-green-700",
    condition: "border-purple-500 bg-purple-50 text-purple-700",
    action: "border-yellow-500 bg-yellow-50 text-yellow-700",
    end: "border-red-500 bg-red-50 text-red-700",
    data_source: "border-blue-500 bg-blue-50 text-blue-700",
    rule_set: "border-orange-500 bg-orange-50 text-orange-700",
    decision: "border-purple-500 bg-purple-50 text-purple-700", // Use same color as condition
  } as const

  return colorMap[type]
}

/**
 * Gets connection points for a node (input and output handles)
 */
const getConnectionPoints = (node: UnifiedWorkflowNode) => {
  const { x, y } = node.position
  
  return {
    input: { x: x, y: y + NODE_HEIGHT / 2 }, // Left side
    output: { x: x + NODE_WIDTH, y: y + NODE_HEIGHT / 2 }, // Right side
    top: { x: x + NODE_WIDTH / 2, y: y }, // Top
    bottom: { x: x + NODE_WIDTH / 2, y: y + NODE_HEIGHT }, // Bottom
  }
}

/**
 * Enhanced WorkflowCanvas Component with Connection Management
 */
export function EnhancedWorkflowCanvas({
  nodes,
  connections,
  selectedNode,
  selectedConnection,
  onNodeSelect,
  onConnectionSelect,
  onNodeUpdate,
  onNodeDelete,
  onConnectionCreate,
  onConnectionUpdate,
  onConnectionDelete,
  mode = "enhanced",
}: EnhancedWorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    nodeId: null,
    offset: { x: 0, y: 0 }
  })
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isCreating: false,
    sourceNodeId: null,
    tempEndPoint: null
  })

  /**
   * Calculates the mouse position relative to the canvas
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
   */
  const handleNodeMouseDown = useCallback((event: React.MouseEvent, node: UnifiedWorkflowNode) => {
    event.preventDefault()
    event.stopPropagation()
    
    const canvasPosition = getCanvasPosition(event)
    const offset = {
      x: canvasPosition.x - node.position.x,
      y: canvasPosition.y - node.position.y,
    }
    
    setDragState({ nodeId: node.id, offset })
    onNodeSelect(node)
  }, [getCanvasPosition, onNodeSelect])

  /**
   * Handles connection creation start
   */
  const handleConnectionStart = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.preventDefault()
    event.stopPropagation()
    
    setConnectionState({
      isCreating: true,
      sourceNodeId: nodeId,
      tempEndPoint: getCanvasPosition(event)
    })
  }, [getCanvasPosition])

  /**
   * Handles connection creation end
   */
  const handleConnectionEnd = useCallback((event: React.MouseEvent, targetNodeId: string) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (connectionState.isCreating && connectionState.sourceNodeId && connectionState.sourceNodeId !== targetNodeId) {
      // Check if connection already exists
      const existingConnection = connections.find(
        conn => conn.source === connectionState.sourceNodeId && conn.target === targetNodeId
      )
      
      if (!existingConnection) {
        onConnectionCreate(connectionState.sourceNodeId, targetNodeId)
      }
    }
    
    setConnectionState({
      isCreating: false,
      sourceNodeId: null,
      tempEndPoint: null
    })
  }, [connectionState, connections, onConnectionCreate])

  /**
   * Handles mouse movement during drag operations and connection creation
   */
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    const canvasPosition = getCanvasPosition(event)
    
    // Handle node dragging
    if (dragState.nodeId) {
      const newPosition = {
        x: Math.max(0, canvasPosition.x - dragState.offset.x),
        y: Math.max(0, canvasPosition.y - dragState.offset.y),
      }
      onNodeUpdate(dragState.nodeId, { position: newPosition })
    }
    
    // Handle connection creation
    if (connectionState.isCreating) {
      setConnectionState(prev => ({
        ...prev,
        tempEndPoint: canvasPosition
      }))
    }
  }, [dragState, connectionState, getCanvasPosition, onNodeUpdate])

  /**
   * Handles the end of drag operations
   */
  const handleCanvasMouseUp = useCallback(() => {
    setDragState({ nodeId: null, offset: { x: 0, y: 0 } })
    
    if (connectionState.isCreating) {
      setConnectionState({
        isCreating: false,
        sourceNodeId: null,
        tempEndPoint: null
      })
    }
  }, [connectionState])

  /**
   * Handles canvas clicks to deselect nodes and connections
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onNodeSelect(null)
      onConnectionSelect(null)
    }
  }, [onNodeSelect, onConnectionSelect])

  /**
   * Handles connection clicks
   */
  const handleConnectionClick = useCallback((event: React.MouseEvent, connection: WorkflowConnection) => {
    event.stopPropagation()
    onConnectionSelect(connection)
    onNodeSelect(null)
  }, [onConnectionSelect, onNodeSelect])

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
   * Calculates the path for a curved connection line
   */
  const getConnectionPath = useCallback((startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => {
    const dx = endPoint.x - startPoint.x
    const dy = endPoint.y - startPoint.y
    
    // Create a curved path
    const controlPointOffset = Math.abs(dx) * 0.5
    const cp1x = startPoint.x + controlPointOffset
    const cp1y = startPoint.y
    const cp2x = endPoint.x - controlPointOffset
    const cp2y = endPoint.y
    
    return `M ${startPoint.x} ${startPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPoint.x} ${endPoint.y}`
  }, [])

  /**
   * Renders connection lines between nodes
   */
  const renderConnections = () => (
    <svg className="absolute inset-0 pointer-events-none">
      {/* Existing connections */}
      {connections.map((connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source)
        const targetNode = nodes.find(n => n.id === connection.target)
        
        if (!sourceNode || !targetNode) return null

        const sourcePoints = getConnectionPoints(sourceNode)
        const targetPoints = getConnectionPoints(targetNode)
        
        // Use right output to left input for horizontal flow
        const startPoint = sourcePoints.output
        const endPoint = targetPoints.input
        
        const isSelected = selectedConnection?.id === connection.id
        const path = getConnectionPath(startPoint, endPoint)

        return (
          <g key={connection.id}>
            {/* Connection path */}
            <path
              d={path}
              stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth={isSelected ? "3" : "2"}
              fill="none"
              markerEnd="url(#arrowhead)"
              className="pointer-events-auto cursor-pointer hover:stroke-primary/70"
              onClick={(e) => handleConnectionClick(e as any, connection)}
            />
            
            {/* Connection label */}
            {connection.label && (
              <text
                x={(startPoint.x + endPoint.x) / 2}
                y={(startPoint.y + endPoint.y) / 2 - 10}
                textAnchor="middle"
                className="fill-current text-xs font-medium pointer-events-none"
                style={{ fill: "hsl(var(--foreground))" }}
              >
                {connection.label}
              </text>
            )}
          </g>
        )
      })}
      
      {/* Temporary connection during creation */}
      {connectionState.isCreating && connectionState.sourceNodeId && connectionState.tempEndPoint && (
        (() => {
          const sourceNode = nodes.find(n => n.id === connectionState.sourceNodeId)
          if (!sourceNode) return null
          
          const sourcePoints = getConnectionPoints(sourceNode)
          const startPoint = sourcePoints.output
          const endPoint = connectionState.tempEndPoint
          const path = getConnectionPath(startPoint, endPoint)
          
          return (
            <path
              d={path}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          )
        })()
      )}
      
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
   * Renders connection handles on a node
   */
  const renderConnectionHandles = (node: UnifiedWorkflowNode) => {
    const points = getConnectionPoints(node)
    const isSelected = selectedNode?.id === node.id
    
    if (!isSelected) return null

    return (
      <>
        {/* Output handle (right side) */}
        <div
          className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg cursor-crosshair hover:scale-110 transition-transform"
          style={{
            left: points.output.x - node.position.x - CONNECTION_HANDLE_SIZE / 2,
            top: points.output.y - node.position.y - CONNECTION_HANDLE_SIZE / 2,
          }}
          onMouseDown={(e) => handleConnectionStart(e, node.id)}
          title="Drag to create connection"
        />
        
        {/* Input handle (left side) - only show for non-start nodes */}
        {node.type !== 'start' && (
          <div
            className="absolute w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-lg"
            style={{
              left: points.input.x - node.position.x - CONNECTION_HANDLE_SIZE / 2,
              top: points.input.y - node.position.y - CONNECTION_HANDLE_SIZE / 2,
            }}
            onMouseUp={(e) => handleConnectionEnd(e, node.id)}
            title="Connection input"
          />
        )}
      </>
    )
  }

  /**
   * Renders a single workflow node with enhanced features
   */
  const renderNode = (node: UnifiedWorkflowNode) => {
    const Icon = getNodeIcon(node.type)
    const isSelected = selectedNode?.id === node.id
    const isDragging = dragState.nodeId === node.id

    return (
      <div
        key={node.id}
        className={`absolute select-none group ${isSelected ? "z-20" : "z-10"}`}
        style={{
          left: node.position.x,
          top: node.position.y,
        }}
      >
        <div
          className={`
            relative cursor-move rounded-lg border-2 flex flex-col items-center justify-center p-3 bg-white shadow-sm
            ${getNodeColor(node.type)}
            ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
            ${isDragging ? "shadow-lg scale-105" : ""}
            hover:shadow-lg transition-all duration-200
          `}
          style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
          onMouseDown={(event) => handleNodeMouseDown(event, node)}
        >
          <Icon className="h-5 w-5 flex-shrink-0 mb-1" />
          <span className="text-xs font-medium text-center leading-tight" title={node.data.label}>
            {node.data.label}
          </span>
          
          {/* Node type badge */}
          <Badge variant="outline" className="absolute -top-2 left-2 text-xs">
            {node.type.replace('_', ' ')}
          </Badge>
        </div>

        {/* Connection handles */}
        {renderConnectionHandles(node)}

        {/* Delete button - only visible when node is selected */}
        {isSelected && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(event) => {
              event.stopPropagation()
              onNodeDelete(node.id)
            }}
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
    if (nodes.length > 1 || connections.length > 0) return null

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center text-muted-foreground max-w-md">
          <p className="text-lg font-medium mb-2">Build Your Decision Workflow</p>
          <p className="text-sm mb-4">
            1. Drag nodes from the toolbox to create your decision process<br/>
            2. Select a node to see connection handles<br/>
            3. Drag from the blue handle to create connections
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>Output</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <span>Input</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-background/50 relative overflow-hidden cursor-default"
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