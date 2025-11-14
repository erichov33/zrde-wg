"use client"

import React, { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  GitBranch, 
  Zap, 
  Square, 
  Trash2, 
  Plus, 
  Circle, 
  Database, 
  Cloud, 
  CheckCircle, 
  Settings, 
  Filter, 
  Brain, 
  Package, 
  Bell, 
  FileText 
} from "lucide-react"
import type { WorkflowNode, WorkflowConnection } from "./workflow-builder"

// Component props interface
interface WorkflowCanvasProps {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  selectedNode: WorkflowNode | null
  onNodeSelect: (node: WorkflowNode | null) => void
  onNodeUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onNodeDelete: (nodeId: string) => void
  onConnectionCreate?: (sourceId: string, targetId: string, label?: string) => void
  onConnectionDelete?: (connectionId: string) => void
}

// Drag state interface
interface DragState {
  nodeId: string | null
  offset: { x: number; y: number }
}

// Connection creation state
interface ConnectionState {
  isCreating: boolean
  sourceNodeId: string | null
  sourceConnector: string | null
  currentPosition: { x: number; y: number } | null
}

// Connector types
type ConnectorType = 'input' | 'output' | 'true' | 'false'

// Connector interface
interface Connector {
  id: string
  type: ConnectorType
  label: string
  position: { x: number; y: number }
}

// Constants
const GRID_SIZE = 20
const NODE_WIDTH = 160 // w-40 - increased for better visibility
const NODE_HEIGHT = 80 // h-20 - increased for better visibility
const NODE_CENTER_OFFSET = { x: 80, y: 40 } // Center point for connections
const CONNECTOR_SIZE = 12 // Size of connector circles - increased
const CONNECTOR_OFFSET = 16 // Distance from node edge - increased
const BRANCH_OFFSET = 20 // Vertical offset for branch connectors

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
    data_source: Database,
    integration: Cloud,
    validation: CheckCircle,
    rule_set: Settings,
    decision: Filter,
    ai_decision: Brain,
    batch_process: Package,
    notification: Bell,
    audit_log: FileText,
  } as const

  return iconMap[type] || Zap
}

/**
 * Gets the appropriate color classes for a node type
 * @param type - The node type
 * @returns CSS classes for border and background colors
 */
const getNodeColor = (type: WorkflowNode["type"]) => {
  const colorMap: Partial<Record<WorkflowNode["type"], string>> = {
    start: "border-accent bg-accent/10",
    condition: "border-primary bg-primary/10",
    action: "border-chart-4 bg-chart-4/10",
    end: "border-muted-foreground bg-muted/10",
  }

  return colorMap[type] ?? "border-muted-foreground bg-muted/10"
}

/**
 * Gets the connectors for a node based on its type
 * @param node - The workflow node
 * @returns Array of connectors with their positions
 */
