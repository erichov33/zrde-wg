/**
 * Workflow Node Toolbox Component
 * Focused component for managing workflow node templates and creation
 */

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WorkflowBusinessLogicService } from "@/lib/services/workflow-business-logic-service"
import type { WorkflowNodeTemplate } from "@/lib/services/workflow-business-logic-service"

interface WorkflowNodeToolboxProps {
  onNodeAdd: (position: { x: number; y: number }, template: string) => void
  className?: string
}

export function WorkflowNodeToolbox({ onNodeAdd, className = "" }: WorkflowNodeToolboxProps) {
  const nodeTemplates = WorkflowBusinessLogicService.getNodeTemplates()

  const handleNodeAdd = (templateKey: string) => {
    // Add node at a default position - the parent component can handle positioning
    onNodeAdd({ x: 200, y: 200 }, templateKey)
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start':
        return '▶️'
      case 'decision':
        return '🔀'
      case 'action':
        return '⚡'
      case 'end':
        return '🏁'
      case 'data_source':
        return '🗄️'
      case 'rule_set':
        return '📋'
      default:
        return '📦'
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'text-green-600'
      case 'decision':
        return 'text-purple-600'
      case 'action':
        return 'text-blue-600'
      case 'end':
        return 'text-red-600'
      case 'data_source':
        return 'text-orange-600'
      case 'rule_set':
        return 'text-indigo-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="font-semibold mb-3 text-sm">Node Types</h3>
        <div className="grid gap-2">
          {Object.entries(nodeTemplates).map(([key, template]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="justify-start h-auto p-3 hover:bg-muted/50"
              onClick={() => handleNodeAdd(key)}
            >
              <div className="flex items-start gap-3 text-left w-full">
                <span className="text-lg mt-0.5">{getNodeIcon(template.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{template.data.label}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {template.data.description}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs mt-1 ${getNodeColor(template.type)}`}
                  >
                    {template.type}
                  </Badge>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}