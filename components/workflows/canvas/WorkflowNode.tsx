'use client'

import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Square, 
  GitBranch, 
  Zap, 
  Database, 
  FileText, 
  Scale, 
  CheckCircle,
  Circle,
  AlertTriangle,
  Bot,
  Package,
  FileCheck
} from 'lucide-react'
import { WorkflowNode as UnifiedWorkflowNode, NodeType } from '@/lib/types/unified-workflow'
import { cn } from '@/lib/utils'

export interface WorkflowNodeProps {
  node: UnifiedWorkflowNode
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onConnectionStart: () => void
  onConnectionEnd: () => void
  onUpdate: (updates: Partial<UnifiedWorkflowNode>) => void
  readonly?: boolean
  mode?: 'simple' | 'enhanced' | 'advanced'
}

const NODE_ICONS: Record<NodeType, React.ComponentType<{ className?: string }>> = {
  start: Play,
  end: Square,
  condition: GitBranch,
  action: Zap,
  data_source: Database,
  rule_set: FileText,
  decision: Scale,
  validation: CheckCircle,
  notification: AlertTriangle,
  integration: Package,
  ai_decision: Bot,
  batch_process: Package,
  audit_log: FileCheck
}

const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  start: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  end: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  condition: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  action: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  data_source: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  rule_set: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  decision: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  validation: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  notification: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  integration: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  ai_decision: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  batch_process: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
  audit_log: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' }
}

