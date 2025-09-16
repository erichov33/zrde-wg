/**
 * Abstract Base Workflow Service
 * 
 * Provides base implementation for workflow services with common functionality
 * and enforces consistent patterns across all workflow service implementations.
 */

import type {
  IWorkflowService,
  IWorkflowDefinition,
  ValidationResult,
  ExecutionContext,
  ExecutionResult,
  IWorkflowTemplate,
  WorkflowFilters,
  WorkflowError
} from "@/lib/interfaces/workflow-interfaces"

export abstract class BaseWorkflowService implements IWorkflowService {
  protected readonly serviceName: string = "BaseWorkflowService"

  // Abstract methods that must be implemented by concrete classes
  abstract createWorkflow(workflow: Omit<IWorkflowDefinition, 'id'>): Promise<IWorkflowDefinition>
  abstract getWorkflow(id: string): Promise<IWorkflowDefinition | null>
  abstract updateWorkflow(id: string, updates: Partial<IWorkflowDefinition>): Promise<IWorkflowDefinition>
  abstract deleteWorkflow(id: string): Promise<boolean>
  abstract listWorkflows(filters?: WorkflowFilters): Promise<IWorkflowDefinition[]>

  // Common validation implementation
  async validateWorkflow(workflow: IWorkflowDefinition): Promise<ValidationResult> {
    const errors: any[] = []
    const warnings: any[] = []

    try {
      // Basic validation
      if (!workflow.name?.trim()) {
        errors.push({
          code: "MISSING_NAME",
          message: "Workflow name is required",
          severity: "error"
        })
      }

      if (!workflow.description?.trim()) {
        warnings.push({
          code: "MISSING_DESCRIPTION",
          message: "Workflow description is recommended",
          severity: "warning",
          suggestion: "Add a description to help others understand the workflow purpose"
        })
      }

      // Node validation
      if (workflow.nodes.length === 0) {
        errors.push({
          code: "NO_NODES",
          message: "Workflow must contain at least one node",
          severity: "error"
        })
      } else {
        await this.validateNodes(workflow.nodes, errors, warnings)
      }

      // Connection validation
      await this.validateConnections(workflow.connections, workflow.nodes, errors, warnings)

      // Business logic validation
      await this.validateBusinessLogic(workflow, errors, warnings)

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: "VALIDATION_ERROR",
          message: error instanceof Error ? error.message : "Unknown validation error",
          severity: "error"
        }],
        warnings
      }
    }
  }

  // Template operations with base implementation
  async getTemplates(): Promise<IWorkflowTemplate[]> {
    try {
      return await this.loadTemplates()
    } catch (error) {
      this.handleError("getTemplates", error)
      return []
    }
  }

  async createFromTemplate(templateId: string, customizations?: Record<string, any>): Promise<IWorkflowDefinition> {
    try {
      const templates = await this.getTemplates()
      const template = templates.find(t => t.id === templateId)
      
      if (!template) {
        throw this.createError("TEMPLATE_NOT_FOUND", `Template ${templateId} not found`)
      }

      const workflow: Omit<IWorkflowDefinition, 'id'> = {
        name: customizations?.name || `${template.name} (Copy)`,
        description: customizations?.description || template.description,
        version: "1.0.0",
        nodes: this.applyCustomizations(template.nodes, customizations?.nodes),
        connections: this.applyCustomizations(template.connections, customizations?.connections),
        dataRequirements: customizations?.dataRequirements || {
          required: [],
          optional: [],
          external: []
        },
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          author: customizations?.author || "system",
          tags: [...(template.metadata.tags || []), "from_template"]
        }
      }

      return await this.createWorkflow(workflow)
    } catch (error) {
      throw this.handleError("createFromTemplate", error)
    }
  }

  // Execution with base implementation
  async executeWorkflow(workflowId: string, context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      const workflow = await this.getWorkflow(workflowId)
      if (!workflow) {
        throw this.createError("WORKFLOW_NOT_FOUND", `Workflow ${workflowId} not found`)
      }

      const validation = await this.validateWorkflow(workflow)
      if (!validation.isValid) {
        throw this.createError("INVALID_WORKFLOW", `Workflow validation failed: ${validation.errors.map(e => e.message).join(", ")}`)
      }

      return await this.performExecution(workflow, context, startTime)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown execution error",
        executionTime: Date.now() - startTime,
        nodeResults: []
      }
    }
  }

  async testWorkflow(workflow: IWorkflowDefinition, testData: Record<string, any>): Promise<ExecutionResult> {
    const context: ExecutionContext = {
      workflowId: workflow.id,
      executionId: `test_${Date.now()}`,
      data: testData,
      timestamp: new Date().toISOString(),
      userId: "test_user"
    }

    return await this.executeWorkflow(workflow.id, context)
  }

  // Protected helper methods
  protected async validateNodes(nodes: any[], errors: any[], warnings: any[]): Promise<void> {
    const nodeIds = new Set<string>()
    let hasStart = false
    let hasEnd = false

    for (const node of nodes) {
      // Check for duplicate IDs
      if (nodeIds.has(node.id)) {
        errors.push({
          code: "DUPLICATE_NODE_ID",
          message: `Duplicate node ID: ${node.id}`,
          nodeId: node.id,
          severity: "error"
        })
      }
      nodeIds.add(node.id)

      // Check node type
      if (node.type === "start") hasStart = true
      if (node.type === "end") hasEnd = true

      // Validate node data
      if (!node.data?.label) {
        warnings.push({
          code: "MISSING_NODE_LABEL",
          message: `Node ${node.id} is missing a label`,
          nodeId: node.id,
          severity: "warning",
          suggestion: "Add a descriptive label to improve workflow readability"
        })
      }

      // Validate node position
      if (!node.position || typeof node.position.x !== "number" || typeof node.position.y !== "number") {
        warnings.push({
          code: "INVALID_NODE_POSITION",
          message: `Node ${node.id} has invalid position`,
          nodeId: node.id,
          severity: "warning"
        })
      }
    }

    if (!hasStart) {
      warnings.push({
        code: "NO_START_NODE",
        message: "Workflow should have at least one start node",
        severity: "warning",
        suggestion: "Add a start node to define the workflow entry point"
      })
    }

    if (!hasEnd) {
      warnings.push({
        code: "NO_END_NODE",
        message: "Workflow should have at least one end node",
        severity: "warning",
        suggestion: "Add an end node to define the workflow completion point"
      })
    }
  }

  protected async validateConnections(connections: any[], nodes: any[], errors: any[], warnings: any[]): Promise<void> {
    const nodeIds = new Set(nodes.map(n => n.id))
    const connectionIds = new Set<string>()

    for (const connection of connections) {
      // Check for duplicate connection IDs
      if (connectionIds.has(connection.id)) {
        errors.push({
          code: "DUPLICATE_CONNECTION_ID",
          message: `Duplicate connection ID: ${connection.id}`,
          connectionId: connection.id,
          severity: "error"
        })
      }
      connectionIds.add(connection.id)

      // Validate source and target nodes exist
      if (!nodeIds.has(connection.source)) {
        errors.push({
          code: "INVALID_SOURCE_NODE",
          message: `Connection ${connection.id} references non-existent source node: ${connection.source}`,
          connectionId: connection.id,
          severity: "error"
        })
      }

      if (!nodeIds.has(connection.target)) {
        errors.push({
          code: "INVALID_TARGET_NODE",
          message: `Connection ${connection.id} references non-existent target node: ${connection.target}`,
          connectionId: connection.id,
          severity: "error"
        })
      }

      // Check for self-connections
      if (connection.source === connection.target) {
        warnings.push({
          code: "SELF_CONNECTION",
          message: `Connection ${connection.id} connects node to itself`,
          connectionId: connection.id,
          severity: "warning",
          suggestion: "Consider if this self-connection is intentional"
        })
      }
    }
  }

  protected async validateBusinessLogic(workflow: IWorkflowDefinition, errors: any[], warnings: any[]): Promise<void> {
    // Validate business logic references
    for (const node of workflow.nodes) {
      if (node.data.businessLogic) {
        // Check if business logic template exists
        const isValid = await this.validateBusinessLogicReference(node.data.businessLogic)
        if (!isValid) {
          errors.push({
            code: "INVALID_BUSINESS_LOGIC",
            message: `Node ${node.id} references invalid business logic: ${node.data.businessLogic}`,
            nodeId: node.id,
            severity: "error"
          })
        }
      }

      // Validate rules
      if (node.data.rules && Array.isArray(node.data.rules)) {
        for (const rule of node.data.rules) {
          if (!rule.condition || !rule.action) {
            warnings.push({
              code: "INCOMPLETE_RULE",
              message: `Node ${node.id} has incomplete rule`,
              nodeId: node.id,
              severity: "warning",
              suggestion: "Ensure all rules have both condition and action defined"
            })
          }
        }
      }
    }
  }

  protected async validateBusinessLogicReference(businessLogicId: string): Promise<boolean> {
    // Override in concrete implementations
    return true
  }

  protected async loadTemplates(): Promise<IWorkflowTemplate[]> {
    // Override in concrete implementations
    return []
  }

  protected applyCustomizations(items: any[], customizations?: any[]): any[] {
    if (!customizations) return items

    return items.map((item, index) => {
      const customization = customizations[index]
      if (customization) {
        return { ...item, ...customization }
      }
      return item
    })
  }

  protected abstract performExecution(
    workflow: IWorkflowDefinition, 
    context: ExecutionContext, 
    startTime: number
  ): Promise<ExecutionResult>

  protected createError(code: string, message: string, context?: Record<string, any>): WorkflowError {
    const error = new Error(message) as WorkflowError
    error.code = code
    error.context = context
    return error
  }

  protected handleError(operation: string, error: unknown): WorkflowError {
    const message = error instanceof Error ? error.message : "Unknown error"
    const workflowError = this.createError("SERVICE_ERROR", `${this.serviceName}.${operation}: ${message}`)
    
    // Log error (in real implementation, use proper logging)
    console.error(`[${this.serviceName}] ${operation} failed:`, error)
    
    return workflowError
  }

  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString()
  }
}