import { RuleEngine, RuleSet, Rule, ApplicationData, ExternalData, UserContext } from '@/lib/engines/rule-engine'
import { EnhancedDecisionService } from './enhanced-decision-service'

// Enhanced type definitions to replace 'any' types
export interface NodeConfig {
  // Common config properties
  name?: string
  description?: string
  
  // Decision node specific
  ruleSetId?: string
  decisionLogic?: string
  
  // Data source node specific
  dataSourceId?: string
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  
  // Action node specific
  actionType?: 'email' | 'webhook' | 'database' | 'api_call' | 'notification'
  actionConfig?: {
    url?: string
    method?: string
    payload?: Record<string, unknown>
    template?: string
  }
  
  // Approval node specific
  approvers?: string[]
  approvalType?: 'single' | 'multiple' | 'unanimous'
  timeoutHours?: number
  
  // Condition node specific
  condition?: string
  operator?: string
  value?: unknown
  
  [key: string]: unknown // Allow additional config
}

export interface WorkflowNode {
  id: string
  type: 'start' | 'decision' | 'action' | 'end' | 'condition' | 'data-source' | 'approval'
  name: string
  config: NodeConfig
  position: { x: number; y: number }
  ruleSetId?: string
  dataSourceId?: string
}

export interface WorkflowConnection {
  id: string
  sourceId: string
  targetId: string
  condition?: string
  conditions?: Record<string, string> | string
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

export interface NodeExecutionInput {
  applicationData?: ApplicationData
  externalData?: ExternalData
  userContext?: UserContext
  previousResults?: Record<string, unknown>
  variables?: Record<string, unknown>
  [key: string]: unknown
}

export interface NodeExecutionOutput {
  success: boolean
  data?: Record<string, unknown>
  nextNodeId?: string
  error?: string
  variables?: Record<string, unknown>
  [key: string]: unknown
}

export interface ExecutionResult {
  workflowId: string
  executionId: string
  status: 'success' | 'error' | 'pending' | 'timeout' | 'cancelled'
  result: NodeExecutionOutput
  executionPath: string[]
  executionTime: number
  errors?: string[]
  logs: ExecutionLog[]
  metrics?: ExecutionMetrics
  parallelBranches?: ParallelBranchResult[]
}

export interface ExecutionLog {
  timestamp: Date
  nodeId: string
  nodeName: string
  action: string
  input: NodeExecutionInput
  output: NodeExecutionOutput
  duration: number
  status: 'success' | 'error' | 'skipped'
  message?: string
}

export interface ExecutionRequest {
  workflowId: string
  input: NodeExecutionInput
  context?: Record<string, unknown>
  simulationMode?: boolean
  userId?: string
  options?: ExecutionOptions
}

export interface ExecutionOptions {
  enableParallelExecution?: boolean
  maxParallelBranches?: number
  timeout?: number
  retryConfig?: RetryConfig
  enableMetrics?: boolean
  enableDetailedLogging?: boolean
  priority?: 'low' | 'normal' | 'high'
  tags?: string[]
}

export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  backoffMultiplier?: number
  retryableErrors?: string[]
}

export interface ExecutionMetrics {
  startTime: Date
  endTime?: Date
  totalDuration?: number
  nodeExecutionTimes: Record<string, number>
  memoryUsage?: number
  cpuUsage?: number
  parallelBranchesExecuted?: number
  retriesPerformed?: number
  totalNodes: number
  executedNodes: number
  skippedNodes: number
  failedNodes: number
  retryCount: number
  averageNodeTime: number
}

export interface ParallelBranchResult {
  branchId: string
  nodes: string[]
  status: 'pending' | 'success' | 'error'
  executionTime: number
  error?: string
}

// Enhanced ExecutionContext with proper typing
export interface ExecutionContext {
  applicationData: ApplicationData
  externalData?: ExternalData
  userContext?: UserContext
  variables: Record<string, unknown>
  executionId: string
  simulationMode: boolean
  options: ExecutionOptions
  metrics: ExecutionMetrics
  startTime: Date
  [key: string]: unknown
}

export class WorkflowExecutionService {
  private ruleEngine: RuleEngine
  private decisionService: EnhancedDecisionService
  private workflows: Map<string, Workflow> = new Map()
  private executions: Map<string, ExecutionResult> = new Map()
  private activeExecutions: Map<string, AbortController> = new Map()
  private executionQueue: ExecutionRequest[] = []
  private isProcessingQueue: boolean = false

