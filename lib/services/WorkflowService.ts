import { 
  WorkflowDefinition, 
  BaseWorkflowNode, 
  WorkflowConnection,
  WorkflowExecutionContext,
  WorkflowValidationResult,
  WorkflowTemplate
} from '@/lib/types/workflow'
import { WorkflowRepository } from '@/lib/repositories/WorkflowRepository'
import { WorkflowValidator } from '@/lib/validators/WorkflowValidator'
import { WorkflowExecutor } from '@/lib/executors/WorkflowExecutor'
import { BusinessLogicService } from './BusinessLogicService'

export interface WorkflowServiceConfig {
  repository: WorkflowRepository
  validator: WorkflowValidator
  executor: WorkflowExecutor
  businessLogic: BusinessLogicService
}

export class WorkflowService {
  private repository: WorkflowRepository
  private validator: WorkflowValidator
  private executor: WorkflowExecutor
  private businessLogic: BusinessLogicService

  constructor(config: WorkflowServiceConfig) {
    this.repository = config.repository
    this.validator = config.validator
    this.executor = config.executor
    this.businessLogic = config.businessLogic
  }

  // Workflow CRUD Operations
  async createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowDefinition> {
    // Ensure all required fields are present
    const completeDefinition = {
      ...definition,
      name: definition.name || 'Untitled Workflow',
      description: definition.description || '',
      version: definition.version || '1.0.0',
      status: definition.status || 'draft' as const,
      nodes: definition.nodes || [],
      connections: definition.connections || [],
      dataRequirements: definition.dataRequirements || { required: [], optional: [], external: [], computed: [] },
      businessRules: definition.businessRules || [],
      configuration: definition.configuration || {
        timeout: 30000,
        maxRetries: 3,
        errorHandling: { strategy: 'fail_fast', fallbackAction: undefined, notifyOnError: true, logErrors: true },
        logging: { level: 'info', includePayload: false, includeTimings: true, destinations: ['console'] },
        notifications: [],
        performance: { enableProfiling: false, maxExecutionTime: 60000, memoryLimit: 512, concurrentExecutions: 1 }
      },
      metadata: {
        ...definition.metadata,
        createdAt: definition.metadata?.createdAt || new Date(),
        updatedAt: definition.metadata?.updatedAt || new Date(),
        createdBy: definition.metadata?.createdBy || 'system',
        updatedBy: definition.metadata?.updatedBy || 'system',
        tags: definition.metadata?.tags || [],
        category: definition.metadata?.category || 'general',
        priority: definition.metadata?.priority || 'medium' as const,
        estimatedExecutionTime: definition.metadata?.estimatedExecutionTime || 0,
        dependencies: definition.metadata?.dependencies || []
      }
    }

    // Validate the workflow before creation
    const validationResults = await this.validateWorkflow({
      ...completeDefinition,
      id: 'temp'
    })

    if (validationResults.some(r => !r.isValid || r.errors.some(e => e.severity === 'error'))) {
      throw new Error('Cannot create workflow with validation errors')
    }

    // Apply business rules
    const processedDefinition = await this.businessLogic.processWorkflowDefinition(completeDefinition)

    // Ensure the processed definition has all required fields
    const finalDefinition: Omit<WorkflowDefinition, 'id'> = {
      ...completeDefinition,
      ...processedDefinition,
      // Ensure required fields are not undefined
      name: processedDefinition.name || completeDefinition.name,
      description: processedDefinition.description || completeDefinition.description,
      version: processedDefinition.version || completeDefinition.version,
      status: processedDefinition.status || completeDefinition.status,
      nodes: processedDefinition.nodes || completeDefinition.nodes,
      connections: processedDefinition.connections || completeDefinition.connections,
      dataRequirements: processedDefinition.dataRequirements || completeDefinition.dataRequirements,
      businessRules: processedDefinition.businessRules || completeDefinition.businessRules,
      configuration: processedDefinition.configuration || completeDefinition.configuration,
      metadata: processedDefinition.metadata || completeDefinition.metadata
    }

    return this.repository.create(finalDefinition)
  }

