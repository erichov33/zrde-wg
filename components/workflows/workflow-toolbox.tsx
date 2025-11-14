"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Play, GitBranch, Zap, Square, Database, Shield, 
  Brain, Package, Bell, FileText, Workflow, 
  CheckCircle, AlertTriangle, Settings, Cloud,
  BarChart3, Clock, Filter, Shuffle
} from "lucide-react"
import type { WorkflowNode } from "@/lib/types/unified-workflow"

interface WorkflowToolboxProps {
  onAddNode: (type: WorkflowNode["type"], label: string) => void
}

/**
 * Configuration for different workflow node types organized by category
 */
const NODE_CATEGORIES = {
  trigger: {
    title: '🚀 Triggers',
    description: 'Start your workflow when events occur',
    color: 'border-green-200 bg-green-50',
    nodes: [
      {
        type: 'start' as const,
        label: 'Start Trigger',
        description: 'Begins workflow when a specific event happens (e.g., new application submitted)',
        icon: Play,
        color: 'text-green-600',
        examples: ['New application', 'File upload', 'Timer event', 'API call']
      }
    ]
  },
  logic: {
    title: '🧠 Logic & Decisions',
    description: 'Control flow with conditions and branching',
    color: 'border-blue-200 bg-blue-50',
    nodes: [
      {
        type: 'condition' as const,
        label: 'Condition',
        description: 'Evaluates if/else logic with YES/NO branches (e.g., if loan ≤ 1221)',
        icon: GitBranch,
        color: 'text-yellow-600',
        examples: ['Amount check', 'Status validation', 'Date comparison']
      },
      {
        type: 'decision' as const,
        label: 'Decision Point',
        description: 'Multi-path decision making with multiple outcomes',
        icon: Filter,
        color: 'text-blue-600',
        examples: ['Risk assessment', 'Category routing', 'Priority assignment']
      },
      {
        type: 'ai_decision' as const,
        label: 'AI Decision',
        description: 'AI-powered intelligent decision making',
        icon: Brain,
        color: 'text-purple-600',
        examples: ['Fraud detection', 'Content analysis', 'Recommendation']
      },
      {
        type: 'rule_set' as const,
        label: 'Business Rules',
        description: 'Apply complex business rules and policies',
        icon: Settings,
        color: 'text-orange-600',
        examples: ['Compliance check', 'Policy validation', 'Rule engine']
      },
      {
        type: 'validation' as const,
        label: 'Validation',
        description: 'Validate data, formats, or business conditions',
        icon: CheckCircle,
        color: 'text-cyan-600',
        examples: ['Data format', 'Required fields', 'Business logic']
      }
    ]
  },
  action: {
    title: '⚡ Actions',
    description: 'Execute tasks and operations',
    color: 'border-red-200 bg-red-50',
    nodes: [
      {
        type: 'action' as const,
        label: 'Action',
        description: 'Performs specific tasks (e.g., approve request, update database)',
        icon: Zap,
        color: 'text-red-600',
        examples: ['Send email', 'Update record', 'Create document', 'API call']
      },
      {
        type: 'batch_process' as const,
        label: 'Batch Process',
        description: 'Process multiple items or bulk operations',
        icon: Package,
        color: 'text-indigo-600',
        examples: ['Bulk update', 'Mass email', 'Data migration']
      },
      {
        type: 'notification' as const,
        label: 'Notification',
        description: 'Send alerts, emails, or messages',
        icon: Bell,
        color: 'text-pink-600',
        examples: ['Email alert', 'SMS notification', 'Slack message']
      }
    ]
  },
  data: {
    title: '💾 Data & Integration',
    description: 'Connect to data sources and external systems',
    color: 'border-purple-200 bg-purple-50',
    nodes: [
      {
        type: 'data_source' as const,
        label: 'Data Source',
        description: 'Connect to databases, APIs, or data repositories',
        icon: Database,
        color: 'text-teal-600',
        examples: ['Database query', 'API fetch', 'File read']
      },
      {
        type: 'integration' as const,
        label: 'Integration',
        description: 'Connect to external systems and services',
        icon: Cloud,
        color: 'text-violet-600',
        examples: ['CRM sync', 'Payment gateway', 'Third-party API']
      },
      {
        type: 'audit_log' as const,
        label: 'Audit Log',
        description: 'Log activities and maintain audit trails',
        icon: FileText,
        color: 'text-amber-600',
        examples: ['Activity log', 'Compliance record', 'Change tracking']
      }
    ]
  },
  end: {
    title: '🏁 Completion',
    description: 'End workflow with defined outcomes',
    color: 'border-gray-200 bg-gray-50',
    nodes: [
      {
        type: 'end' as const,
        label: 'End/Conclusion',
        description: 'Marks workflow completion with final outcome (e.g., approved, rejected)',
        icon: Square,
        color: 'text-gray-600',
        examples: ['Application approved', 'Request rejected', 'Process completed']
      }
    ]
  }
} as const

