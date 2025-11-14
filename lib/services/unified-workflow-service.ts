/**
 * Unified Workflow Service
 * 
 * This service consolidates all workflow-related operations into a single,
 * well-structured service that replaces the multiple competing services.
 * 
 * Features:
 * - Complete CRUD operations for workflows
 * - Advanced validation with warnings and errors
 * - Workflow execution engine with rule evaluation
 * - Node and connection management
 * - Data source integration
 * - Import/export functionality
 * - Analytics and monitoring
 * - Cache management for performance
 */

import { 
  WorkflowConfig, 
  WorkflowDefinition,
  WorkflowNode, 
  WorkflowConnection, 
  IWorkflowService,
  ValidationResult,
  ValidationError,
  NodeType,
  WorkflowMode
} from "../types/unified-workflow"
import { BusinessRule } from "../types"
import { Rule } from "../engines/rule-engine"

export interface WorkflowExecutionContext {
  data: Record<string, any>
  metadata?: Record<string, any>
  userId?: string
  sessionId?: string
}

export interface WorkflowExecutionResult {
  success: boolean
  result?: any
  error?: string
  executionPath: string[]
  metadata: Record<string, any>
  duration?: number
}

export interface ExtendedValidationResult extends ValidationResult {
  complexity: number
  reachableNodes: number
}

export class UnifiedWorkflowService implements IWorkflowService {
  private readonly apiClient: any // Replace with your actual API client
  private readonly cache = new Map<string, WorkflowConfig>()
  private readonly executionHistory = new Map<string, WorkflowExecutionResult[]>()
  private readonly listCache = new Map<string, { ts: number; data: WorkflowConfig[] }>()
  private readonly inFlightLists = new Map<string, Promise<WorkflowConfig[]>>()
  private readonly listCacheTTLms = 60000

  constructor(apiClient?: any) {
    this.apiClient = apiClient || this.createMockApiClient()
  }

