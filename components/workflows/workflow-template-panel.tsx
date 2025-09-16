/**
 * Workflow Template Panel Component
 * Focused component for managing workflow templates
 */

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WorkflowBusinessLogicService } from "@/lib/services/workflow-business-logic-service"
import type { WorkflowTemplate } from "@/lib/services/workflow-business-logic-service"

interface WorkflowTemplatePanelProps {
  onTemplateLoad: (templateId: string) => void
  className?: string
}

export function WorkflowTemplatePanel({ onTemplateLoad, className = "" }: WorkflowTemplatePanelProps) {
  const workflowTemplates = WorkflowBusinessLogicService.getWorkflowTemplates()

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial':
        return 'bg-green-100 text-green-800'
      case 'general':
        return 'bg-blue-100 text-blue-800'
      case 'compliance':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTemplateStats = (template: WorkflowTemplate) => {
    return {
      nodes: template.nodes.length,
      connections: template.connections.length,
      complexity: template.nodes.length > 5 ? 'Complex' : template.nodes.length > 2 ? 'Medium' : 'Simple'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="font-semibold mb-3 text-sm">Workflow Templates</h3>
        <div className="space-y-3">
          {workflowTemplates.map(template => {
            const stats = getTemplateStats(template)
            
            return (
              <Card key={template.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium line-clamp-1">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getCategoryColor(template.category)}`}
                    >
                      {template.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{stats.nodes} nodes</span>
                    <span>{stats.connections} connections</span>
                    <Badge variant="outline" className="text-xs">
                      {stats.complexity}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-3 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onTemplateLoad(template.id)}
                  >
                    Load Template
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}