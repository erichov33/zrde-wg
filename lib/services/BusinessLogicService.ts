import { 
  WorkflowDefinition, 
  BaseWorkflowNode, 
  WorkflowConnection,
  WorkflowExecutionContext,
  WorkflowNodeType,
  WorkflowPriority
} from '@/lib/types/workflow'
import { WorkflowValidationResult } from "@/lib/types/workflow"
import { ValidationResult } from '@/lib/types/unified-workflow'

export interface BusinessRule {
  id: string
  name: string
  description: string
  category: 'validation' | 'execution' | 'optimization'
  priority: 'low' | 'medium' | 'high' | 'critical'
  condition: (context: any) => boolean
  action: (context: any) => any
}

export interface ValidationRule extends BusinessRule {
  category: 'validation'
  validate: (workflow: WorkflowDefinition, node?: BaseWorkflowNode) => ValidationResult
}

export interface ExecutionRule extends BusinessRule {
  category: 'execution'
  canExecute: (workflow: WorkflowDefinition, context: WorkflowExecutionContext) => { allowed: boolean; reason?: string }
}

export interface OptimizationRule extends BusinessRule {
  category: 'optimization'
  optimize: (workflow: WorkflowDefinition) => { suggestions: string[]; changes: any[] }
}

export class BusinessLogicService {
  private validationRules: ValidationRule[] = []
  private executionRules: ExecutionRule[] = []
  private optimizationRules: OptimizationRule[] = []

  constructor() {
    this.initializeDefaultRules()
  }