  async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    return this.repository.findById(id)
  }

  async updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error(`Workflow with id ${id} not found`)
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() }

    // Validate the updated workflow
    const validationResults = await this.validateWorkflow(updated)
    if (validationResults.some(r => !r.isValid || r.errors.some(e => e.severity === 'error'))) {
      throw new Error('Cannot update workflow with validation errors')
    }

    // Apply business rules
    const processedDefinition = await this.businessLogic.processWorkflowDefinition(updated)

    return this.repository.update(id, processedDefinition)
  }

  async deleteWorkflow(id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new Error(`Workflow with id ${id} not found`)
    }

    // Check business rules for deletion
    const canDelete = await this.businessLogic.canDeleteWorkflow(existing)
    if (!canDelete.allowed) {
      throw new Error(canDelete.reason || 'Cannot delete workflow')
    }

    return this.repository.delete(id)
  }

  async listWorkflows(filters?: {
    status?: string
    category?: string
    tags?: string[]
    limit?: number
    offset?: number
  }): Promise<{ workflows: WorkflowDefinition[]; total: number }> {
    return this.repository.findMany(filters)
  }

  // Node Operations
  async addNode(workflowId: string, node: Omit<BaseWorkflowNode, 'id'>): Promise<BaseWorkflowNode> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    // Apply business rules to the node
    const processedNode = await this.businessLogic.processWorkflowNode(node)

    // Generate unique ID
    const nodeWithId: BaseWorkflowNode = {
      ...processedNode,
      id: this.generateNodeId()
    }

    // Add to workflow
    const updatedWorkflow = {
      ...workflow,
      nodes: [...workflow.nodes, nodeWithId],
      updatedAt: new Date()
    }

    await this.updateWorkflow(workflowId, updatedWorkflow)
    return nodeWithId
  }

  async updateNode(workflowId: string, nodeId: string, updates: Partial<BaseWorkflowNode>): Promise<BaseWorkflowNode> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`)
    }

    const existingNode = workflow.nodes[nodeIndex]
    const updatedNode = { ...existingNode, ...updates }

    // Apply business rules
    const processedNode = await this.businessLogic.processWorkflowNode(updatedNode)

    // Update workflow
    const updatedNodes = [...workflow.nodes]
    updatedNodes[nodeIndex] = processedNode

    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes,
      updatedAt: new Date()
    }

    await this.updateWorkflow(workflowId, updatedWorkflow)
    return processedNode
  }

  async deleteNode(workflowId: string, nodeId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    // Check business rules for node deletion
    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`)
    }

    const canDelete = await this.businessLogic.canDeleteNode(workflow, node)
    if (!canDelete.allowed) {
      throw new Error(canDelete.reason || 'Cannot delete node')
    }

    // Remove node and related connections
    const updatedNodes = workflow.nodes.filter(n => n.id !== nodeId)
    const updatedConnections = workflow.connections.filter(
      c => c.source !== nodeId && c.target !== nodeId
    )

    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes,
      connections: updatedConnections,
      updatedAt: new Date()
    }

    await this.updateWorkflow(workflowId, updatedWorkflow)
  }

  // Connection Operations
  async addConnection(workflowId: string, connection: Omit<WorkflowConnection, 'id'>): Promise<WorkflowConnection> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    // Validate connection
    const sourceNode = workflow.nodes.find(n => n.id === connection.source)
    const targetNode = workflow.nodes.find(n => n.id === connection.target)

    if (!sourceNode || !targetNode) {
      throw new Error('Invalid connection: source or target node not found')
    }

    // Check business rules
    const canConnect = await this.businessLogic.canConnectNodes(sourceNode, targetNode)
    if (!canConnect.allowed) {
      throw new Error(canConnect.reason || 'Cannot connect these nodes')
    }

    // Apply business rules to connection
    const processedConnection = await this.businessLogic.processWorkflowConnection(connection)

    const connectionWithId: WorkflowConnection = {
      ...processedConnection,
      id: this.generateConnectionId()
    }

    // Update workflow
    const updatedWorkflow = {
      ...workflow,
      connections: [...workflow.connections, connectionWithId],
      updatedAt: new Date()
    }

    await this.updateWorkflow(workflowId, updatedWorkflow)
    return connectionWithId
  }

  async updateConnection(workflowId: string, connectionId: string, updates: Partial<WorkflowConnection>): Promise<WorkflowConnection> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    const connectionIndex = workflow.connections.findIndex(c => c.id === connectionId)
    if (connectionIndex === -1) {
      throw new Error(`Connection with id ${connectionId} not found`)
    }

    const existingConnection = workflow.connections[connectionIndex]
    const updatedConnection = { ...existingConnection, ...updates }

    // Apply business rules
    const processedConnection = await this.businessLogic.processWorkflowConnection(updatedConnection)

    // Update workflow
    const updatedConnections = [...workflow.connections]
    updatedConnections[connectionIndex] = processedConnection

    const updatedWorkflow = {
      ...workflow,
      connections: updatedConnections,
      updatedAt: new Date()
    }

    await this.updateWorkflow(workflowId, updatedWorkflow)
    return processedConnection
  }

  async deleteConnection(workflowId: string, connectionId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    const updatedConnections = workflow.connections.filter(c => c.id !== connectionId)

    const updatedWorkflow = {
      ...workflow,
      connections: updatedConnections,
      updatedAt: new Date()
    }

    await this.updateWorkflow(workflowId, updatedWorkflow)
  }

  // Validation
  async validateWorkflow(workflow: WorkflowDefinition): Promise<WorkflowValidationResult[]> {
    const structuralResults = await this.validator.validateStructure(workflow)
    const businessResult = await this.businessLogic.validateWorkflow(workflow)
    
    // Convert ValidationResult to WorkflowValidationResult
    const businessResults: WorkflowValidationResult[] = businessResult.errors.length > 0 || businessResult.warnings.length > 0 ? [{
      isValid: businessResult.errors.length === 0,
      errors: businessResult.errors.map(error => ({
        code: error.code,
        message: error.message,
        nodeId: error.nodeId,
        connectionId: error.connectionId,
        severity: error.severity
      })),
      warnings: businessResult.warnings.map(warning => ({
        code: warning.code,
        message: warning.message,
        nodeId: warning.nodeId,
        connectionId: warning.connectionId,
        suggestion: warning.suggestion
      }))
    }] : []
    
    return [...structuralResults, ...businessResults]
  }

  async validateNode(workflow: WorkflowDefinition, node: BaseWorkflowNode): Promise<WorkflowValidationResult[]> {
    const structuralResults = await this.validator.validateNode(workflow, node)
    const businessResult = await this.businessLogic.validateNode(workflow, node)
    
    // Convert ValidationResult to WorkflowValidationResult
    const businessResults: WorkflowValidationResult[] = businessResult.errors.length > 0 || businessResult.warnings.length > 0 ? [{
      isValid: businessResult.errors.length === 0,
      errors: businessResult.errors.map(error => ({
        code: error.code,
        message: error.message,
        nodeId: error.nodeId,
        connectionId: error.connectionId,
        severity: error.severity
      })),
      warnings: businessResult.warnings.map(warning => ({
        code: warning.code,
        message: warning.message,
        nodeId: warning.nodeId,
        connectionId: warning.connectionId,
        suggestion: warning.suggestion
      })),
      nodeId: node.id
    }] : []
    
    return [...structuralResults, ...businessResults]
  }

  // Execution
  async executeWorkflow(workflowId: string, context: WorkflowExecutionContext): Promise<any> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    // Validate before execution
    const validationResults = await this.validateWorkflow(workflow)
    if (validationResults.some(r => !r.isValid || r.errors.some(e => e.severity === 'error'))) {
      throw new Error('Cannot execute workflow with validation errors')
    }

    // Check business rules for execution
    const canExecute = await this.businessLogic.canExecuteWorkflow(workflow, context)
    if (!canExecute.allowed) {
      throw new Error(canExecute.reason || 'Cannot execute workflow')
    }

    return this.executor.execute(workflow, context)
  }

  async testWorkflow(workflowId: string, testData: any): Promise<any> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    return this.executor.test(workflow, testData)
  }

  // Templates
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return this.repository.getTemplates()
  }

  async createWorkflowFromTemplate(templateId: string, customizations?: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const template = await this.repository.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    const workflowDefinition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'> = {
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      version: '1.0.0',
      status: 'draft',
      nodes: template.nodes.map(node => ({
        ...node,
        id: this.generateNodeId()
      })),
      connections: template.connections.map(conn => ({
        ...conn,
        id: this.generateConnectionId()
      })),
      dataRequirements: { required: [], optional: [], external: [], computed: [] },
      businessRules: [],
      configuration: {
        timeout: 30000,
        maxRetries: 3,
        errorHandling: { strategy: 'fail_fast', fallbackAction: undefined, notifyOnError: true, logErrors: true },
        logging: { level: 'info', includePayload: false, includeTimings: true, destinations: ['console'] },
        notifications: [],
        performance: { enableProfiling: false, maxExecutionTime: 60000, memoryLimit: 512, concurrentExecutions: 1 }
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: customizations?.metadata?.createdBy || 'system',
        updatedBy: customizations?.metadata?.updatedBy || 'system',
        tags: customizations?.metadata?.tags || template.tags || [],
        category: customizations?.metadata?.category || template.category || 'general',
        priority: customizations?.metadata?.priority || 'medium' as const,
        estimatedExecutionTime: customizations?.metadata?.estimatedExecutionTime || 0,
        dependencies: customizations?.metadata?.dependencies || []
      }
    }

    return this.createWorkflow(workflowDefinition)
  }

  // Utility methods
  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Workflow Analysis
  async analyzeWorkflow(workflowId: string): Promise<{
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
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow with id ${workflowId} not found`)
    }

    return this.businessLogic.analyzeWorkflow(workflow)
  }
}