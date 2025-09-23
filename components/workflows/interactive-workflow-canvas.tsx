"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  Plus, 
  Trash2, 
  Copy, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Grid3X3,
  MousePointer,
  Hand,
  GitBranch,
  Settings,
  Eye,
  EyeOff
} from "lucide-react"
import type { WorkflowNode as UnifiedWorkflowNode, WorkflowConnection } from "@/lib/types/unified-workflow"

interface InteractiveWorkflowCanvasProps {
  nodes: UnifiedWorkflowNode[]
  connections: WorkflowConnection[]
  selectedNodeId?: string
  selectedConnectionId?: string
  onNodeSelect: (nodeId: string | null) => void
  onConnectionSelect: (connectionId: string | null) => void
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void
  onNodeDelete: (nodeId: string) => void
  onConnectionCreate: (connection: Omit<WorkflowConnection, 'id'>) => void
  onConnectionDelete: (connectionId: string) => void
  onNodeAdd: (position: { x: number; y: number }) => void
  className?: string
}

interface DragState {
  isDragging: boolean
  dragType: 'node' | 'canvas' | 'connection' | null
  dragNodeId?: string
  startPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  connectionStart?: { nodeId: string; position: { x: number; y: number } }
}

interface ViewState {
  zoom: number
  pan: { x: number; y: number }
  showGrid: boolean
  showLabels: boolean
}

interface HoverState {
  nodeId?: string
  connectionId?: string
  handle?: { nodeId: string; type: 'input' | 'output' }
}

// Canvas configuration
const CANVAS_CONFIG = {
  GRID_SIZE: 20,
  NODE_WIDTH: 200,
  NODE_HEIGHT: 80,
  HANDLE_SIZE: 12,
  CONNECTION_STROKE_WIDTH: 2,
  ZOOM_MIN: 0.25,
  ZOOM_MAX: 2,
  ZOOM_STEP: 0.1,
  PAN_SPEED: 1,
} as const

// Color scheme for different node types
const NODE_COLORS = {
  start: { bg: '#10b981', border: '#059669', text: '#ffffff' },
  decision: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
  action: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
  end: { bg: '#ef4444', border: '#dc2626', text: '#ffffff' },
  data_source: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' },
  rule_set: { bg: '#06b6d4', border: '#0891b2', text: '#ffffff' },
} as const

