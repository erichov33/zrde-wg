'use client'

import React from 'react'
import { WorkflowNodeType } from '@/lib/types/workflow'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Square, 
  GitBranch, 
  Repeat, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Globe,
  Mail,
  FileText,
  Code,
  Zap
} from 'lucide-react'

export interface WorkflowToolboxProps {
  onAddNode: (type: WorkflowNodeType, label: string) => void
  className?: string
  mode?: 'simple' | 'enhanced' | 'advanced'
}

interface NodeTemplate {
  type: WorkflowNodeType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  category: 'basic' | 'control' | 'data' | 'integration'
}

const nodeTemplates: NodeTemplate[] = [
  // Basic nodes
  {
    type: 'start',
    label: 'Start',
    icon: Play,
    description: 'Workflow entry point',
    category: 'basic'
  },
  {
    type: 'end',
    label: 'End',
    icon: Square,
    description: 'Workflow completion',
    category: 'basic'
  },
  {
    type: 'task',
    label: 'Task',
    icon: CheckCircle,
    description: 'Execute an action',
    category: 'basic'
  },
  
  // Control flow
  {
    type: 'decision',
    label: 'Decision',
    icon: GitBranch,
    description: 'Conditional branching',
    category: 'control'
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: Repeat,
    description: 'Repeat actions',
    category: 'control'
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: Clock,
    description: 'Wait for specified time',
    category: 'control'
  },
  {
    type: 'error',
    label: 'Error Handler',
    icon: AlertTriangle,
    description: 'Handle errors',
    category: 'control'
  },
  
  // Data operations
  {
    type: 'data',
    label: 'Data',
    icon: Database,
    description: 'Data processing',
    category: 'data'
  },
  {
    type: 'transform',
    label: 'Transform',
    icon: Code,
    description: 'Transform data',
    category: 'data'
  },
  
  // Integrations
  {
    type: 'api',
    label: 'API Call',
    icon: Globe,
    description: 'External API integration',
    category: 'integration'
  },
  {
    type: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Send email notification',
    category: 'integration'
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: Zap,
    description: 'Trigger webhook',
    category: 'integration'
  },
  {
    type: 'file',
    label: 'File Operation',
    icon: FileText,
    description: 'File processing',
    category: 'integration'
  }
]

const categoryColors = {
  basic: 'bg-blue-50 border-blue-200 text-blue-700',
  control: 'bg-purple-50 border-purple-200 text-purple-700',
  data: 'bg-green-50 border-green-200 text-green-700',
  integration: 'bg-orange-50 border-orange-200 text-orange-700'
}

const categoryLabels = {
  basic: 'Basic',
  control: 'Control Flow',
  data: 'Data Operations',
  integration: 'Integrations'
}

export function WorkflowToolbox({ onAddNode, className, mode = 'enhanced' }: WorkflowToolboxProps) {
  const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'node-template',
      nodeType: template.type,
      label: template.label
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleClick = (template: NodeTemplate) => {
    onAddNode(template.type, template.label)
  }

  const filteredTemplates = mode === 'simple' 
    ? nodeTemplates.filter(t => ['start', 'end', 'task', 'decision'].includes(t.type))
    : nodeTemplates

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category]!.push(template)
    return acc
  }, {} as Record<string, NodeTemplate[]>)

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Workflow Nodes</h3>
        <p className="text-xs text-gray-500 mt-1">
          Drag nodes to canvas or click to add
        </p>
      </div>

      <div className="p-2 space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide px-2">
              {categoryLabels[category as keyof typeof categoryLabels]}
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => {
                const Icon = template.icon
                return (
                  <div
                    key={template.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, template)}
                    onClick={() => handleClick(template)}
                    className={cn(
                      'p-3 border rounded-lg cursor-pointer transition-all duration-200',
                      'hover:shadow-md hover:scale-105 active:scale-95',
                      'flex flex-col items-center text-center space-y-1',
                      categoryColors[template.category]
                    )}
                    title={template.description}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{template.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {mode === 'advanced' && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>Total Nodes:</span>
              <span className="font-medium">{filteredTemplates.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}