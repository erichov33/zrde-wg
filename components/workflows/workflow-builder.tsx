"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { WorkflowCanvas } from "./workflow-canvas"
import { WorkflowToolbox } from "./workflow-toolbox"
import { WorkflowProperties } from "./workflow-properties"
import { Save, Play, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

export interface WorkflowNode {
  id: string
  type: "start" | "condition" | "action" | "end"
  position: { x: number; y: number }
  data: {
    label: string
    config?: any
  }
}

export interface WorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
}

export function WorkflowBuilder() {
  const [workflowName, setWorkflowName] = useState("New Workflow")
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: "start-1",
      type: "start",
      position: { x: 100, y: 100 },
      data: { label: "Application Received" },
    },
  ])
  const [connections, setConnections] = useState<WorkflowConnection[]>([])

  const addNode = (type: WorkflowNode["type"], label: string) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 300, y: 200 },
      data: { label },
    }
    setNodes([...nodes, newNode])
  }

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setNodes(nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)))
  }

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((node) => node.id !== nodeId))
    setConnections(connections.filter((conn) => conn.source !== nodeId && conn.target !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/workflows">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Workflows
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="font-semibold bg-transparent border-none text-lg p-0 h-auto focus-visible:ring-0"
              />
              <Badge variant="outline">Draft</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Play className="h-4 w-4" />
              Test
            </Button>
            <Button size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Toolbox */}
        <div className="w-64 border-r border-border bg-card/30">
          <WorkflowToolbox onAddNode={addNode} />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
            onNodeUpdate={updateNode}
            onNodeDelete={deleteNode}
          />
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l border-border bg-card/30">
          <WorkflowProperties selectedNode={selectedNode} onNodeUpdate={updateNode} />
        </div>
      </div>
    </div>
  )
}