  private createMockApiClient() {
    const mockStorage = new Map<string, any>()
    
    return {
      get: async (url: string) => {
        // Handle listing all workflows
        if (url === "/workflows") {
          return Array.from(mockStorage.values())
        }
        
        // Handle getting individual workflow by ID
        const id = url.split('/').pop()
        if (!id) {
          throw new Error('Invalid URL: no ID found')
        }
        if (mockStorage.has(id)) {
          return mockStorage.get(id)
        }
        throw new Error(`Workflow ${id} not found`)
      },
      post: async (url: string, data: any) => {
        const id = data.id || `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const savedData = { ...data, id }
        mockStorage.set(id, savedData)
        return savedData
      },
      put: async (url: string, data: any) => {
        const id = data.id
        if (!id) {
          throw new Error('Workflow ID is required for update')
        }
        mockStorage.set(id, data)
        return data
      },
      delete: async (url: string) => {
        const id = url.split('/').pop()
        if (!id) {
          throw new Error('Invalid URL: no ID found')
        }
        mockStorage.delete(id)
        return { success: true }
      }
    }
  }

  // ==================== Core CRUD Operations ====================
  
  async getWorkflow(id: string): Promise<WorkflowConfig> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!
    }

    try {
      const workflow = await this.apiClient.get(`/workflows/${id}`)
      this.cache.set(id, workflow)
      return workflow
    } catch (error) {
      throw new Error(`Failed to load workflow ${id}: ${error}`)
    }
  }

  async createWorkflow(workflow: Omit<WorkflowConfig, 'id'>): Promise<WorkflowConfig> {
    const id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newWorkflow: WorkflowConfig = {
      ...workflow,
      id,
      metadata: {
        ...workflow.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: String(workflow.version || 1)
      }
    }
    
    try {
      const savedWorkflow = await this.apiClient.post("/workflows", newWorkflow)
      this.cache.set(savedWorkflow.id, savedWorkflow)
      return savedWorkflow
    } catch (error) {
      throw new Error(`Failed to create workflow: ${error}`)
    }
  }

  async updateWorkflow(id: string, updates: Partial<WorkflowConfig>): Promise<WorkflowConfig> {
    const existing = await this.getWorkflow(id)
    
    const updated: WorkflowConfig = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    try {
      const savedWorkflow = await this.apiClient.put(`/workflows/${id}`, updated)
      this.cache.set(id, savedWorkflow)
      return savedWorkflow
    } catch (error) {
      throw new Error(`Failed to update workflow ${id}: ${error}`)
    }
  }

  async listWorkflows(filters?: { mode?: WorkflowMode; tags?: string[]; createdBy?: string }): Promise<WorkflowConfig[]> {
    const key = JSON.stringify(filters || {})
    const now = Date.now()
    const cached = this.listCache.get(key)
    if (cached && now - cached.ts < this.listCacheTTLms) {
      return cached.data
    }
    const inflight = this.inFlightLists.get(key)
    if (inflight) {
      return inflight
    }
    const p = (async () => {
      try {
        const workflows = await this.apiClient.get("/workflows", { params: filters })
        workflows.forEach((wf: WorkflowConfig) => this.cache.set(wf.id, wf))
        this.listCache.set(key, { ts: Date.now(), data: workflows })
        return workflows
      } finally {
        this.inFlightLists.delete(key)
      }
    })()
    this.inFlightLists.set(key, p)
    return p
  }

  async saveWorkflow(workflow: WorkflowDefinition): Promise<WorkflowConfig> {
    // Convert WorkflowDefinition to WorkflowConfig by adding required properties
    const workflowConfig: WorkflowConfig = {
      ...workflow,
      mode: "simple" as WorkflowMode,
      settings: {
        autoSave: true,
        validation: true,
        execution: {
          timeout: 30000,
          retries: 3
        }
      }
    }

    // Validate before saving
    const validation = await this.validateWorkflow(workflowConfig)
    if (!validation.isValid) {
      throw new Error(`Workflow validation failed: ${validation.errors.map(e => e.message).join(", ")}`)
    }

    try {
      const savedWorkflow = await this.apiClient.post("/workflows", workflowConfig)
      this.cache.set(savedWorkflow.id, savedWorkflow)
      return savedWorkflow
    } catch (error) {
      throw new Error(`Failed to save workflow: ${error}`)
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`/workflows/${id}`)
      this.cache.delete(id)
    } catch (error) {
      throw new Error(`Failed to delete workflow ${id}: ${error}`)
    }
  }

  // ==================== Workflow Execution Engine ====================
  
  async executeWorkflow(id: string, context?: WorkflowExecutionContext): Promise<WorkflowExecutionResult> {
    const workflow = await this.getWorkflow(id)
    return this.executeWorkflowDirect(workflow, context || { data: {} })
  }

  async executeWorkflowDirect(workflow: WorkflowConfig, context: WorkflowExecutionContext): Promise<WorkflowExecutionResult> {
    const startTime = Date.now()
    
    // Validate before execution
    const validation = await this.validateWorkflow(workflow)
    if (!validation.isValid) {
      return {
        success: false,
        error: `Workflow validation failed: ${validation.errors.map(e => e.message).join(", ")}`,
        executionPath: [],
        metadata: { validationErrors: validation.errors },
        duration: Date.now() - startTime
      }
    }

    try {
      const executionPath: string[] = []
      const startNode = workflow.nodes.find(node => node.type === "start")
      
      if (!startNode) {
        throw new Error("No start node found")
      }

      let currentNodeId = startNode.id
      let result: any = null
      const maxIterations = 100 // Prevent infinite loops
      let iterations = 0

      while (currentNodeId && iterations < maxIterations) {
        iterations++
        executionPath.push(currentNodeId)
        
        const currentNode = workflow.nodes.find(node => node.id === currentNodeId)
        if (!currentNode) {
          throw new Error(`Node ${currentNodeId} not found`)
        }

        // Process the current node
        const nodeResult = await this.executeNode(currentNode, context, workflow)
        
        if (currentNode.type === "end") {
          result = nodeResult
          break
        }

        // Find next node
        const nextNodeId = this.getNextNode(currentNode, workflow, context, nodeResult)
        if (!nextNodeId) {
          break // No more nodes to process
        }
        currentNodeId = nextNodeId
      }

      if (iterations >= maxIterations) {
        throw new Error("Workflow execution exceeded maximum iterations (possible infinite loop)")
      }

      const executionResult: WorkflowExecutionResult = {
        success: true,
        result,
        executionPath,
        metadata: {
          iterations,
          validationWarnings: validation.warnings,
          complexity: validation.complexity
        },
        duration: Date.now() - startTime
      }

      // Store execution history
      this.addExecutionHistory(workflow.id, executionResult)

      return executionResult
    } catch (error) {
      const executionResult: WorkflowExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown execution error",
        executionPath: [],
        metadata: { error: error instanceof Error ? error.stack : undefined },
        duration: Date.now() - startTime
      }

      this.addExecutionHistory(workflow.id, executionResult)
      return executionResult
    }
  }

  private async executeNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext,
    workflow: WorkflowConfig
  ): Promise<any> {
    switch (node.type) {
      case "start":
        return context.data

      case "condition":
        return this.evaluateCondition(node, context)

      case "rule_set":
        return this.evaluateRuleSet(node, context)

      case "data_source":
        return this.executeDataSource(node, context)

      case "action":
        return this.executeAction(node, context)

      case "ai_decision":
        return this.executeAIDecision(node, context)

      case "batch_process":
        return this.executeBatchProcess(node, context)

      case "notification":
        return this.executeNotification(node, context)

      case "integration":
        return this.executeIntegration(node, context)

      case "audit_log":
        return this.executeAuditLog(node, context)

      case "end":
        return node.data?.result || context.data

      default:
        throw new Error(`Unknown node type: ${(node as any).type}`)
    }
  }

  private evaluateCondition(node: WorkflowNode, context: WorkflowExecutionContext): boolean {
    const condition = node.data?.condition
    if (!condition) return true

    const { field, operator, value } = condition
    const fieldValue = context.data[field]

    return this.compareValues(fieldValue, operator, value)
  }

  private evaluateRuleSet(node: WorkflowNode, context: WorkflowExecutionContext): any {
    const rules = node.data?.rules || []
    const results = []

    for (const rule of rules) {
      const ruleResult = this.evaluateRule(rule, context)
      results.push(ruleResult)
    }

    const logicOperator = node.data?.logicOperator || "AND"
    
    if (logicOperator === "AND") {
      return results.every(result => result === true)
    } else if (logicOperator === "OR") {
      return results.some(result => result === true)
    }
    
    return results
  }

  private evaluateRule(rule: any, context: WorkflowExecutionContext): any {
    if (rule.conditions && rule.actions) {
      return this.evaluateBusinessRule(rule, context)
    } else if (rule.condition && rule.action) {
      const conditionMet = this.evaluateRuleCondition(rule.condition, context)
      return conditionMet ? rule.action : null
    }
    
    return true
  }

  private evaluateBusinessRule(rule: BusinessRule, context: WorkflowExecutionContext): any {
    // Handle the correct BusinessRule interface structure
    const conditionMet = this.evaluateRuleCondition(rule.condition, context)

    if (conditionMet) {
      return this.executeRuleAction(rule.action, context)
    }

    return null
  }

  private evaluateRuleCondition(condition: any, context: WorkflowExecutionContext): boolean {
    // Handle string conditions (simple expressions)
    if (typeof condition === 'string') {
      // Simple evaluation for string conditions
      // In a real implementation, you'd parse and evaluate the expression
      return true // Simplified for now
    }

    // Handle RuleCondition objects
    if (condition && typeof condition === 'object' && condition.field) {
      const { field, operator, value } = condition
      const fieldValue = context.data[field]
      return this.compareValues(fieldValue, operator, value)
    }

    return false
  }

  private executeRuleAction(action: any, context: WorkflowExecutionContext): any {
    // Handle string actions (simple action names)
    if (typeof action === 'string') {
      switch (action) {
        case "approve":
          return { decision: "approved" }
        case "reject":
          return { decision: "rejected" }
        case "review":
          return { decision: "review_required" }
        default:
          return { action }
      }
    }

    // Handle RuleAction objects
    if (action && typeof action === 'object' && action.type) {
      switch (action.type) {
        case "set_value":
          if (action.parameters?.field && action.parameters?.value !== undefined) {
            context.data[action.parameters.field] = action.parameters.value
            return { field: action.parameters.field, value: action.parameters.value }
          }
          break
        case "calculate":
          const result = this.executeCalculation(action.parameters, context)
          if (action.outputField) {
            context.data[action.outputField] = result
          }
          return result
        case "validate":
          return { validation: "performed", parameters: action.parameters }
        case "transform":
          return { transformation: "performed", parameters: action.parameters }
        case "call_service":
          return { service_called: action.parameters?.service || "unknown" }
        case "send_notification":
          return { notification_sent: true, parameters: action.parameters }
        case "log_event":
          return { event_logged: true, parameters: action.parameters }
        case "stop_execution":
          return { execution_stopped: true, reason: action.parameters?.reason }
        default:
          return action
      }
    }

    return action
  }

  private executeCalculation(calculation: any, context: WorkflowExecutionContext): number {
    const { operation, operands } = calculation
    const values = operands.map((operand: any) => {
      if (typeof operand === "string" && operand.startsWith("$")) {
        return context.data[operand.substring(1)]
      }
      return operand
    })

    switch (operation) {
      case "add":
        return values.reduce((sum: number, val: number) => sum + val, 0)
      case "subtract":
        return values.reduce((diff: number, val: number) => diff - val)
      case "multiply":
        return values.reduce((product: number, val: number) => product * val, 1)
      case "divide":
        return values.reduce((quotient: number, val: number) => quotient / val)
      case "average":
        return values.reduce((sum: number, val: number) => sum + val, 0) / values.length
      case "max":
        return Math.max(...values)
      case "min":
        return Math.min(...values)
      default:
        return 0
    }
  }

  private compareValues(fieldValue: any, operator: string, value: any): boolean {
    switch (operator) {
      case "equals":
        return fieldValue === value
      case "not_equals":
        return fieldValue !== value
      case "greater_than":
        return Number(fieldValue) > Number(value)
      case "less_than":
        return Number(fieldValue) < Number(value)
      case "greater_than_or_equal":
        return Number(fieldValue) >= Number(value)
      case "less_than_or_equal":
        return Number(fieldValue) <= Number(value)
      case "contains":
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
      case "starts_with":
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
      case "ends_with":
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
      case "in":
        return Array.isArray(value) ? value.includes(fieldValue) : false
      case "not_in":
        return Array.isArray(value) ? !value.includes(fieldValue) : true
      default:
        return true
    }
  }

  private async executeDataSource(node: WorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    const dataSourceId = node.data?.dataSource
    if (!dataSourceId) return context.data

    try {
      // For now, simulate data source execution based on the ID
      // In a real implementation, you would resolve the dataSourceId to actual configuration
      const dataSourceType = this.getDataSourceType(dataSourceId)
      
      switch (dataSourceType) {
        case "credit_bureau":
          return await this.executeDatabaseQuery({ id: dataSourceId, type: dataSourceType }, context)
        case "custom_api":
          return await this.executeApiCall({ id: dataSourceId, type: dataSourceType }, context)
        case "income_verification":
          return await this.readFileData({ id: dataSourceId, type: dataSourceType }, context)
        default:
          return context.data
      }
    } catch (error) {
      throw new Error(`Data source execution failed: ${error}`)
    }
  }

  private getDataSourceType(dataSourceId: string): string {
    // Simple mapping based on common data source IDs
    // In a real implementation, this would query a data source registry
    if (dataSourceId.includes('credit') || dataSourceId.includes('bureau')) {
      return 'credit_bureau'
    }
    if (dataSourceId.includes('income') || dataSourceId.includes('verification')) {
      return 'income_verification'
    }
    if (dataSourceId.includes('api') || dataSourceId.includes('custom')) {
      return 'custom_api'
    }
    return 'custom_api' // default fallback
  }

  private async executeDatabaseQuery(dataSource: any, context: WorkflowExecutionContext): Promise<any> {
    // Placeholder for database query execution
    return { ...context.data, dataSourceResult: "database_result" }
  }

  private async executeApiCall(dataSource: any, context: WorkflowExecutionContext): Promise<any> {
    // Placeholder for API call execution
    return { ...context.data, dataSourceResult: "api_result" }
  }

  private async readFileData(dataSource: any, context: WorkflowExecutionContext): Promise<any> {
    // Placeholder for file data reading
    return { ...context.data, dataSourceResult: "file_result" }
  }

  private executeAction(node: WorkflowNode, context: WorkflowExecutionContext): any {
    const action = node.data?.action
    if (!action) return context.data

    // Handle string actions
    if (typeof action === 'string') {
      switch (action) {
        case "approve":
          return { ...context.data, status: "approved" }
        case "reject":
          return { ...context.data, status: "rejected" }
        case "review":
          return { ...context.data, status: "review_required" }
        default:
          return context.data
      }
    }

    // Handle object actions
    if (typeof action === 'object' && action !== null && 'type' in action) {
      switch ((action as any).type) {
        case "approve":
          return { ...context.data, status: "approved", reason: action.reason }
        case "reject":
          return { ...context.data, status: "rejected", reason: action.reason }
        case "review":
          return { ...context.data, status: "review_required", reason: action.reason }
        case "notify":
          return { ...context.data, notification: action.message }
        case "log":
          console.log(`Workflow Log: ${action.message}`, context.data)
          return context.data
        default:
          return context.data
      }
    }

    return context.data
  }

  private async executeAIDecision(node: WorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    // Placeholder for AI decision logic
    return { ...context.data, aiDecision: "ai_result" }
  }

  private async executeBatchProcess(node: WorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    // Placeholder for batch processing
    return { ...context.data, batchResult: "batch_processed" }
  }

  private async executeNotification(node: WorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    // Placeholder for notification sending
    return { ...context.data, notificationSent: true }
  }

  private async executeIntegration(node: WorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    // Placeholder for external integration
    return { ...context.data, integrationResult: "integration_complete" }
  }

  private async executeAuditLog(node: WorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    // Placeholder for audit logging
    return { ...context.data, auditLogged: true }
  }

  private getNextNode(
    currentNode: WorkflowNode,
    workflow: WorkflowConfig,
    context: WorkflowExecutionContext,
    nodeResult: any
  ): string | null {
    const connections = workflow.connections.filter(conn => conn.source === currentNode.id)
    
    if (connections.length === 0) {
      return null
    }

    if (connections.length === 1) {
      return connections[0]?.target || null
    }

    // Multiple connections - choose based on conditions
    for (const connection of connections) {
      if (this.evaluateConnectionCondition(connection, context, nodeResult)) {
        return connection?.target || null
      }
    }

    // Default to first connection if no conditions match
    return connections[0]?.target || null
  }

  private evaluateConnectionCondition(
    connection: WorkflowConnection,
    context: WorkflowExecutionContext,
    nodeResult: any
  ): boolean {
    if (!connection.condition) return true

    // Handle string conditions (simple expressions)
    if (typeof connection.condition === 'string') {
      // Simple string evaluation - could be enhanced with expression parser
      return true // For now, assume string conditions are always true
    }

    // Handle object conditions
    if (typeof connection.condition === 'object' && connection.condition !== null && 'field' in connection.condition) {
      const condition = connection.condition as any
      const { field, operator, value } = condition
      let fieldValue: any

      if (field === "__nodeResult__") {
        fieldValue = nodeResult
      } else if (field === "__nodeResultType__") {
        fieldValue = typeof nodeResult
      } else {
        fieldValue = context.data?.[field]
      }

      return this.compareValues(fieldValue, operator, value)
    }

    return true
  }

  // ==================== Enhanced Validation Logic ====================
  
  async validateWorkflow(workflow: WorkflowConfig): Promise<ExtendedValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []

    // Basic validation
    if (!workflow.name?.trim()) {
      errors.push({
        code: "MISSING_WORKFLOW_NAME",
        message: "Workflow name is required",
        severity: "error"
      })
    }

    if (workflow.nodes.length === 0) {
      errors.push({
        code: "NO_NODES",
        message: "Workflow must contain at least one node",
        severity: "error"
      })
    }

    // Node validation
    const startNodes = workflow.nodes.filter(n => n.type === "start")
    if (startNodes.length === 0) {
      errors.push({
        code: "NO_START_NODE",
        message: "Workflow must have a start node",
        severity: "error"
      })
    } else if (startNodes.length > 1) {
      warnings.push({
        code: "MULTIPLE_START_NODES",
        message: "Multiple start nodes detected",
        severity: "warning"
      })
    }

    const endNodes = workflow.nodes.filter(n => n.type === "end")
    if (endNodes.length === 0) {
      warnings.push({
        code: "NO_END_NODE",
        message: "Workflow should have at least one end node",
        severity: "warning"
      })
    }

    // Connection validation
    for (const connection of workflow.connections) {
      const sourceExists = workflow.nodes.some(n => n.id === connection.source)
      const targetExists = workflow.nodes.some(n => n.id === connection.target)

      if (!sourceExists) {
        errors.push({
          code: "INVALID_SOURCE_NODE",
          connectionId: connection.id,
          message: `Connection source node ${connection.source} not found`,
          severity: "error"
        })
      }

      if (!targetExists) {
        errors.push({
          code: "INVALID_TARGET_NODE",
          connectionId: connection.id,
          message: `Connection target node ${connection.target} not found`,
          severity: "error"
        })
      }
    }

    // Check for orphaned nodes
    const connectedNodeIds = new Set([
      ...workflow.connections.map(c => c.source),
      ...workflow.connections.map(c => c.target)
    ])

    for (const node of workflow.nodes) {
      if (node.type !== "start" && !connectedNodeIds.has(node.id)) {
        warnings.push({
          code: "ORPHANED_NODE",
          nodeId: node.id,
          message: `Node ${node.data.label} is not connected`,
          severity: "warning"
        })
      }
    }

    // Advanced validation: Check for unreachable nodes
    const reachableNodes = this.findReachableNodes(workflow)
    for (const node of workflow.nodes) {
      if (!reachableNodes.has(node.id)) {
        warnings.push({
          code: "UNREACHABLE_NODE",
          nodeId: node.id,
          message: `Node ${node.data.label} is unreachable from start node`,
          severity: "warning"
        })
      }
    }

    // Check for circular dependencies
    const circularPaths = this.detectCircularDependencies(workflow)
    if (circularPaths.length > 0) {
      warnings.push({
        code: "CIRCULAR_DEPENDENCY",
        message: `Potential circular dependencies detected: ${circularPaths.join(", ")}`,
        severity: "warning"
      })
    }

    // Calculate complexity
    const complexity = this.calculateWorkflowComplexity(workflow)
    if (complexity > 50) {
      warnings.push({
        code: "HIGH_COMPLEXITY",
        message: `High workflow complexity (${complexity}). Consider breaking into smaller workflows.`,
        severity: "warning"
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      complexity,
      reachableNodes: reachableNodes.size
    }
  }

  private findReachableNodes(workflow: WorkflowConfig): Set<string> {
    const reachable = new Set<string>()
    const startNode = workflow.nodes.find(node => node.type === "start")
    
    if (!startNode) return reachable

    const queue = [startNode.id]
    reachable.add(startNode.id)

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const connections = workflow.connections.filter(conn => conn.source === currentId)
      
      for (const connection of connections) {
        if (!reachable.has(connection.target)) {
          reachable.add(connection.target)
          queue.push(connection.target)
        }
      }
    }

    return reachable
  }

  private detectCircularDependencies(workflow: WorkflowConfig): string[] {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const circularPaths: string[] = []

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const connections = workflow.connections.filter(conn => conn.source === nodeId)
      for (const connection of connections) {
        if (!visited.has(connection.target)) {
          dfs(connection.target, [...path])
        } else if (recursionStack.has(connection.target)) {
          circularPaths.push([...path, connection.target].join(" -> "))
        }
      }

      recursionStack.delete(nodeId)
    }

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, [])
      }
    }

    return circularPaths
  }

  private calculateWorkflowComplexity(workflow: WorkflowConfig): number {
    const nodeCount = workflow.nodes.length
    const connectionCount = workflow.connections.length
    const conditionalNodes = workflow.nodes.filter(n => n.type === "condition" || n.type === "rule_set").length
    const dataSourceNodes = workflow.nodes.filter(n => n.type === "data_source").length
    
    // Complexity formula: base nodes + weighted connections + conditional complexity + data source complexity
    return nodeCount + (connectionCount * 0.5) + (conditionalNodes * 3) + (dataSourceNodes * 2)
  }

  // ==================== Utility Methods ====================
  
  createDefaultWorkflow(mode: WorkflowMode = "simple"): WorkflowConfig {
    const now = new Date().toISOString()
    
    return {
      id: `workflow-${Date.now()}`,
      name: "New Workflow",
      description: "A new workflow",
      version: "1.0.0",
      mode,
      nodes: [
        {
          id: "start-1",
          type: "start",
          position: { x: 100, y: 100 },
          data: { label: "Start" },
          metadata: {
            createdAt: now,
            updatedAt: now,
            version: "1"
          }
        }
      ],
      connections: [],
      settings: {
        autoSave: true,
        validation: true,
        execution: {
          timeout: 30000,
          retries: 3
        }
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: "current-user", // Replace with actual user
        tags: []
      },
      dataRequirements: {
          required: [],
          optional: [],
          external: []
        },
      status: "draft"
    }
  }

  getAvailableNodeTypes(mode: WorkflowMode): NodeType[] {
    const baseTypes: NodeType[] = ["start", "condition", "action", "end"]
    const enhancedTypes: NodeType[] = ["data_source", "rule_set", "notification", "integration"]
    const enterpriseTypes: NodeType[] = ["ai_decision", "batch_process", "audit_log"]

    switch (mode) {
      case "enhanced":
        return [...baseTypes, ...enhancedTypes]
      case "enterprise":
        return [...baseTypes, ...enhancedTypes, ...enterpriseTypes]
      default:
        return baseTypes
    }
  }

  async cloneWorkflow(id: string, newName?: string): Promise<WorkflowConfig> {
    const original = await this.getWorkflow(id)
    
    const cloned = {
      ...original,
      name: newName || `${original.name} (Copy)`,
      metadata: {
        ...original.metadata,
        clonedFrom: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    return this.createWorkflow(cloned)
  }

  async exportWorkflow(id: string): Promise<string> {
    const workflow = await this.getWorkflow(id)
    return JSON.stringify(workflow, null, 2)
  }

  async importWorkflow(workflowJson: string): Promise<WorkflowConfig> {
    try {
      const workflow = JSON.parse(workflowJson)
      
      // Validate the imported workflow
      const validation = await this.validateWorkflow(workflow)
      if (!validation.isValid) {
        throw new Error(`Invalid workflow: ${validation.errors.map(e => e.message).join(", ")}`)
      }

      return this.createWorkflow(workflow)
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : "Invalid workflow JSON"}`)
    }
  }

