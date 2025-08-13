"use client"

import type React from "react"

import { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, GitBranch, Zap, Square, Trash2 } from "lucide-react"
import type { WorkflowNode, WorkflowConnection } from "./workflow-builder"

interface WorkflowCanvasProps {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  selectedNode: WorkflowNode | null
  onNodeSelect: (node: WorkflowNode | null) => void
  onNodeUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onNodeDelete: (nodeId: string) => void
}

const getNodeIcon = (type: WorkflowNode["type"]) => {
  switch (type) {
    case "start":
      return Play
    case "condition":
      return GitBranch
    case "action":
      return Zap
    case "end":
      return Square
  }
}

const getNodeColor = (type: WorkflowNode["type"]) => {
  switch (type) {
    case "start":
      return "border-accent bg-accent/10"
    case "condition":
      return "border-primary bg-primary/10"
    case "action":
      return "border-chart-4 bg-chart-4/10"
    case "end":
      return "border-muted-foreground bg-muted/10"
  }
}

export function WorkflowCanvas({
  nodes,
  connections,
  selectedNode,
  onNodeSelect,
  onNodeUpdate,
  onNodeDelete,
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, node: WorkflowNode) => {
      e.preventDefault()
      setDraggedNode(node.id)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left - node.position.x,
          y: e.clientY - rect.top - node.position.y,
        })
      }
      onNodeSelect(node)
    },
    [onNodeSelect],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedNode && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const newPosition = {
          x: e.clientX - rect.left - dragOffset.x,
          y: e.clientY - rect.top - dragOffset.y,
        }
        onNodeUpdate(draggedNode, { position: newPosition })
      }
    },
    [draggedNode, dragOffset, onNodeUpdate],
  )

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null)
  }, [])

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-background/50 relative overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onNodeSelect(null)
        }
      }}
    >
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Connections */}
      <svg className="absolute inset-0 pointer-events-none">
        {connections.map((connection) => {
          const sourceNode = nodes.find((n) => n.id === connection.source)
          const targetNode = nodes.find((n) => n.id === connection.target)
          if (!sourceNode || !targetNode) return null

          const x1 = sourceNode.position.x + 60
          const y1 = sourceNode.position.y + 30
          const x2 = targetNode.position.x + 60
          const y2 = targetNode.position.y + 30

          return (
            <line
              key={connection.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--border))"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          )
        })}
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

      {/* Nodes */}
      {nodes.map((node) => {
        const Icon = getNodeIcon(node.type)
        const isSelected = selectedNode?.id === node.id

        return (
          <div
            key={node.id}
            className={`absolute cursor-move select-none group ${isSelected ? "z-10" : "z-0"}`}
            style={{
              left: node.position.x,
              top: node.position.y,
            }}
            onMouseDown={(e) => handleMouseDown(e, node)}
          >
            <div
              className={`
                w-32 h-16 rounded-lg border-2 flex items-center justify-center gap-2 bg-card
                ${getNodeColor(node.type)}
                ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                hover:shadow-lg transition-all
              `}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium truncate">{node.data.label}</span>
            </div>

            {/* Delete button */}
            {isSelected && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onNodeDelete(node.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )
      })}

      {/* Instructions */}
      {nodes.length === 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Build Your Decision Workflow</p>
            <p className="text-sm">Drag nodes from the toolbox to create your decision process</p>
          </div>
        </div>
      )}
    </div>
  )
}
