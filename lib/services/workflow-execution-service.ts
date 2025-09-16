import { RuleEngine, RuleSet, Rule, ExecutionContext } from '@/lib/engines/rule-engine'
import { EnhancedDecisionService } from './enhanced-decision-service'

export interface WorkflowNode {
  id: string
  type: 'start' | 'decision' | 'action' | 'end' | 'condition' | 'data-source' | 'approval'
  name: string
  config: Record<string, any>
  position: { x: number; y: number }
  ruleSetId?: string
  dataSourceId?: string
}

export interface WorkflowConnection {
  id: string
  sourceId: string
  targetId: string
  condition?: string
  label?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  version: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  ruleSets: RuleSet[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ExecutionResult {
  workflowId: string
  executionId: string
  status: 'success' | 'error' | 'pending'
  result: any
  executionPath: string[]
  executionTime: number
  errors?: string[]
  logs: ExecutionLog[]
}

export interface ExecutionLog {
  timestamp: Date
  nodeId: string
  nodeName: string
  action: string
  input: any
  output: any
  duration: number
  status: 'success' | 'error' | 'skipped'
  message?: string
}

export interface ExecutionRequest {
  workflowId: string
  input: Record<string, any>
  context?: Record<string, any>
  simulationMode?: boolean
  userId?: string
}

export class WorkflowExecutionService {
  private ruleEngine: RuleEngine
  private decisionService: EnhancedDecisionService
  private workflows: Map<string, Workflow> = new Map()
  private executions: Map<string, ExecutionResult> = new Map()

  constructor() {
    this.ruleEngine = new RuleEngine()
    this.decisionService = new EnhancedDecisionService()
    this.initializeDefaultWorkflows()
  }

  private initializeDefaultWorkflows() {
    // Sample workflow for loan approval
    const loanApprovalWorkflow: Workflow = {
      id: 'loan-approval-v1',
      name: 'Loan Approval Workflow',
      description: 'Automated loan approval process with risk assessment',
      version: '1.0.0',
      nodes: [
        {
          id: 'start',
          type: 'start',
          name: 'Start',
          config: {},
          position: { x: 100, y: 100 }
        },
        {
          id: 'data-collection',
          type: 'data-source',
          name: 'Collect Application Data',
          config: {
            dataSources: ['credit-bureau', 'bank-statements', 'employment-verification']
          },
          position: { x: 300, y: 100 },
          dataSourceId: 'credit-bureau'
        },
        {
          id: 'risk-assessment',
          type: 'decision',
          name: 'Risk Assessment',
          config: {
            ruleSetId: 'risk-assessment-rules'
          },
          position: { x: 500, y: 100 },
          ruleSetId: 'risk-assessment-rules'
        },
        {
          id: 'auto-approve',
          type: 'action',
          name: 'Auto Approve',
          config: {
            action: 'approve',
            reason: 'Low risk profile'
          },
          position: { x: 700, y: 50 }
        },
        {
          id: 'manual-review',
          type: 'approval',
          name: 'Manual Review Required',
          config: {
            reviewers: ['senior-underwriter'],
            timeout: 24 * 60 * 60 * 1000 // 24 hours
          },
          position: { x: 700, y: 150 }
        },
        {
          id: 'auto-reject',
          type: 'action',
          name: 'Auto Reject',
          config: {
            action: 'reject',
            reason: 'High risk profile'
          },
          position: { x: 700, y: 250 }
        },
        {
          id: 'end',
          type: 'end',
          name: 'End',
          config: {},
          position: { x: 900, y: 150 }
        }
      ],
      connections: [
        { id: 'c1', sourceId: 'start', targetId: 'data-collection' },
        { id: 'c2', sourceId: 'data-collection', targetId: 'risk-assessment' },
        { id: 'c3', sourceId: 'risk-assessment', targetId: 'auto-approve', condition: 'risk_score < 0.3' },
        { id: 'c4', sourceId: 'risk-assessment', targetId: 'manual-review', condition: 'risk_score >= 0.3 && risk_score < 0.7' },
        { id: 'c5', sourceId: 'risk-assessment', targetId: 'auto-reject', condition: 'risk_score >= 0.7' },
        { id: 'c6', sourceId: 'auto-approve', targetId: 'end' },
        { id: 'c7', sourceId: 'manual-review', targetId: 'end' },
        { id: 'c8', sourceId: 'auto-reject', targetId: 'end' }
      ],
      ruleSets: [
        {
          id: 'risk-assessment-rules',
          name: 'Risk Assessment Rules',
          description: 'Rules for calculating loan risk score',
          rules: [
            {
              id: 'credit-score-rule',
              name: 'Credit Score Assessment',
              description: 'Evaluate credit score impact',
              conditions: [
                {
                  field: 'credit_score',
                  operator: 'gte',
                  value: 750,
                  dataType: 'number'
                }
              ],
              actions: [
                {
                  type: 'set_variable',
                  target: 'credit_risk',
                  value: 0.1
                }
              ],
              priority: 1,
              isActive: true
            },
            {
              id: 'income-rule',
              name: 'Income Verification',
              description: 'Assess income stability',
              conditions: [
                {
                  field: 'annual_income',
                  operator: 'gte',
                  value: 50000,
                  dataType: 'number'
                },
                {
                  field: 'employment_years',
                  operator: 'gte',
                  value: 2,
                  dataType: 'number'
                }
              ],
              actions: [
                {
                  type: 'set_variable',
                  target: 'income_risk',
                  value: 0.2
                }
              ],
              priority: 2,
              isActive: true
            }
          ],
          aggregation: {
            method: 'weighted_average',
            weights: { credit_risk: 0.6, income_risk: 0.4 },
            outputVariable: 'risk_score'
          },
          isActive: true
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.workflows.set(loanApprovalWorkflow.id, loanApprovalWorkflow)
  }

  async executeWorkflow(request: ExecutionRequest): Promise<ExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()
    
    const result: ExecutionResult = {
      workflowId: request.workflowId,
      executionId,
      status: 'pending',
      result: null,
      executionPath: [],
      executionTime: 0,
      logs: []
    }

    try {
      const workflow = this.workflows.get(request.workflowId)
      if (!workflow) {
        throw new Error(`Workflow not found: ${request.workflowId}`)
      }

      // Initialize execution context
      const context: ExecutionContext = {
        variables: { ...request.input, ...request.context },
        metadata: {
          workflowId: request.workflowId,
          executionId,
          userId: request.userId,
          simulationMode: request.simulationMode || false
        }
      }

      // Find start node
      const startNode = workflow.nodes.find(node => node.type === 'start')
      if (!startNode) {
        throw new Error('No start node found in workflow')
      }

      // Execute workflow
      const executionResult = await this.executeNode(workflow, startNode, context, result)
      
      result.status = 'success'
      result.result = executionResult
      result.executionTime = Date.now() - startTime

    } catch (error) {
      result.status = 'error'
      result.errors = [error instanceof Error ? error.message : 'Unknown error']
      result.executionTime = Date.now() - startTime
    }

    this.executions.set(executionId, result)
    return result
  }

  private async executeNode(
    workflow: Workflow, 
    node: WorkflowNode, 
    context: ExecutionContext, 
    result: ExecutionResult
  ): Promise<any> {
    const nodeStartTime = Date.now()
    result.executionPath.push(node.id)

    const log: ExecutionLog = {
      timestamp: new Date(),
      nodeId: node.id,
      nodeName: node.name,
      action: `execute_${node.type}`,
      input: { ...context.variables },
      output: null,
      duration: 0,
      status: 'success'
    }

    try {
      let nodeResult: any = null

      switch (node.type) {
        case 'start':
          nodeResult = await this.executeStartNode(node, context)
          break
        case 'data-source':
          nodeResult = await this.executeDataSourceNode(node, context)
          break
        case 'decision':
          nodeResult = await this.executeDecisionNode(workflow, node, context)
          break
        case 'condition':
          nodeResult = await this.executeConditionNode(node, context)
          break
        case 'action':
          nodeResult = await this.executeActionNode(node, context)
          break
        case 'approval':
          nodeResult = await this.executeApprovalNode(node, context)
          break
        case 'end':
          nodeResult = await this.executeEndNode(node, context)
          break
        default:
          throw new Error(`Unknown node type: ${node.type}`)
      }

      log.output = nodeResult
      log.duration = Date.now() - nodeStartTime
      result.logs.push(log)

      // Update context with node result
      if (nodeResult && typeof nodeResult === 'object') {
        Object.assign(context.variables, nodeResult)
      }

      // Find and execute next node(s)
      if (node.type !== 'end') {
        const nextNode = await this.findNextNode(workflow, node, context)
        if (nextNode) {
          return await this.executeNode(workflow, nextNode, context, result)
        }
      }

      return nodeResult

    } catch (error) {
      log.status = 'error'
      log.message = error instanceof Error ? error.message : 'Unknown error'
      log.duration = Date.now() - nodeStartTime
      result.logs.push(log)
      throw error
    }
  }

  private async executeStartNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    return { status: 'started', timestamp: new Date() }
  }

  private async executeDataSourceNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { dataSources } = node.config
    const results: Record<string, any> = {}

    for (const dataSourceId of dataSources || []) {
      // Simulate data source call
      const data = await this.fetchDataFromSource(dataSourceId, context.variables)
      results[dataSourceId] = data
    }

    return results
  }

  private async executeDecisionNode(workflow: Workflow, node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const ruleSet = workflow.ruleSets.find(rs => rs.id === node.ruleSetId)
    if (!ruleSet) {
      throw new Error(`RuleSet not found: ${node.ruleSetId}`)
    }

    const decision = await this.ruleEngine.executeRuleSet(ruleSet, context)
    return decision
  }

  private async executeConditionNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { condition } = node.config
    const result = this.evaluateCondition(condition, context.variables)
    return { conditionResult: result }
  }

  private async executeActionNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { action, reason } = node.config
    
    // Simulate action execution
    if (!context.metadata.simulationMode) {
      // In real mode, execute actual action
      await this.performAction(action, context.variables)
    }

    return { action, reason, executed: !context.metadata.simulationMode }
  }