export function InteractiveWorkflowCanvas({
  nodes,
  connections,
  selectedNodeId,
  selectedConnectionId,
  onNodeSelect,
  onConnectionSelect,
  onNodeMove,
  onNodeDelete,
  onConnectionCreate,
  onConnectionDelete,
  onNodeAdd,
  className = "",
}: InteractiveWorkflowCanvasProps) {
  const canvasRef = useRef<SVGSVGElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
  })
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    showGrid: true,
    showLabels: true,
  })
  const [hoverState, setHoverState] = useState<HoverState>({})
  const [tool, setTool] = useState<'select' | 'pan' | 'connect'>('select')

  // Calculate canvas bounds
  const canvasBounds = useMemo(() => {
    if (nodes.length === 0) return { width: 800, height: 600 }
    
    const maxX = Math.max(...nodes.map(n => n.position.x + CANVAS_CONFIG.NODE_WIDTH))
    const maxY = Math.max(...nodes.map(n => n.position.y + CANVAS_CONFIG.NODE_HEIGHT))
    
    return {
      width: Math.max(800, maxX + 200),
      height: Math.max(600, maxY + 200),
    }
  }, [nodes])

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - viewState.pan.x) / viewState.zoom
    const y = (e.clientY - rect.top - viewState.pan.y) / viewState.zoom

    if (tool === 'pan') {
      setDragState({
        isDragging: true,
        dragType: 'canvas',
        startPosition: { x: e.clientX, y: e.clientY },
        currentPosition: { x: e.clientX, y: e.clientY },
      })
    } else if (tool === 'select') {
      // Check if clicking on empty space
      const clickedNode = nodes.find(node => 
        x >= node.position.x && 
        x <= node.position.x + CANVAS_CONFIG.NODE_WIDTH &&
        y >= node.position.y && 
        y <= node.position.y + CANVAS_CONFIG.NODE_HEIGHT
      )

      if (!clickedNode) {
        onNodeSelect(null)
        onConnectionSelect(null)
      }
    }
  }, [tool, viewState, nodes, onNodeSelect, onConnectionSelect])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragState.isDragging) return

    const currentPos = { x: e.clientX, y: e.clientY }
    
    if (dragState.dragType === 'canvas') {
      const deltaX = currentPos.x - dragState.startPosition.x
      const deltaY = currentPos.y - dragState.startPosition.y
      
      setViewState(prev => ({
        ...prev,
        pan: {
          x: prev.pan.x + deltaX,
          y: prev.pan.y + deltaY,
        },
      }))
      
      setDragState(prev => ({
        ...prev,
        startPosition: currentPos,
      }))
    } else if (dragState.dragType === 'node' && dragState.dragNodeId) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (currentPos.x - rect.left - viewState.pan.x) / viewState.zoom
      const y = (currentPos.y - rect.top - viewState.pan.y) / viewState.zoom
      
      onNodeMove(dragState.dragNodeId, { x, y })
    }
  }, [dragState, viewState, onNodeMove])

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    })
  }, [])

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -CANVAS_CONFIG.ZOOM_STEP : CANVAS_CONFIG.ZOOM_STEP
    const newZoom = Math.max(
      CANVAS_CONFIG.ZOOM_MIN,
      Math.min(CANVAS_CONFIG.ZOOM_MAX, viewState.zoom + delta)
    )
    
    setViewState(prev => ({ ...prev, zoom: newZoom }))
  }, [viewState.zoom])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedNodeId) {
            onNodeDelete(selectedNodeId)
          } else if (selectedConnectionId) {
            onConnectionDelete(selectedConnectionId)
          }
          break
        case 'Escape':
          onNodeSelect(null)
          onConnectionSelect(null)
          break
        case '1':
          setTool('select')
          break
        case '2':
          setTool('pan')
          break
        case '3':
          setTool('connect')
          break
        case 'g':
          setViewState(prev => ({ ...prev, showGrid: !prev.showGrid }))
          break
        case 'l':
          setViewState(prev => ({ ...prev, showLabels: !prev.showLabels }))
          break
        case '0':
          setViewState(prev => ({ ...prev, zoom: 1, pan: { x: 0, y: 0 } }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, selectedConnectionId, onNodeDelete, onConnectionDelete, onNodeSelect, onConnectionSelect])

  // Render grid background
  const renderGrid = useCallback(() => {
    if (!viewState.showGrid) return null

    const gridSize = CANVAS_CONFIG.GRID_SIZE * viewState.zoom
    const offsetX = viewState.pan.x % gridSize
    const offsetY = viewState.pan.y % gridSize

    const lines = []
    
    // Vertical lines
    for (let x = offsetX; x < canvasBounds.width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasBounds.height}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.5}
        />
      )
    }
    
    // Horizontal lines
    for (let y = offsetY; y < canvasBounds.height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={canvasBounds.width}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.5}
        />
      )
    }

    return <g className="grid">{lines}</g>
  }, [viewState.showGrid, viewState.zoom, viewState.pan, canvasBounds])

  // Render connections
  const renderConnections = useCallback(() => {
    return connections.map(connection => {
      const sourceNode = nodes.find(n => n.id === connection.source)
      const targetNode = nodes.find(n => n.id === connection.target)
      
      if (!sourceNode || !targetNode) return null

      const sourceX = sourceNode.position.x + CANVAS_CONFIG.NODE_WIDTH
      const sourceY = sourceNode.position.y + CANVAS_CONFIG.NODE_HEIGHT / 2
      const targetX = targetNode.position.x
      const targetY = targetNode.position.y + CANVAS_CONFIG.NODE_HEIGHT / 2

      const isSelected = selectedConnectionId === connection.id
      const isHovered = hoverState.connectionId === connection.id

      // Create curved path
      const controlPointOffset = Math.abs(targetX - sourceX) * 0.5
      const path = `M ${sourceX} ${sourceY} C ${sourceX + controlPointOffset} ${sourceY} ${targetX - controlPointOffset} ${targetY} ${targetX} ${targetY}`
      
      const markerId = isSelected ? "arrow-selected" : isHovered ? "arrow-hovered" : "arrow-default";

      return (
        <g key={connection.id} className="connection-group">
          {/* Connection line */}
          <path
            d={path}
            fill="none"
            stroke={isSelected ? "#3b82f6" : isHovered ? "#6b7280" : "#9ca3af"}
            strokeWidth={isSelected ? 3 : CANVAS_CONFIG.CONNECTION_STROKE_WIDTH}
            className="cursor-pointer transition-all duration-200"
            markerEnd={`url(#${markerId})`}
            onClick={(e) => {
              e.stopPropagation()
              onConnectionSelect(connection.id)
            }}
            onMouseEnter={() => setHoverState(prev => ({ ...prev, connectionId: connection.id }))}
            onMouseLeave={() => setHoverState(prev => ({ ...prev, connectionId: undefined }))}
          />

          {/* Connection label */}
          {connection.label && viewState.showLabels && (
            <text
              x={(sourceX + targetX) / 2}
              y={(sourceY + targetY) / 2 - 10}
              textAnchor="middle"
              className="text-xs fill-gray-600 font-medium pointer-events-none"
              style={{ fontSize: `${12 / viewState.zoom}px` }}
            >
              {connection.label}
            </text>
          )}
        </g>
      )
    })
  }, [connections, nodes, selectedConnectionId, hoverState.connectionId, viewState.showLabels, viewState.zoom, onConnectionSelect])

  // Render arrow markers for connections
  const renderArrowMarkers = useCallback(() => {
    return connections.map(connection => {
      const isSelected = selectedConnectionId === connection.id
      return (
        <marker
          key={`arrow-${connection.id}`}
          id={`arrow-${connection.id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={isSelected ? "#3b82f6" : "#9ca3af"}
          />
        </marker>
      )
    })
  }, [connections, selectedConnectionId])

  // Render nodes
  const renderNodes = useCallback(() => {
    return nodes.map(node => {
      const isSelected = selectedNodeId === node.id
      const isHovered = hoverState.nodeId === node.id
      const colors = NODE_COLORS[node.type as keyof typeof NODE_COLORS] || NODE_COLORS.action

      return (
        <g
          key={node.id}
          className="node-group cursor-pointer"
          transform={`translate(${node.position.x}, ${node.position.y})`}
          onClick={(e) => {
            e.stopPropagation()
            onNodeSelect(node.id)
          }}
          onMouseDown={(e) => {
            if (tool === 'select') {
              e.stopPropagation()
              setDragState({
                isDragging: true,
                dragType: 'node',
                dragNodeId: node.id,
                startPosition: { x: e.clientX, y: e.clientY },
                currentPosition: { x: e.clientX, y: e.clientY },
              })
            }
          }}
          onMouseEnter={() => setHoverState(prev => ({ ...prev, nodeId: node.id }))}
          onMouseLeave={() => setHoverState(prev => ({ ...prev, nodeId: undefined }))}
        >
          {/* Node background */}
          <rect
            width={CANVAS_CONFIG.NODE_WIDTH}
            height={CANVAS_CONFIG.NODE_HEIGHT}
            rx={8}
            fill={colors.bg}
            stroke={isSelected ? "#3b82f6" : colors.border}
            strokeWidth={isSelected ? 3 : 2}
            className={`transition-all duration-200 ${isHovered ? 'drop-shadow-lg' : ''}`}
          />
          
          {/* Node content */}
          <text
            x={CANVAS_CONFIG.NODE_WIDTH / 2}
            y={CANVAS_CONFIG.NODE_HEIGHT / 2 - 8}
            textAnchor="middle"
            className="font-medium pointer-events-none"
            fill={colors.text}
            style={{ fontSize: `${14 / viewState.zoom}px` }}
          >
            {node.data.label}
          </text>
          
          <text
            x={CANVAS_CONFIG.NODE_WIDTH / 2}
            y={CANVAS_CONFIG.NODE_HEIGHT / 2 + 8}
            textAnchor="middle"
            className="text-xs opacity-80 pointer-events-none"
            fill={colors.text}
            style={{ fontSize: `${10 / viewState.zoom}px` }}
          >
            {node.type.replace('_', ' ')}
          </text>

          {/* Connection handles */}
          {tool === 'connect' && (
            <>
              {/* Input handle */}
              <circle
                cx={0}
                cy={CANVAS_CONFIG.NODE_HEIGHT / 2}
                r={CANVAS_CONFIG.HANDLE_SIZE / 2}
                fill="#ffffff"
                stroke={colors.border}
                strokeWidth={2}
                className="cursor-crosshair"
                onMouseEnter={() => setHoverState(prev => ({ 
                  ...prev, 
                  handle: { nodeId: node.id, type: 'input' } 
                }))}
                onMouseLeave={() => setHoverState(prev => ({ 
                  ...prev, 
                  handle: undefined 
                }))}
              />
              
              {/* Output handle */}
              <circle
                cx={CANVAS_CONFIG.NODE_WIDTH}
                cy={CANVAS_CONFIG.NODE_HEIGHT / 2}
                r={CANVAS_CONFIG.HANDLE_SIZE / 2}
                fill="#ffffff"
                stroke={colors.border}
                strokeWidth={2}
                className="cursor-crosshair"
                onMouseEnter={() => setHoverState(prev => ({ 
                  ...prev, 
                  handle: { nodeId: node.id, type: 'output' } 
                }))}
                onMouseLeave={() => setHoverState(prev => ({ 
                  ...prev, 
                  handle: undefined 
                }))}
              />
            </>
          )}
        </g>
      )
    })
  }, [nodes, selectedNodeId, hoverState, tool, viewState.zoom, onNodeSelect])

  return (
    <div className={`relative w-full h-full bg-gray-50 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <Card className="p-2">
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant={tool === 'select' ? 'default' : 'ghost'}
              onClick={() => setTool('select')}
              title="Select Tool (1)"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'pan' ? 'default' : 'ghost'}
              onClick={() => setTool('pan')}
              title="Pan Tool (2)"
            >
              <Hand className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'connect' ? 'default' : 'ghost'}
              onClick={() => setTool('connect')}
              title="Connect Tool (3)"
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-2">
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewState(prev => ({ 
                ...prev, 
                zoom: Math.min(CANVAS_CONFIG.ZOOM_MAX, prev.zoom + CANVAS_CONFIG.ZOOM_STEP) 
              }))}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewState(prev => ({ 
                ...prev, 
                zoom: Math.max(CANVAS_CONFIG.ZOOM_MIN, prev.zoom - CANVAS_CONFIG.ZOOM_STEP) 
              }))}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewState({ zoom: 1, pan: { x: 0, y: 0 }, showGrid: true, showLabels: true })}
              title="Reset View (0)"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-2">
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant={viewState.showGrid ? 'default' : 'ghost'}
              onClick={() => setViewState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
              title="Toggle Grid (G)"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewState.showLabels ? 'default' : 'ghost'}
              onClick={() => setViewState(prev => ({ ...prev, showLabels: !prev.showLabels }))}
              title="Toggle Labels (L)"
            >
              {viewState.showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-2">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Zoom: {Math.round(viewState.zoom * 100)}%</span>
            <span>Tool: {tool}</span>
            <span>Nodes: {nodes.length}</span>
            <span>Connections: {connections.length}</span>
          </div>
        </Card>
      </div>

      {/* Canvas */}
      <svg
        ref={canvasRef}
        width="100%"
        height="100%"
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          transform: `scale(${viewState.zoom}) translate(${viewState.pan.x / viewState.zoom}px, ${viewState.pan.y / viewState.zoom}px)`,
          transformOrigin: '0 0',
        }}
      >
        {/* Global definitions for arrow markers */}
        <defs>
          {renderArrowMarkers()}
        </defs>
        
        {renderGrid()}
        {renderConnections()}
        {renderNodes()}
      </svg>

      {/* Instructions */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <GitBranch className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Interactive Workflow Canvas</h3>
            <p className="text-sm max-w-md">
              Use the toolbar to select tools, create connections between nodes, and navigate the canvas.
              Press keyboard shortcuts for quick access to tools and features.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}