  // ==================== Analytics and Monitoring ====================
  
  getWorkflowMetrics(workflow: WorkflowConfig): Record<string, any> {
    const nodeTypes = workflow.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const reachableNodes = this.findReachableNodes(workflow)
    const complexity = this.calculateWorkflowComplexity(workflow)

    return {
      totalNodes: workflow.nodes.length,
      totalConnections: workflow.connections.length,
      nodeTypes,
      complexity,
      reachableNodes: reachableNodes.size,
      unreachableNodes: workflow.nodes.length - reachableNodes.size,
      hasRules: workflow.nodes.some(node => node.type === "rule_set"),
      hasDataSources: workflow.nodes.some(node => node.type === "data_source"),
      hasAINodes: workflow.nodes.some(node => node.type === "ai_decision"),
      averageConnectionsPerNode: workflow.connections.length / workflow.nodes.length
    }
  }

  getExecutionHistory(workflowId: string): WorkflowExecutionResult[] {
    return this.executionHistory.get(workflowId) || []
  }

  getExecutionStatistics(workflowId: string): Record<string, any> {
    const history = this.getExecutionHistory(workflowId)
    
    if (history.length === 0) {
      return { totalExecutions: 0 }
    }

    const successful = history.filter(h => h.success).length
    const failed = history.length - successful
    const avgDuration = history.reduce((sum, h) => sum + (h.duration || 0), 0) / history.length
    const avgIterations = history.reduce((sum, h) => sum + (h.metadata.iterations || 0), 0) / history.length

    return {
      totalExecutions: history.length,
      successfulExecutions: successful,
      failedExecutions: failed,
      successRate: (successful / history.length) * 100,
      averageDuration: avgDuration,
      averageIterations: avgIterations,
      lastExecution: history[history.length - 1]
    }
  }