  private async executeApprovalNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { reviewers, timeout } = node.config
    
    if (context.metadata.simulationMode) {
      // In simulation mode, auto-approve for testing
      return { status: 'approved', reviewer: 'simulation', timestamp: new Date() }
    }

    // In real mode, create approval request
    return {
      status: 'pending_approval',
      reviewers,
      timeout,
      requestId: `approval_${Date.now()}`
    }
  }

  private async executeEndNode(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    return { 
      status: 'completed', 
      timestamp: new Date(),
      finalResult: context.variables 
    }
  }

  private async findNextNode(workflow: Workflow, currentNode: WorkflowNode, context: ExecutionContext): Promise<WorkflowNode | null> {
    const connections = workflow.connections.filter(conn => conn.sourceId === currentNode.id)
    
    for (const connection of connections) {
      if (!connection.condition || this.evaluateCondition(connection.condition, context.variables)) {
        const nextNode = workflow.nodes.find(node => node.id === connection.targetId)
        if (nextNode) {
          return nextNode
        }
      }
    }

    return null
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      // Simple condition evaluation - in production, use a proper expression parser
      const sanitizedCondition = condition.replace(/[^a-zA-Z0-9_\s<>=!&|().,]/g, '')
      
      // Replace variable names with their values
      let evaluableCondition = sanitizedCondition
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'g')
        evaluableCondition = evaluableCondition.replace(regex, JSON.stringify(variables[key]))
      })

      // Replace operators
      evaluableCondition = evaluableCondition
        .replace(/\s+and\s+/gi, ' && ')
        .replace(/\s+or\s+/gi, ' || ')
        .replace(/\s+not\s+/gi, ' ! ')

      return Function(`"use strict"; return (${evaluableCondition})`)()
    } catch (error) {
      console.warn('Condition evaluation failed:', condition, error)
      return false
    }
  }

  private async fetchDataFromSource(dataSourceId: string, variables: Record<string, any>): Promise<any> {
    // Simulate external data source calls
    const mockData: Record<string, any> = {
      'credit-bureau': {
        credit_score: 720,
        credit_history_length: 8,
        open_accounts: 3,
        total_debt: 15000
      },
      'bank-statements': {
        average_monthly_income: 5500,
        average_monthly_expenses: 3200,
        account_balance: 12000
      },
      'employment-verification': {
        employment_status: 'employed',
        employment_years: 3,
        annual_income: 66000,
        employer: 'Tech Corp'
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return mockData[dataSourceId] || {}
  }

  private async performAction(action: string, variables: Record<string, any>): Promise<void> {
    // Simulate action execution
    console.log(`Executing action: ${action}`, variables)
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // Public methods for workflow management
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId)
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values())
  }

  saveWorkflow(workflow: Workflow): void {
    workflow.updatedAt = new Date()
    this.workflows.set(workflow.id, workflow)
  }

  getExecution(executionId: string): ExecutionResult | undefined {
    return this.executions.get(executionId)
  }

  getExecutionHistory(workflowId: string): ExecutionResult[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => b.executionTime - a.executionTime)
  }

  async validateWorkflow(workflow: Workflow): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Check for start node
    const startNodes = workflow.nodes.filter(node => node.type === 'start')
    if (startNodes.length === 0) {
      errors.push('Workflow must have a start node')
    } else if (startNodes.length > 1) {
      errors.push('Workflow can only have one start node')
    }

    // Check for end node
    const endNodes = workflow.nodes.filter(node => node.type === 'end')
    if (endNodes.length === 0) {
      errors.push('Workflow must have at least one end node')
    }

    // Check for orphaned nodes
    const connectedNodeIds = new Set([
      ...workflow.connections.map(c => c.sourceId),
      ...workflow.connections.map(c => c.targetId)
    ])
    
    const orphanedNodes = workflow.nodes.filter(node => 
      node.type !== 'start' && !connectedNodeIds.has(node.id)
    )
    
    if (orphanedNodes.length > 0) {
      errors.push(`Orphaned nodes found: ${orphanedNodes.map(n => n.name).join(', ')}`)
    }

    // Validate rule sets
    for (const ruleSet of workflow.ruleSets) {
      const ruleSetValidation = await this.ruleEngine.validateRuleSet(ruleSet)
      if (!ruleSetValidation.isValid) {
        errors.push(`RuleSet ${ruleSet.name}: ${ruleSetValidation.errors.join(', ')}`)
      }
    }

    return { isValid: errors.length === 0, errors }
  }
}

// Export singleton instance
export const workflowExecutionService = new WorkflowExecutionService()