  constructor() {
    this.ruleEngine = new RuleEngine()
    this.decisionService = new EnhancedDecisionService()
    this.initializeDefaultWorkflows()
    this.startQueueProcessor()
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
          executionOrder: 'sequential',
          rules: [
            {
              id: 'credit-score-rule',
              name: 'Credit Score Assessment', 
              description: 'Evaluate credit score impact',
              conditions: [
                {
                  id: 'credit_score_rule_check',
                  field: 'credit_score',
                  operator: 'greater_than_or_equal',
                  value: 750,
                  dataType: 'number'
                }
              ],
              logicalOperator: 'AND',
              actions: [
                {
                  type: 'set_score',
                  value: 0.1
                }
              ],
              priority: 1,
              enabled: true
            },
            {
              id: 'income-rule',
              name: 'Income Verification',
              description: 'Assess income stability',
              conditions: [
                {
                  id: 'annual_income_rule_check',
                  field: 'annual_income',
                  operator: 'greater_than_or_equal',
                  value: 50000,
                  dataType: 'number'
                },
                {
                  id: 'employment_years_rule_check',
                  field: 'employment_years',
                  operator: 'greater_than_or_equal',
                  value: 2,
                  dataType: 'number'
                }
              ],
              logicalOperator: 'AND',
              actions: [
                {
                  type: 'set_score',
                  value: 0.2
                }
              ],
              priority: 2,
              enabled: true
            }
          ]
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.workflows.set(loanApprovalWorkflow.id, loanApprovalWorkflow)
  }