  private addExecutionHistory(workflowId: string, result: WorkflowExecutionResult): void {
    if (!this.executionHistory.has(workflowId)) {
      this.executionHistory.set(workflowId, [])
    }
    
    const history = this.executionHistory.get(workflowId)!
    history.push(result)
    
    // Keep only last 100 executions
    if (history.length > 100) {
      history.shift()
    }
  }

  // ==================== Cache Management ====================
  
  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }

  getCachedWorkflows(): string[] {
    return Array.from(this.cache.keys())
  }

  evictFromCache(id: string): boolean {
    return this.cache.delete(id)
  }

  // ==================== Batch Operations ====================
  
  async batchExecuteWorkflows(requests: Array<{ workflowId: string; context: WorkflowExecutionContext }>): Promise<WorkflowExecutionResult[]> {
    const results = await Promise.allSettled(
      requests.map(req => this.executeWorkflow(req.workflowId, req.context))
    )

    return results.map(result => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        return {
          success: false,
          error: result.reason?.message || "Unknown error",
          executionPath: [],
          metadata: {},
          duration: 0
        }
      }
    })
  }

  async batchValidateWorkflows(workflowIds: string[]): Promise<Array<{ id: string; validation: ExtendedValidationResult }>> {
    const workflows = await Promise.all(
      workflowIds.map(async id => ({ id, workflow: await this.getWorkflow(id) }))
    )

    const validations = await Promise.all(
      workflows.map(async ({ id, workflow }) => ({
        id,
        validation: await this.validateWorkflow(workflow)
      }))
    )

    return validations
  }
}

// Export singleton instance
export const workflowService = new UnifiedWorkflowService()