  // Rule Management
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule)
  }

  addExecutionRule(rule: ExecutionRule): void {
    this.executionRules.push(rule)
  }

  addOptimizationRule(rule: OptimizationRule): void {
    this.optimizationRules.push(rule)
  }

  // Workflow Processing
  async processWorkflowDefinition(definition: Partial<WorkflowDefinition>): Promise<Partial<WorkflowDefinition>> {
    let processed = { ...definition }

    // Apply default values
    if (!processed.version) {
      processed.version = '1.0.0'
    }

    if (!processed.status) {
      processed.status = 'draft'
    }

    // Apply business rules for workflow metadata
    processed = this.applyWorkflowMetadataRules(processed)

    return processed
  }

  async processWorkflowNode(node: Partial<BaseWorkflowNode>): Promise<BaseWorkflowNode> {
    let processed = { ...node } as BaseWorkflowNode

    // Apply default values based on node type
    processed = this.applyNodeDefaults(processed)

    // Apply business rules for node configuration
    processed = this.applyNodeConfigurationRules(processed)

    return processed
  }

  async processWorkflowConnection(connection: Partial<WorkflowConnection>): Promise<WorkflowConnection> {
    const processed = { ...connection } as WorkflowConnection

    // Apply default values
    if (!processed.label) {
      processed.label = ''
    }

    if (!processed.conditions) {
      processed.conditions = {}
    }

    return processed
  }

  // Validation
  async validateWorkflow(workflow: WorkflowDefinition): Promise<ValidationResult> {
    const allErrors: any[] = []
    const allWarnings: any[] = []

    // Apply all validation rules
    for (const rule of this.validationRules) {
      if (rule.condition(workflow)) {
        const result = rule.validate(workflow)
        allErrors.push(...result.errors)
        allWarnings.push(...result.warnings)
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  }

  async validateNode(workflow: WorkflowDefinition, node: BaseWorkflowNode): Promise<ValidationResult> {
    const allErrors: any[] = []
    const allWarnings: any[] = []

    // Apply node-specific validation rules
    for (const rule of this.validationRules) {
      if (rule.condition({ workflow, node })) {
        const result = rule.validate(workflow, node)
        allErrors.push(...result.errors)
        allWarnings.push(...result.warnings)
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  }

  // Execution Rules
  async canExecuteWorkflow(workflow: WorkflowDefinition, context: WorkflowExecutionContext): Promise<{ allowed: boolean; reason?: string }> {
    for (const rule of this.executionRules) {
      if (rule.condition({ workflow, context })) {
        const result = rule.canExecute(workflow, context)
        if (!result.allowed) {
          return result
        }
      }
    }

    return { allowed: true }
  }

  async canDeleteWorkflow(workflow: WorkflowDefinition): Promise<{ allowed: boolean; reason?: string }> {
    // Check if workflow is in use
    if (workflow.status === 'active') {
      return { 
        allowed: false, 
        reason: 'Cannot delete active workflow' 
      }
    }



    return { allowed: true }
  }

  async canDeleteNode(workflow: WorkflowDefinition, node: BaseWorkflowNode): Promise<{ allowed: boolean; reason?: string }> {
    // Cannot delete start or end nodes if they're the only ones
    if (node.type === 'start') {
      const startNodes = workflow.nodes.filter(n => n.type === 'start')
      if (startNodes.length === 1) {
        return { 
          allowed: false, 
          reason: 'Cannot delete the only start node' 
        }
      }
    }

    if (node.type === 'end') {
      const endNodes = workflow.nodes.filter(n => n.type === 'end')
      if (endNodes.length === 1) {
        return { 
          allowed: false, 
          reason: 'Cannot delete the only end node' 
        }
      }
    }

    return { allowed: true }
  }

  async canConnectNodes(sourceNode: BaseWorkflowNode, targetNode: BaseWorkflowNode): Promise<{ allowed: boolean; reason?: string }> {
    // End nodes cannot have outgoing connections
    if (sourceNode.type === 'end') {
      return { 
        allowed: false, 
        reason: 'End nodes cannot have outgoing connections' 
      }
    }

    // Start nodes cannot have incoming connections
    if (targetNode.type === 'start') {
      return { 
        allowed: false, 
        reason: 'Start nodes cannot have incoming connections' 
      }
    }

    // Cannot connect node to itself
    if (sourceNode.id === targetNode.id) {
      return { 
        allowed: false, 
        reason: 'Cannot connect node to itself' 
      }
    }

    return { allowed: true }
  }

  // Analysis
  async analyzeWorkflow(workflow: WorkflowDefinition): Promise<{
    complexity: number
    performance: {
      estimatedExecutionTime: number
      bottlenecks: string[]
    }
    optimization: {
      suggestions: string[]
      redundantNodes: string[]
    }
  }> {
    const complexity = this.calculateComplexity(workflow)
    const performance = this.analyzePerformance(workflow)
    const optimization = this.analyzeOptimization(workflow)

    return {
      complexity,
      performance,
      optimization
    }
  }

  // Private Methods
  private initializeDefaultRules(): void {
    // Validation Rules
    this.addValidationRule({
      id: 'workflow-must-have-start-node',
      name: 'Workflow Must Have Start Node',
      description: 'Every workflow must have at least one start node',
      category: 'validation',
      priority: 'critical',
      condition: (workflow: WorkflowDefinition) => true,
      action: () => {},
      validate: (workflow: WorkflowDefinition) => {
        const startNodes = workflow.nodes.filter(n => n.type === 'start')
        if (startNodes.length === 0) {
          return {
            isValid: false,
            errors: [{
              code: 'no-start-node',
              message: 'Workflow must have at least one start node',
              severity: 'error' as const
            }],
            warnings: []
          }
        }
        return {
          isValid: true,
          errors: [],
          warnings: []
        }
      }
    })

    this.addValidationRule({
      id: 'workflow-must-have-end-node',
      name: 'Workflow Must Have End Node',
      description: 'Every workflow must have at least one end node',
      category: 'validation',
      priority: 'critical',
      condition: (workflow: WorkflowDefinition) => true,
      action: () => {},
      validate: (workflow: WorkflowDefinition) => {
        const endNodes = workflow.nodes.filter(n => n.type === 'end')
        if (endNodes.length === 0) {
          return {
            isValid: false,
            errors: [{
              code: 'no-end-node',
              message: 'Workflow must have at least one end node',
              severity: 'error' as const
            }],
            warnings: []
          }
        }
        return {
          isValid: true,
          errors: [],
          warnings: []
        }
      }
    })

    this.addValidationRule({
      id: 'condition-nodes-must-have-conditions',
      name: 'Condition Nodes Must Have Conditions',
      description: 'Condition nodes must have at least one condition defined',
      category: 'validation',
      priority: 'high',
      condition: (context: any) => context.node?.type === 'condition',
      action: () => {},
      validate: (workflow: WorkflowDefinition, node?: BaseWorkflowNode) => {
        if (!node || node.type !== 'condition') return {
          isValid: true,
          errors: [],
          warnings: []
        }
        
        if (!node.data.conditions || node.data.conditions.length === 0) {
          return {
            isValid: false,
            errors: [{
              code: 'condition-node-no-conditions',
              message: 'Condition node must have at least one condition',
              nodeId: node.id,
              severity: 'error' as const
            }],
            warnings: []
          }
        }
        return {
          isValid: true,
          errors: [],
          warnings: []
        }
      }
    })

    this.addValidationRule({
      id: 'data-source-nodes-must-have-source',
      name: 'Data Source Nodes Must Have Source',
      description: 'Data source nodes must have a data source configured',
      category: 'validation',
      priority: 'high',
      condition: (context: any) => context.node?.type === 'data_source',
      action: () => {},
      validate: (workflow: WorkflowDefinition, node?: BaseWorkflowNode) => {
        if (!node || node.type !== 'data_source') return {
          isValid: true,
          errors: [],
          warnings: []
        }
        
        if (!node.data.dataSource) {
          return {
            isValid: false,
            errors: [{
              code: 'data-source-node-no-source',
              message: 'Data source node must have a data source configured',
              nodeId: node.id,
              severity: 'error' as const
            }],
            warnings: []
          }
        }
        return {
          isValid: true,
          errors: [],
          warnings: []
        }
      }
    })

    // Execution Rules
    this.addExecutionRule({
      id: 'workflow-must-be-valid',
      name: 'Workflow Must Be Valid',
      description: 'Workflow must pass all validation checks before execution',
      category: 'execution',
      priority: 'critical',
      condition: () => true,
      action: () => {},
      canExecute: (workflow: WorkflowDefinition, context: WorkflowExecutionContext) => {
        // Check if workflow is active
        if (workflow.status !== 'active') {
          return { 
            allowed: false, 
            reason: 'Workflow must be active to execute' 
          }
        }
        
        return { allowed: true }
      }
    })

    this.addExecutionRule({
      id: 'workflow-must-be-active',
      name: 'Workflow Must Be Active',
      description: 'Only active workflows can be executed',
      category: 'execution',
      priority: 'high',
      condition: () => true,
      action: () => {},
      canExecute: (workflow: WorkflowDefinition) => {
        if (workflow.status !== 'active' && workflow.status !== 'draft') {
          return { 
            allowed: false, 
            reason: `Cannot execute workflow with status: ${workflow.status}` 
          }
        }
        
        return { allowed: true }
      }
    })
  }

  private applyWorkflowMetadataRules(workflow: Partial<WorkflowDefinition>): Partial<WorkflowDefinition> {
    const processed = { ...workflow }

    // Ensure metadata exists with all required fields
    if (!processed.metadata) {
      const now = new Date()
      processed.metadata = {
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system',
        tags: [],
        category: 'general',
        priority: 'medium' as const,
        estimatedExecutionTime: 0,
        dependencies: []
      }
    } else {
      // Ensure all required fields are present
      const now = new Date()
      if (!processed.metadata.createdAt) {
        processed.metadata.createdAt = now
      }
      if (!processed.metadata.updatedAt) {
        processed.metadata.updatedAt = now
      }
      if (!processed.metadata.createdBy) {
        processed.metadata.createdBy = 'system'
      }
      if (!processed.metadata.updatedBy) {
        processed.metadata.updatedBy = 'system'
      }
      if (!processed.metadata.tags) {
        processed.metadata.tags = []
      }
      if (!processed.metadata.category) {
        processed.metadata.category = 'general'
      }
      if (!processed.metadata.priority) {
        processed.metadata.priority = 'medium' as const
      }
      if (processed.metadata.estimatedExecutionTime === undefined) {
        processed.metadata.estimatedExecutionTime = 0
      }
      if (!processed.metadata.dependencies) {
        processed.metadata.dependencies = []
      }
    }

    return processed
  }

  private applyNodeDefaults(node: BaseWorkflowNode): BaseWorkflowNode {
    const processed = { ...node }

    // Ensure data object exists
    if (!processed.data) {
      processed.data = { label: `${node.type} Node` }
    }

    // Apply type-specific defaults
    switch (node.type) {
      case 'condition':
        if (!processed.data.conditions) {
          processed.data.conditions = []
        }
        break
      case 'data_source':
        if (!processed.data.dataSource) {
          processed.data.dataSource = { 
            id: `ds-${Date.now()}`,
            name: 'Default Data Source',
            type: 'custom_api',
            endpoint: '',
            timeout: 5000,
            fieldMapping: []
          }
        }
        break
      case 'rule_set':
        if (!processed.data.rules) {
          processed.data.rules = []
        }
        break
      case 'action':
      case 'decision':
        if (!processed.data.businessLogic) {
          processed.data.businessLogic = {
            functionName: 'defaultFunction',
            parameters: {},
            returnType: 'object',
            description: 'Default business logic function'
          }
        }
        break
      case 'validation':
        if (!processed.data.validation) {
          processed.data.validation = {
            rules: [],
            onFailure: 'stop_execution'
          }
        }
        break
    }

    return processed
  }

  private applyNodeConfigurationRules(node: BaseWorkflowNode): BaseWorkflowNode {
    const processed = { ...node }

    // Ensure required fields based on business rules
    if (!processed.data.label) {
      processed.data.label = `${node.type.replace('_', ' ')} Node`
    }

    // Apply naming conventions
    if (processed.data.label) {
      processed.data.label = this.formatNodeLabel(processed.data.label)
    }

    return processed
  }

  private formatNodeLabel(label: string): string {
    // Capitalize first letter and ensure proper formatting
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  private calculateComplexity(workflow: WorkflowDefinition): number {
    const nodeCount = workflow.nodes.length
    const connectionCount = workflow.connections.length
    const conditionCount = workflow.nodes
      .filter(n => n.type === 'condition')
      .reduce((sum, n) => sum + (n.data.conditions?.length || 0), 0)

    // Simple complexity calculation
    return nodeCount + (connectionCount * 0.5) + (conditionCount * 2)
  }

  private analyzePerformance(workflow: WorkflowDefinition): {
    estimatedExecutionTime: number
    bottlenecks: string[]
  } {
    const bottlenecks: string[] = []
    let estimatedTime = 0

    // Analyze each node type for performance impact
    workflow.nodes.forEach(node => {
      switch (node.type) {
        case 'data_source':
          estimatedTime += 100 // ms
          if (node.data.dataSource?.type === 'credit_bureau') {
            bottlenecks.push(`Database query in node: ${node.data.label}`)
          }
          break
        case 'condition':
          estimatedTime += 10 * (node.data.conditions?.length || 1)
          if ((node.data.conditions?.length || 0) > 5) {
            bottlenecks.push(`Complex condition logic in node: ${node.data.label}`)
          }
          break
        case 'rule_set':
          estimatedTime += 20 * (node.data.rules?.length || 1)
          break
        default:
          estimatedTime += 5
      }
    })

    return {
      estimatedExecutionTime: estimatedTime,
      bottlenecks
    }
  }

  private analyzeOptimization(workflow: WorkflowDefinition): {
    suggestions: string[]
    redundantNodes: string[]
  } {
    const suggestions: string[] = []
    const redundantNodes: string[] = []

    // Check for redundant nodes
    const nodesByType = workflow.nodes.reduce((acc, node) => {
      if (!acc[node.type]) acc[node.type] = []
      acc[node.type]!.push(node)
      return acc
    }, {} as Record<string, BaseWorkflowNode[]>)

    // Look for potential redundancies
    Object.entries(nodesByType).forEach(([type, nodes]) => {
      if (nodes.length > 1 && type !== 'condition' && type !== 'action') {
        const duplicates = this.findDuplicateNodes(nodes)
        redundantNodes.push(...duplicates.map(n => n.id))
      }
    })

    // Generate optimization suggestions
    if (workflow.nodes.length > 20) {
      suggestions.push('Consider breaking this workflow into smaller sub-workflows')
    }

    if (workflow.connections.length > workflow.nodes.length * 1.5) {
      suggestions.push('Workflow has high connection density - consider simplifying the flow')
    }

    const conditionNodes = workflow.nodes.filter(n => n.type === 'condition')
    if (conditionNodes.length > 5) {
      suggestions.push('Consider consolidating condition nodes to reduce complexity')
    }

    return {
      suggestions,
      redundantNodes
    }
  }

  private findDuplicateNodes(nodes: BaseWorkflowNode[]): BaseWorkflowNode[] {
    const duplicates: BaseWorkflowNode[] = []
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeI = nodes[i]
        const nodeJ = nodes[j]
        if (nodeI && nodeJ && this.areNodesSimilar(nodeI, nodeJ)) {
          duplicates.push(nodeJ)
        }
      }
    }

    return duplicates
  }

  private areNodesSimilar(node1: BaseWorkflowNode, node2: BaseWorkflowNode): boolean {
    // Simple similarity check - can be enhanced
    return (
      node1.type === node2.type &&
      JSON.stringify(node1.data) === JSON.stringify(node2.data)
    )
  }
}