  async executeWorkflow(request: ExecutionRequest): Promise<ExecutionResult> {
    const workflow = this.workflows.get(request.workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${request.workflowId} not found`)
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const options: ExecutionOptions = {
      enableParallelExecution: false,
      maxParallelBranches: 3,
      timeout: 300000, // 5 minutes default
      enableMetrics: true,
      enableDetailedLogging: true,
      priority: 'normal',
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'TEMPORARY_FAILURE']
      },
      ...request.options
    }

    const context: ExecutionContext = {
      applicationData: request.input.applicationData || {} as ApplicationData,
      externalData: request.input.externalData,
      userContext: request.input.userContext,
      variables: { ...request.input, ...request.context },
      executionId,
      simulationMode: request.simulationMode || false,
      options,
      metrics: {
        startTime: new Date(),
        endTime: undefined,
        totalDuration: undefined,
        nodeExecutionTimes: {},
        memoryUsage: undefined,
        cpuUsage: undefined,
        parallelBranchesExecuted: undefined,
        retriesPerformed: undefined,
        totalNodes: workflow.nodes.length,
        executedNodes: 0,
        skippedNodes: 0,
        failedNodes: 0,
        retryCount: 0,
        averageNodeTime: 0
      },
      startTime: new Date(),
      metadata: {
        workflowId: request.workflowId,
        executionId,
        userId: request.userId,
        simulationMode: request.simulationMode || false
      }
    }

    const result: ExecutionResult = {
      workflowId: request.workflowId,
      executionId,
      status: 'pending',
      result: { success: false },
      executionPath: [],
      executionTime: 0,
      logs: [],
      metrics: context.metrics,
      parallelBranches: []
    }

    // Set up abort controller for timeout and cancellation
    const abortController = new AbortController()
    this.activeExecutions.set(executionId, abortController)

    // Set up timeout
    const timeoutId = setTimeout(() => {
      abortController.abort()
      result.status = 'timeout'
    }, options.timeout!)

    const startTime = Date.now()

    try {
      // Check for parallel execution opportunities
      if (options.enableParallelExecution) {
        await this.executeWorkflowWithParallelism(workflow, context, result, abortController.signal)
      } else {
        await this.executeWorkflowSequentially(workflow, context, result, abortController.signal)
      }

      if (result.status === 'pending') {
        result.status = 'success'
        result.result = { success: true, data: context.variables }
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        result.status = result.status === 'timeout' ? 'timeout' : 'cancelled'
      } else {
        result.status = 'error'
        result.errors = result.errors || []
        result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      }
    } finally {
      clearTimeout(timeoutId)
      this.activeExecutions.delete(executionId)
    }

    result.executionTime = Date.now() - startTime
    
    // Calculate final metrics
    if (context.metrics.executedNodes > 0) {
      context.metrics.averageNodeTime = result.executionTime / context.metrics.executedNodes
    }
    
    result.metrics = context.metrics
    this.executions.set(executionId, result)
    return result
  }

  private async executeWorkflowSequentially(
    workflow: Workflow,
    context: ExecutionContext,
    result: ExecutionResult,
    signal: AbortSignal
  ): Promise<void> {
    // Find start node
    const startNode = workflow.nodes.find(node => node.type === 'start')
    if (!startNode) {
      throw new Error('No start node found in workflow')
    }

    let currentNode: WorkflowNode | null = startNode
    while (currentNode && !signal.aborted) {
      const nodeOutput = await this.executeNodeWithRetry(workflow, currentNode, context, result, signal)
      
      if (!nodeOutput.success) {
        result.status = 'error'
        result.errors = result.errors || []
        result.errors.push(nodeOutput.error || 'Unknown error')
        context.metrics.failedNodes++
        break
      }

      context.metrics.executedNodes++

      // Update context variables
      if (nodeOutput.variables) {
        Object.assign(context.variables, nodeOutput.variables)
      }

      // Find next node
      if (nodeOutput.nextNodeId) {
        currentNode = workflow.nodes.find(node => node.id === nodeOutput.nextNodeId) || null
      } else {
        currentNode = await this.findNextNode(workflow, currentNode, context)
      }
    }
  }

  private async executeWorkflowWithParallelism(
    workflow: Workflow,
    context: ExecutionContext,
    result: ExecutionResult,
    signal: AbortSignal
  ): Promise<void> {
    // Analyze workflow for parallel execution opportunities
    const parallelBranches = this.identifyParallelBranches(workflow)
    
    if (parallelBranches.length === 0) {
      // No parallel opportunities, fall back to sequential
      await this.executeWorkflowSequentially(workflow, context, result, signal)
      return
    }

    // Execute parallel branches
    const branchPromises = parallelBranches.map(async (branch) => {
      const branchResult: ParallelBranchResult = {
        branchId: branch.id,
        nodes: branch.nodeIds,
        status: 'pending',
        executionTime: 0
      }

      const branchStartTime = Date.now()
      
      try {
        // Execute nodes in this branch
        for (const nodeId of branch.nodeIds) {
          if (signal.aborted) break
          
          const node = workflow.nodes.find(n => n.id === nodeId)
          if (!node) continue

          const nodeOutput = await this.executeNodeWithRetry(workflow, node, context, result, signal)
          
          if (!nodeOutput.success) {
            branchResult.status = 'error'
            branchResult.error = nodeOutput.error
            context.metrics.failedNodes++
            break
          }

          context.metrics.executedNodes++
        }

        if (branchResult.status === 'pending') {
          branchResult.status = 'success'
        }
      } catch (error) {
        branchResult.status = 'error'
        branchResult.error = error instanceof Error ? error.message : 'Unknown error'
      }

      branchResult.executionTime = Date.now() - branchStartTime
      return branchResult
    })

    // Wait for all branches to complete
    const branchResults = await Promise.allSettled(branchPromises)
    
    result.parallelBranches = branchResults.map(r => 
      r.status === 'fulfilled' ? r.value : {
        branchId: 'unknown',
        nodes: [],
        status: 'error' as const,
        executionTime: 0,
        error: r.reason
      }
    )

    // Check if any branch failed
    const hasFailures = result.parallelBranches.some(b => b.status === 'error')
    if (hasFailures) {
      result.status = 'error'
      result.errors = result.errors || []
      result.errors.push('One or more parallel branches failed')
    }
  }

  private async executeNodeWithRetry(
    workflow: Workflow,
    node: WorkflowNode,
    context: ExecutionContext,
    result: ExecutionResult,
    signal: AbortSignal
  ): Promise<NodeExecutionOutput> {
    const retryConfig = context.options.retryConfig!
    let lastError: string | undefined
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      if (signal.aborted) {
        return { success: false, error: 'Execution cancelled' }
      }

      try {
        const output = await this.executeNode(workflow, node, context, result)
        
        if (output.success || !this.isRetryableError(output.error, retryConfig)) {
          if (attempt > 0) {
            context.metrics.retryCount += attempt
          }
          return output
        }
        
        lastError = output.error
        
        // Wait before retry (with exponential backoff)
        if (attempt < retryConfig.maxRetries) {
          const backoffMultiplier = retryConfig.backoffMultiplier ?? 2
          const delay = retryConfig.retryDelay * Math.pow(backoffMultiplier, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        
        if (!this.isRetryableError(lastError, retryConfig)) {
          break
        }
      }
    }

    context.metrics.retryCount += retryConfig.maxRetries
    return { success: false, error: lastError || 'Max retries exceeded' }
  }

  private isRetryableError(error: string | undefined, retryConfig: RetryConfig): boolean {
    if (!error) return false
    const retryableErrors = retryConfig.retryableErrors ?? []
    return retryableErrors.some(retryableError => 
      error.includes(retryableError)
    )
  }

  private identifyParallelBranches(workflow: Workflow): Array<{ id: string; nodeIds: string[] }> {
    // Simple implementation - identify nodes that can run in parallel
    // This is a basic version; a more sophisticated implementation would analyze dependencies
    const branches: Array<{ id: string; nodeIds: string[] }> = []
    
    // Find nodes that have no dependencies on each other
    const independentNodes = workflow.nodes.filter(node => 
      node.type !== 'start' && node.type !== 'end'
    )

    // Group independent nodes into branches (simplified logic)
    if (independentNodes.length > 1) {
      const midpoint = Math.ceil(independentNodes.length / 2)
      branches.push({
        id: 'branch-1',
        nodeIds: independentNodes.slice(0, midpoint).map(n => n.id)
      })
      branches.push({
        id: 'branch-2', 
        nodeIds: independentNodes.slice(midpoint).map(n => n.id)
      })
    }

    return branches
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.executionQueue.length > 0) {
        this.isProcessingQueue = true
        
        // Sort by priority
        this.executionQueue.sort((a, b) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          const aPriority = priorityOrder[a.options?.priority || 'normal']
          const bPriority = priorityOrder[b.options?.priority || 'normal']
          return bPriority - aPriority
        })

        const request = this.executionQueue.shift()
        if (request) {
          try {
            await this.executeWorkflow(request)
          } catch (error) {
            console.error('Queue execution error:', error)
          }
        }
        
        this.isProcessingQueue = false
      }
    }, 1000)
  }

  public queueExecution(request: ExecutionRequest): string {
    const executionId = `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.executionQueue.push({ ...request, context: { ...request.context, queuedExecutionId: executionId } })
    return executionId
  }

  public cancelExecution(executionId: string): boolean {
    const controller = this.activeExecutions.get(executionId)
    if (controller) {
      controller.abort()
      return true
    }
    return false
  }

  public getExecutionMetrics(executionId: string): ExecutionMetrics | undefined {
    const execution = this.executions.get(executionId)
    return execution?.metrics
  }

  private async executeNode(
    workflow: Workflow, 
    node: WorkflowNode, 
    context: ExecutionContext, 
    result: ExecutionResult
  ): Promise<NodeExecutionOutput> {
    const nodeStartTime = Date.now()
    result.executionPath.push(node.id)

    const log: ExecutionLog = {
      timestamp: new Date(),
      nodeId: node.id,
      nodeName: node.name,
      action: `execute_${node.type}`,
      input: { ...context.variables },
      output: { success: false },
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

  private async executeStartNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionOutput> {
    return { success: true, data: { status: 'started', timestamp: new Date() } }
  }

  private async executeDataSourceNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionOutput> {
    const { dataSources } = node.config
    const results: Record<string, any> = {}

    const dataSourceList = Array.isArray(dataSources) ? dataSources : []
    for (const dataSourceId of dataSourceList) {
      // Simulate data source call
      const data = await this.fetchDataFromSource(dataSourceId, context.variables)
      results[dataSourceId] = data
    }

    return { success: true, data: results }
  }

  private async executeDecisionNode(workflow: Workflow, node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionOutput> {
    const ruleSet = workflow.ruleSets.find(rs => rs.id === node.ruleSetId)
    if (!ruleSet) {
      throw new Error(`RuleSet not found: ${node.ruleSetId}`)
    }

    const ruleContext = {
      applicationData: context.applicationData,
      externalData: context.externalData,
      userContext: context.userContext
    }
    const decision = RuleEngine.executeRuleSet(ruleSet, ruleContext)
    return { success: true, data: decision as unknown as Record<string, unknown> }
  }

  private async executeConditionNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionOutput> {
    const { condition } = node.config
    const result = this.evaluateCondition(condition || '', context.variables)
    return { success: true, data: { conditionResult: result } }
  }

  private async executeActionNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionOutput> {
    const { action, reason } = node.config
    const metadata = context.metadata as any
    
    // Simulate action execution
    if (!metadata?.simulationMode) {
      // In real mode, execute actual action
      await this.performAction(action as string, context.variables)
    }

    return { 
      success: true, 
      data: { 
        action: metadata?.action, 
        reason: metadata?.reason, 
        executed: !metadata?.simulationMode 
      } 
    }
  }

  private async executeApprovalNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionOutput> {
    const { reviewers, timeout } = node.config
    const metadata = context.metadata as any
    
    if (metadata?.simulationMode) {
      // In simulation mode, auto-approve for testing
      return { 
        success: true, 
        data: { status: 'approved', reviewer: 'simulation', timestamp: new Date() } 
      }
    }

    // In real mode, create approval request
    return {
      success: true,
      data: {
        status: 'pending_approval',
        reviewers: metadata?.reviewers,
        timeout: metadata?.timeout,
        requestId: `approval_${Date.now()}`
      }
    }
  }

  private async executeEndNode(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionOutput> {
    return { 
      success: true,
      data: {
        status: 'completed', 
        timestamp: new Date(),
        finalResult: context.variables 
      }
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
      const ruleSetValidation = await RuleEngine.validateRuleSet(ruleSet)
      if (!ruleSetValidation.valid) {
        errors.push(`RuleSet ${ruleSet.name}: ${ruleSetValidation.errors.join(', ')}`)
      }
    }

    return { isValid: errors.length === 0, errors }
  }
}

// Export singleton instance
export const workflowExecutionService = new WorkflowExecutionService()