/**
 * Predefined workflow templates for common use cases
 */
const WORKFLOW_TEMPLATES = {
  financial: [
    { name: "Credit Assessment", description: "Automated credit scoring workflow" },
    { name: "Fraud Detection", description: "Real-time fraud analysis" },
    { name: "Risk Evaluation", description: "Comprehensive risk assessment" },
  ],
  compliance: [
    { name: "KYC Compliance", description: "Know Your Customer verification" },
    { name: "AML Screening", description: "Anti-money laundering checks" },
    { name: "Regulatory Reporting", description: "Automated compliance reports" },
  ],
  operations: [
    { name: "Document Processing", description: "Automated document workflow" },
    { name: "Approval Chain", description: "Multi-level approval process" },
    { name: "Data Migration", description: "Batch data processing workflow" },
  ]
} as const

/**
 * WorkflowToolbox component provides a sidebar with categorized node types and templates
 * Users can click on node types to add them to the workflow canvas
 */
export function WorkflowToolbox({ onAddNode }: WorkflowToolboxProps) {
  /**
   * Handles adding a new node to the workflow
   */
  const handleAddNode = (type: WorkflowNode["type"], label: string) => {
    onAddNode(type, label)
  }

  /**
   * Renders a single node type button
   */
  const renderNodeTypeButton = (nodeType: any) => {
    const IconComponent = nodeType.icon
    
    return (
      <Button
        key={nodeType.type}
        variant="ghost"
        className="w-full justify-start gap-3 h-auto p-3 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 hover:shadow-sm"
        onClick={() => handleAddNode(nodeType.type, nodeType.label)}
      >
        <div className={`flex-shrink-0 p-2 rounded-lg bg-gray-100 ${nodeType.color}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-sm text-gray-800">{nodeType.label}</p>
          <p className="text-xs text-gray-600 leading-relaxed">{nodeType.description}</p>
        </div>
      </Button>
    )
  }

  /**
   * Renders a category of node types
   */
  const renderNodeCategory = (categoryKey: string, category: any) => (
    <div key={categoryKey} className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground px-2">
        {category.title}
      </h4>
      <div className="space-y-1">
        {category.nodes.map(renderNodeTypeButton)}
      </div>
    </div>
  )

  /**
   * Renders a template button
   */
  const renderTemplateButton = (template: { name: string; description: string }) => (
    <Button 
      key={template.name}
      variant="outline" 
      className="w-full justify-start bg-transparent h-auto p-3" 
      size="sm"
    >
      <div className="text-left">
        <p className="font-medium text-sm">{template.name}</p>
        <p className="text-xs text-muted-foreground">{template.description}</p>
      </div>
    </Button>
  )

  /**
   * Renders a template category
   */
  const renderTemplateCategory = (
    categoryKey: string,
    templates: ReadonlyArray<{ name: string; description: string }>
  ) => (
    <div key={categoryKey} className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground px-2 capitalize">
        {categoryKey}
      </h4>
      <div className="space-y-1">
        {templates.map(renderTemplateButton)}
      </div>
    </div>
  )

  return (
    <div className="w-96 bg-gradient-to-b from-gray-50 to-white border-r-2 border-gray-200 h-full overflow-y-auto shadow-lg">
      <div className="p-6 border-b-2 border-gray-200 bg-white">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          Workflow Toolbox
        </h2>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          🎯 <strong>Drag nodes</strong> to the canvas to build your workflow<br/>
          🔗 <strong>Connect nodes</strong> to create the flow path<br/>
          ⚡ <strong>Branch conditions</strong> to handle different outcomes
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Node Types Section */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
              <Workflow className="h-5 w-5 text-blue-600" />
              Workflow Nodes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {Object.entries(NODE_CATEGORIES).map(([key, category]) => 
              renderNodeCategory(key, category)
            )}
          </CardContent>
        </Card>

        {/* Templates Section */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {Object.entries(WORKFLOW_TEMPLATES).map(([key, templates]) => 
              renderTemplateCategory(key, templates)
            )}
          </CardContent>
        </Card>
        
        {/* Help section */}
        <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <h4 className="text-sm font-bold text-blue-800 mb-2">💡 How to Build Workflows</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div><strong>1.</strong> Start with a <strong>Start</strong> node</div>
            <div><strong>2.</strong> Add <strong>Conditions</strong> for decision points</div>
            <div><strong>3.</strong> Connect <strong>Actions</strong> to each branch</div>
            <div><strong>4.</strong> End with <strong>End</strong> nodes</div>
          </div>
        </div>
      </div>
    </div>
  )
}
