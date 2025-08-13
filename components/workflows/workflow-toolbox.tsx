"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, GitBranch, Zap, Square } from "lucide-react"
import type { WorkflowNode } from "./workflow-builder"

interface WorkflowToolboxProps {
  onAddNode: (type: WorkflowNode["type"], label: string) => void
}

const nodeTypes = [
  {
    type: "start" as const,
    label: "Start",
    description: "Workflow entry point",
    icon: Play,
    color: "text-accent",
  },
  {
    type: "condition" as const,
    label: "Condition",
    description: "Decision point with rules",
    icon: GitBranch,
    color: "text-primary",
  },
  {
    type: "action" as const,
    label: "Action",
    description: "Process or validation step",
    icon: Zap,
    color: "text-chart-4",
  },
  {
    type: "end" as const,
    label: "End",
    description: "Final decision outcome",
    icon: Square,
    color: "text-muted-foreground",
  },
]

export function WorkflowToolbox({ onAddNode }: WorkflowToolboxProps) {
  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workflow Nodes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {nodeTypes.map((nodeType) => (
            <Button
              key={nodeType.type}
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3"
              onClick={() => onAddNode(nodeType.type, nodeType.label)}
            >
              <nodeType.icon className={`h-4 w-4 ${nodeType.color}`} />
              <div className="text-left">
                <p className="font-medium">{nodeType.label}</p>
                <p className="text-xs text-muted-foreground">{nodeType.description}</p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            Credit Assessment
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            Identity Verification
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            Fraud Detection
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            KYC Compliance
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