export function WorkflowNode({
  node,
  isSelected,
  isDragging,
  onMouseDown,
  onDoubleClick,
  onConnectionStart,
  onConnectionEnd,
  onUpdate,
  readonly = false,
  mode = 'enhanced'
}: WorkflowNodeProps) {
  const IconComponent = NODE_ICONS[node.type]
  const colors = NODE_COLORS[node.type]

  // Validation status
  const hasErrors = useMemo(() => {
    // Basic validation - check required fields based on node type
    switch (node.type) {
      case 'condition':
        return !node.data.config?.conditions || node.data.config.conditions.length === 0
      case 'data_source':
        return !node.data.config?.dataSource
      case 'rule_set':
        return !node.data.config?.rules || node.data.config.rules.length === 0
      case 'decision':
        return !node.data.config?.criteria
      case 'validation':
        return !node.data.config?.validationRules || node.data.config.validationRules.length === 0
      case 'integration':
        return !node.data.config?.endpoint
      case 'ai_decision':
        return !node.data.config?.model
      case 'notification':
        return !node.data.config?.recipients
      default:
        return false
    }
  }, [node.type, node.data.config])

  const handleConnectionPointClick = (e: React.MouseEvent, type: 'input' | 'output') => {
    e.stopPropagation()
    if (readonly) return

    if (type === 'output') {
      onConnectionStart()
    } else {
      onConnectionEnd()
    }
  }

+ const hasBranchOutputs = useMemo(() => {
+   return [
+     'condition',
+     'decision',
+     'ai_decision',
+     'rule_set',
+     'validation',
+     'batch_process',
+   ].includes(node.type)
+ }, [node.type])

  return (
    <div
      className="absolute"
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        zIndex: isSelected ? 10 : 1
      }}
    >
      <Card
        className={cn(
          'relative min-w-[160px] max-w-[240px] cursor-pointer transition-all duration-200',
          colors.bg,
          colors.border,
          isSelected && 'ring-2 ring-primary ring-offset-2',
          isDragging && 'shadow-lg',
          hasErrors && 'border-destructive'
        )}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
      >
        {/* Connection Points */}
        {mode !== 'simple' && !readonly && (
          <>
            {/* Input Connection Point */}
            {node.type !== 'start' && (
              <Button
                variant="outline"
                size="sm"
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 p-0 rounded-full bg-background border-2"
                onClick={(e) => handleConnectionPointClick(e, 'input')}
              >
                <Circle className="h-3 w-3" />
              </Button>
            )}

-           {/* Output Connection Point */}
-           {node.type !== 'end' && (
-             <Button
-               variant="outline"
-               size="sm"
-               className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 p-0 rounded-full bg-background border-2"
-               onClick={(e) => handleConnectionPointClick(e, 'output')}
-             >
-               <Circle className="h-3 w-3" />
-             </Button>
-           )}
+           {/* Output Connection Points */}
+           {node.type !== 'end' && (
+             <>
+               {!hasBranchOutputs ? (
+                 <Button
+                   variant="outline"
+                   size="sm"
+                   className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 p-0 rounded-full bg-background border-2"
+                   onClick={(e) => handleConnectionPointClick(e, 'output')}
+                 >
+                   <Circle className="h-3 w-3" />
+                 </Button>
+               ) : (
+                 <>
+                   {/* Upper branch (YES/PASS/VALID/SUCCESS) */}
+                   <Button
+                     variant="outline"
+                     size="sm"
+                     className="absolute -right-3 top-1/4 -translate-y-1/2 w-6 h-6 p-0 rounded-full bg-background border-2"
+                     onClick={(e) => handleConnectionPointClick(e, 'output')}
+                     title="Branch A"
+                   >
+                     <Circle className="h-3 w-3" />
+                   </Button>
+                   {/* Lower branch (NO/FAIL/INVALID/ERROR) */}
+                   <Button
+                     variant="outline"
+                     size="sm"
+                     className="absolute -right-3 top-3/4 -translate-y-1/2 w-6 h-6 p-0 rounded-full bg-background border-2"
+                     onClick={(e) => handleConnectionPointClick(e, 'output')}
+                     title="Branch B"
+                   >
+                     <Circle className="h-3 w-3" />
+                   </Button>
+                 </>
+               )}
+             </>
+           )}
          </>
        )}
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            {/* Node Icon */}
            <div className={cn('flex-shrink-0 p-1 rounded', colors.text)}>
              <IconComponent className="h-4 w-4" />
            </div>

            {/* Node Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn('font-medium text-sm truncate', colors.text)}>
                  {node.data?.label || node.type}
                </h4>
                {hasErrors && (
                  <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                )}
              </div>

              {node.data.description && mode !== 'simple' && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {node.data.description}
                </p>
              )}

              {/* Node Type Badge */}
              <Badge variant="secondary" className="text-xs">
                {node.type.replace('_', ' ')}
              </Badge>

              {/* Additional Info for Enhanced/Advanced Mode */}
              {mode === 'advanced' && (
                <div className="mt-2 space-y-1">
                  {node.type === 'condition' && node.data.config?.conditions && (
                    <div className="text-xs text-muted-foreground">
                      {Array.isArray(node.data.config.conditions) 
                        ? `${node.data.config.conditions.length} condition${node.data.config.conditions.length !== 1 ? 's' : ''}`
                        : 'Conditional logic configured'
                      }
                    </div>
                  )}
                  {node.type === 'rule_set' && node.data.config?.rules && (
                    <div className="text-xs text-muted-foreground">
                      {Array.isArray(node.data.config.rules)
                        ? `${node.data.config.rules.length} rule${node.data.config.rules.length !== 1 ? 's' : ''}`
                        : 'Rules configured'
                      }
                    </div>
                  )}
                  {node.type === 'data_source' && node.data.config?.dataSource && (
                    <div className="text-xs text-muted-foreground">
                      {typeof node.data.config.dataSource === 'object' 
                        ? node.data.config.dataSource.type || 'Data source configured'
                        : node.data.config.dataSource
                      }
                    </div>
                  )}
                  {node.type === 'decision' && node.data.config?.criteria && (
                    <div className="text-xs text-muted-foreground">
                      Criteria: {node.data.config.criteria}
                    </div>
                  )}
                  {node.type === 'validation' && node.data.config?.validationRules && (
                    <div className="text-xs text-muted-foreground">
                      {Array.isArray(node.data.config.validationRules)
                        ? `${node.data.config.validationRules.length} rule${node.data.config.validationRules.length !== 1 ? 's' : ''}`
                        : 'Validation rules configured'
                      }
                    </div>
                  )}
                  {node.type === 'integration' && node.data.config?.endpoint && (
                    <div className="text-xs text-muted-foreground">
                      {node.data.config.endpoint}
                    </div>
                  )}
                  {node.type === 'ai_decision' && node.data.config?.model && (
                    <div className="text-xs text-muted-foreground">
                      Model: {node.data.config.model}
                    </div>
                  )}
                  {node.type === 'notification' && node.data.config?.recipients && (
                    <div className="text-xs text-muted-foreground">
                      {Array.isArray(node.data.config.recipients)
                        ? `${node.data.config.recipients.length} recipient${node.data.config.recipients.length !== 1 ? 's' : ''}`
                        : 'Recipients configured'
                      }
                    </div>
                  )}
                  {node.type === 'batch_process' && node.data.config?.batchSize && (
                    <div className="text-xs text-muted-foreground">
                      Batch size: {node.data.config.batchSize}
                    </div>
                  )}
                  {node.type === 'audit_log' && node.data.config?.logLevel && (
                    <div className="text-xs text-muted-foreground">
                      Log level: {node.data.config.logLevel}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
export const MemoWorkflowNode = React.memo(WorkflowNode)