const getNodeConnectors = (node: WorkflowNode): Connector[] => {
  const connectors: Connector[] = []
  const { x, y } = node.position

  switch (node.type) {
    case 'start':
      // Start nodes only have output - positioned at right center
      connectors.push({
        id: `${node.id}-output`,
        type: 'output',
        label: 'Start',
        position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + NODE_HEIGHT / 2 }
      })
      break

    case 'end':
      // End nodes only have input - positioned at left center
      connectors.push({
        id: `${node.id}-input`,
        type: 'input',
        label: 'End',
        position: { x: x - CONNECTOR_OFFSET, y: y + NODE_HEIGHT / 2 }
      })
      break

    case 'condition':
    case 'decision':
    case 'ai_decision':
      // Decision nodes have input and two clearly separated outputs
      connectors.push(
        {
          id: `${node.id}-input`,
          type: 'input',
          label: 'Input',
          position: { x: x - CONNECTOR_OFFSET, y: y + NODE_HEIGHT / 2 }
        },
        {
          id: `${node.id}-true`,
          type: 'true',
          label: 'YES',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + BRANCH_OFFSET }
        },
        {
          id: `${node.id}-false`,
          type: 'false',
          label: 'NO',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + NODE_HEIGHT - BRANCH_OFFSET }
        }
      )
      break

    case 'rule_set':
      // Rule sets with clear pass/fail branches
      connectors.push(
        {
          id: `${node.id}-input`,
          type: 'input',
          label: 'Input',
          position: { x: x - CONNECTOR_OFFSET, y: y + NODE_HEIGHT / 2 }
        },
        {
          id: `${node.id}-pass`,
          type: 'true',
          label: 'PASS',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + BRANCH_OFFSET }
        },
        {
          id: `${node.id}-fail`,
          type: 'false',
          label: 'FAIL',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + NODE_HEIGHT - BRANCH_OFFSET }
        }
      )
      break

    case 'validation':
      // Validation nodes with valid/invalid branches
      connectors.push(
        {
          id: `${node.id}-input`,
          type: 'input',
          label: 'Input',
          position: { x: x - CONNECTOR_OFFSET, y: y + NODE_HEIGHT / 2 }
        },
        {
          id: `${node.id}-valid`,
          type: 'true',
          label: 'VALID',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + BRANCH_OFFSET }
        },
        {
          id: `${node.id}-invalid`,
          type: 'false',
          label: 'INVALID',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + NODE_HEIGHT - BRANCH_OFFSET }
        }
      )
      break

    case 'batch_process':
      // Batch process with success/error branches
      connectors.push(
        {
          id: `${node.id}-input`,
          type: 'input',
          label: 'Input',
          position: { x: x - CONNECTOR_OFFSET, y: y + NODE_HEIGHT / 2 }
        },
        {
          id: `${node.id}-success`,
          type: 'true',
          label: 'SUCCESS',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + BRANCH_OFFSET }
        },
        {
          id: `${node.id}-error`,
          type: 'false',
          label: 'ERROR',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + NODE_HEIGHT - BRANCH_OFFSET }
        }
      )
      break

    case 'action':
    case 'data_source':
    case 'integration':
    case 'notification':
    case 'audit_log':
    default:
      // Standard nodes with clear input/output positioning
      connectors.push(
        {
          id: `${node.id}-input`,
          type: 'input',
          label: 'Input',
          position: { x: x - CONNECTOR_OFFSET, y: y + NODE_HEIGHT / 2 }
        },
        {
          id: `${node.id}-output`,
          type: 'output',
          label: 'Output',
          position: { x: x + NODE_WIDTH + CONNECTOR_OFFSET, y: y + NODE_HEIGHT / 2 }
        }
      )
      break
  }

  return connectors
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
  onConnectionCreate,
  onConnectionDelete,
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    nodeId: null,
    offset: { x: 0, y: 0 }
  })
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isCreating: false,
    sourceNodeId: null,
    sourceConnector: null,
    currentPosition: null
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
   * Updates the current position during connection creation
   * @param event - Mouse move event
   */
  const handleConnectionMouseMove = useCallback((event: React.MouseEvent) => {
    if (connectionState.isCreating) {
      const canvasPosition = getCanvasPosition(event)
      setConnectionState(prev => ({
        ...prev,
        currentPosition: canvasPosition
      }))
    }
  }, [connectionState.isCreating, getCanvasPosition])

  /**
   * Handles mouse movement during drag operations and connection creation
   * @param event - Mouse move event
   */
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    // Handle node dragging
    if (dragState.nodeId) {
      const canvasPosition = getCanvasPosition(event)
      const newPosition = {
        x: canvasPosition.x - dragState.offset.x,
        y: canvasPosition.y - dragState.offset.y,
      }
      onNodeUpdate(dragState.nodeId, { position: newPosition })
    }
    
    // Handle connection creation
    handleConnectionMouseMove(event)
  }, [dragState, getCanvasPosition, onNodeUpdate, handleConnectionMouseMove])

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
      // Cancel connection creation if clicking on empty canvas
      if (connectionState.isCreating) {
        setConnectionState({
          isCreating: false,
          sourceNodeId: null,
          sourceConnector: null,
          currentPosition: null
        })
      }
    }
  }, [onNodeSelect, connectionState.isCreating])

  /**
   * Handles starting a connection from a connector
   * @param event - Mouse event
   * @param nodeId - Source node ID
   * @param connectorId - Source connector ID
   */
  const handleConnectorMouseDown = useCallback((event: React.MouseEvent, nodeId: string, connectorId: string) => {
    event.stopPropagation()
    event.preventDefault()
    
    const canvasPosition = getCanvasPosition(event)
    setConnectionState({
      isCreating: true,
      sourceNodeId: nodeId,
      sourceConnector: connectorId,
      currentPosition: canvasPosition
    })
  }, [getCanvasPosition])

  /**
   * Handles completing a connection to a target connector
   * @param event - Mouse event
   * @param targetNodeId - Target node ID
   * @param targetConnectorId - Target connector ID
   */
  const handleConnectorMouseUp = useCallback((event: React.MouseEvent, targetNodeId: string, targetConnectorId: string) => {
    event.stopPropagation()
    
    if (connectionState.isCreating && connectionState.sourceNodeId && connectionState.sourceNodeId !== targetNodeId) {
      // Create the connection
      if (onConnectionCreate) {
        const sourceConnector = connectionState.sourceConnector || ''
        const label = sourceConnector.includes('true') ? 'Yes' : sourceConnector.includes('false') ? 'No' : undefined
        onConnectionCreate(connectionState.sourceNodeId, targetNodeId, label)
      }
    }
    
    // Reset connection state
    setConnectionState({
      isCreating: false,
      sourceNodeId: null,
      sourceConnector: null,
      currentPosition: null
    })
  }, [connectionState, onConnectionCreate])

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
   * Creates a curved path between two points
   * @param start - Starting point
   * @param end - Ending point
   * @returns SVG path string
   */
  const createCurvedPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const controlOffset = Math.abs(dx) * 0.5
    
    return `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`
  }

  /**
   * Renders connection lines between nodes
   */
  const renderConnections = () => {
    console.log('Rendering connections:', connections.length, connections)
    return (
    <svg className="absolute inset-0 pointer-events-none">
      {/* Arrow marker definitions - Enhanced for better visibility */}
      <defs>
        {/* Drop shadow filter for connections */}
        <filter id="connection-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
        </filter>
        
        <marker
          id="arrowhead-default"
          markerWidth="16"
          markerHeight="12"
          refX="15"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 16 6, 0 12"
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
        </marker>
        <marker
          id="arrowhead-true"
          markerWidth="16"
          markerHeight="12"
          refX="15"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 16 6, 0 12"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
        </marker>
        <marker
          id="arrowhead-false"
          markerWidth="16"
          markerHeight="12"
          refX="15"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 16 6, 0 12"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
        </marker>
        <marker
          id="arrowhead-creating"
          markerWidth="16"
          markerHeight="12"
          refX="15"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 16 6, 0 12"
            fill="#8b5cf6"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          />
        </marker>
      </defs>

      {/* Existing connections */}
      {connections.map((connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source)
        const targetNode = nodes.find(n => n.id === connection.target)
        
        if (!sourceNode || !targetNode) return null

        // Find the appropriate connectors
        const sourceConnectors = getNodeConnectors(sourceNode)
        const targetConnectors = getNodeConnectors(targetNode)
        
        const sourceConnector = sourceConnectors.find(c => c.type === 'output' || c.type === 'true' || c.type === 'false')
        const targetConnector = targetConnectors.find(c => c.type === 'input')
        
        if (!sourceConnector || !targetConnector) return null

        const pathData = createCurvedPath(sourceConnector.position, targetConnector.position)
        const isConditional = connection.label === 'Yes' || connection.label === 'No'
        
        let strokeColor = '#3b82f6'
        let strokeWidth = '3'
        let markerEnd = 'url(#arrowhead-default)'
        
        if (isConditional) {
          if (connection.label === 'Yes') {
            strokeColor = '#10b981'
            markerEnd = 'url(#arrowhead-true)'
            strokeWidth = '4'
          } else {
            strokeColor = '#ef4444'
            markerEnd = 'url(#arrowhead-false)'
            strokeWidth = '4'
          }
        }

        return (
          <g key={connection.id}>
            {/* Connection shadow for depth */}
            <path
              d={pathData}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth={parseInt(strokeWidth) + 4}
              fill="none"
              transform="translate(2,2)"
              opacity="0.6"
            />
            {/* Connection glow effect */}
            <path
              d={pathData}
              stroke={strokeColor}
              strokeWidth={parseInt(strokeWidth) + 2}
              fill="none"
              opacity="0.3"
              style={{
                filter: 'blur(2px)'
              }}
            />
            {/* Main connection line */}
            <path
              d={pathData}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              markerEnd={markerEnd}
              className="hover:opacity-80 transition-all duration-200 cursor-pointer"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}
            />
            {/* Connection label */}
            {connection.label && (
              <g>
                {/* Label shadow */}
                <rect
                  x={(sourceConnector.position.x + targetConnector.position.x) / 2 - 20}
                  y={(sourceConnector.position.y + targetConnector.position.y) / 2 - 12}
                  width="40"
                  height="20"
                  rx="10"
                  fill="rgba(0,0,0,0.1)"
                  transform="translate(1,1)"
                />
                {/* Label background */}
                <rect
                  x={(sourceConnector.position.x + targetConnector.position.x) / 2 - 20}
                  y={(sourceConnector.position.y + targetConnector.position.y) / 2 - 12}
                  width="40"
                  height="20"
                  rx="10"
                  fill="white"
                  stroke={strokeColor}
                  strokeWidth="2"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
                {/* Label text */}
                <text
                  x={(sourceConnector.position.x + targetConnector.position.x) / 2}
                  y={(sourceConnector.position.y + targetConnector.position.y) / 2 - 2}
                  textAnchor="middle"
                  className="font-bold pointer-events-none"
                  fill={strokeColor}
                  style={{ fontSize: '11px' }}
                >
                  {connection.label}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* Temporary connection during creation */}
      {connectionState.isCreating && connectionState.sourceNodeId && connectionState.currentPosition && (
        (() => {
          const sourceNode = nodes.find(n => n.id === connectionState.sourceNodeId)
          if (!sourceNode) return null
          
          const sourceConnectors = getNodeConnectors(sourceNode)
          const sourceConnector = sourceConnectors.find(c => c.id === connectionState.sourceConnector)
          if (!sourceConnector) return null

          const pathData = createCurvedPath(sourceConnector.position, connectionState.currentPosition)
          
          return (
            <g>
              {/* Temporary connection glow */}
              <path
                d={pathData}
                stroke="#8b5cf6"
                strokeWidth="6"
                strokeDasharray="8,4"
                fill="none"
                opacity="0.3"
                className="animate-pulse"
                style={{
                  filter: 'blur(3px)'
                }}
              />
              {/* Main temporary connection */}
              <path
                d={pathData}
                stroke="#8b5cf6"
                strokeWidth="4"
                strokeDasharray="8,4"
                fill="none"
                markerEnd="url(#arrowhead-creating)"
                opacity="0.9"
                className="animate-pulse"
                style={{
                  filter: 'drop-shadow(0 3px 6px rgba(139, 92, 246, 0.4))'
                }}
              />
            </g>
          )
        })()
      )}
    </svg>
    )
  }

  /**
   * Renders connectors for a node
   * @param node - The node to render connectors for
   */
  const renderConnectors = (node: WorkflowNode) => {
    const connectors = getNodeConnectors(node)
    const isSelected = selectedNode?.id === node.id
    const hasBranches = ['condition', 'decision', 'ai_decision', 'rule_set', 'validation', 'batch_process'].includes(node.type)

    return connectors.map((connector) => {
      const isOutput = connector.type === 'output' || connector.type === 'true' || connector.type === 'false'
      const isInput = connector.type === 'input'
      const isConditional = connector.type === 'true' || connector.type === 'false'
      
      let connectorColor = 'bg-blue-500 hover:bg-blue-600 border-white'
      let connectorSize = 'w-4 h-4'
      
      if (isInput) {
        connectorColor = 'bg-gray-500 hover:bg-gray-600 border-white'
      } else if (isConditional) {
        connectorColor = connector.type === 'true' 
          ? 'bg-green-500 hover:bg-green-600 border-white' 
          : 'bg-red-500 hover:bg-red-600 border-white'
        connectorSize = 'w-5 h-5' // Larger for branch connectors
      }

      return (
        <div key={connector.id} className="absolute">
          {/* Main connector circle */}
          <div
            className={`${connectorSize} rounded-full border-2 cursor-pointer transition-all duration-200 shadow-lg ${connectorColor} opacity-90 hover:opacity-100 hover:scale-110`}
            style={{
              left: connector.position.x - node.position.x - (isConditional ? 10 : 8),
              top: connector.position.y - node.position.y - (isConditional ? 10 : 8),
              zIndex: 15
            }}
            onMouseDown={(event) => handleConnectorMouseDown(event, node.id, connector.id)}
            onMouseUp={(event) => handleConnectorMouseUp(event, node.id, connector.id)}
            title={`${connector.label} connector`}
          />
          
          {/* Connector label - always visible for branches */}
          {(isConditional || isSelected) && (
            <div
              className="absolute text-xs font-bold whitespace-nowrap pointer-events-none"
              style={{
                left: connector.position.x - node.position.x + (isOutput ? 8 : -50),
                top: connector.position.y - node.position.y - 20,
                color: isConditional 
                  ? (connector.type === 'true' ? '#22c55e' : '#ef4444')
                  : '#6b7280',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                zIndex: 16
              }}
            >
              {connector.label}
            </div>
          )}
          
          {/* Connection port indicator */}
          <div
            className={`absolute w-2 h-2 rounded-full ${isInput ? 'bg-gray-300' : 'bg-blue-300'} opacity-60`}
            style={{
              left: connector.position.x - node.position.x - 4,
              top: connector.position.y - node.position.y - 4,
              zIndex: 14
            }}
          />
        </div>
      )
    })
  }

  /**
   * Renders a single workflow node
   * @param node - The node to render
   */
  const renderNode = (node: WorkflowNode) => {
    const Icon = getNodeIcon(node.type)
    const isSelected = selectedNode?.id === node.id
    const isDragging = dragState.nodeId === node.id
    const hasBranches = ['condition', 'decision', 'ai_decision', 'rule_set', 'validation', 'batch_process'].includes(node.type)

    // Get node type display info
    const getNodeTypeInfo = (type: WorkflowNode["type"]) => {
      const typeMap: Partial<Record<WorkflowNode["type"], { label: string; color: string }>> = {
        start: { label: 'START', color: 'bg-green-100 text-green-800 border-green-300' },
        condition: { label: 'CONDITION', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        decision: { label: 'DECISION', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        ai_decision: { label: 'AI DECISION', color: 'bg-purple-100 text-purple-800 border-purple-300' },
        rule_set: { label: 'RULES', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        validation: { label: 'VALIDATION', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
        action: { label: 'ACTION', color: 'bg-red-100 text-red-800 border-red-300' },
        batch_process: { label: 'BATCH', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
        notification: { label: 'NOTIFY', color: 'bg-pink-100 text-pink-800 border-pink-300' },
        end: { label: 'END', color: 'bg-gray-100 text-gray-800 border-gray-300' },
        data_source: { label: 'DATA', color: 'bg-teal-100 text-teal-800 border-teal-300' },
        integration: { label: 'INTEGRATION', color: 'bg-violet-100 text-violet-800 border-violet-300' },
        audit_log: { label: 'AUDIT', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      }
      return (
        typeMap[type] ??
        { label: type.toUpperCase().replace('_', ' '), color: 'bg-gray-100 text-gray-800 border-gray-300' }
      )
    }

    const typeInfo = getNodeTypeInfo(node.type)

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
            w-32 h-20 rounded-xl border-2 bg-card relative shadow-lg
            ${getNodeColor(node.type)}
            ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl" : ""}
            ${isDragging ? "shadow-xl scale-105" : ""}
            hover:shadow-xl transition-all duration-200
          `}
        >
          {/* Node type badge */}
          <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full text-xs font-bold ${typeInfo.color} shadow-sm border`}>
            {typeInfo.label}
          </div>

          {/* Node content */}
          <div className="flex flex-col items-center justify-center h-full pt-3 pb-2 px-2">
            <Icon className="h-5 w-5 flex-shrink-0 mb-1" />
            <span className="text-xs font-medium truncate text-center" title={node.data?.label || node.type}>
              {node.data?.label || node.type}
            </span>
          </div>
          
          {/* Enhanced branch indicators for decision-type nodes */}
          {hasBranches && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" title="True/Yes/Pass branch" />
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" title="False/No/Fail branch" />
            </div>
          )}

          {/* Flow direction indicator */}
          {node.type !== 'end' && (
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Render connectors */}
        {renderConnectors(node)}

        {/* Delete button - only visible when node is selected */}
        {isSelected && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
            onClick={(event) => handleNodeDelete(event, node.id)}
            title="Delete node"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}

        {/* Connection hint for selected nodes */}
        {isSelected && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
            Drag from connectors to create connections
          </div>
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
