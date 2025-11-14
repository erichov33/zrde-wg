/**
 * Workflow Execution Engine
 * 
 * Core runtime engine that executes workflows by traversing nodes
 * and following connectors based on execution results.
 */

import {
  IWorkflowExecutionEngine,
  WorkflowExecutionContext,
  NodeExecutionResult,
  ExecutableConnection,
  ConnectorEvaluationResult,
  WorkflowExecutionResult,
  ExecutionOptions,
  ExecutionError,
  AsyncOperationHandle,
  IAsyncOperationRegistry,
  createExecutionContext
} from '../types/execution-contracts'
import { WorkflowNode, WorkflowConfig, IWorkflowService } from '../types/unified-workflow'
import { NodeExecutorFactory } from './node-executor-factory'
import { AsyncOperationRegistry } from './async-operation-registry'

/**
 * Main workflow execution engine
 */
export class WorkflowExecutionEngine implements IWorkflowExecutionEngine {
  private nodeExecutorFactory: NodeExecutorFactory
  private asyncRegistry: IAsyncOperationRegistry
  private workflowService: IWorkflowService
  private activeExecutions = new Map<string, WorkflowExecutionContext>()

  constructor(workflowService: IWorkflowService) {
    this.workflowService = workflowService
    this.nodeExecutorFactory = new NodeExecutorFactory()
    this.asyncRegistry = new AsyncOperationRegistry()
  }

  /**
   * Execute a complete workflow from start to finish
   */
  async executeWorkflow(
    workflowId: string,
    inputData: Record<string, any>,
    options: ExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    const startTime = new Date()
    const context = createExecutionContext(workflowId, inputData, {
      metadata: {
        startTime,
        currentNodeId: '',
        executionPath: [],
        userId: options.variableOverrides?.userId,
        sessionId: options.variableOverrides?.sessionId
      }
    })

    // Apply variable overrides
    if (options.variableOverrides) {
      Object.assign(context.variables, options.variableOverrides)
    }

    this.activeExecutions.set(context.executionId, context)

    try {
      // Load workflow definition
      const workflow = await this.loadWorkflow(workflowId)
      
      // Find start node
      const startNode = workflow.nodes.find(node => node.type === 'start')
      if (!startNode) {
        throw new Error(`No start node found in workflow ${workflowId}`)
      }

      // Execute workflow loop
      const result = await this.executeWorkflowLoop(workflow, startNode, context, options)
      
      return {
        executionId: context.executionId,
        success: result.success,
        output: result.output,
        decision: result.decision,
        metadata: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime(),
          nodesExecuted: context.metadata.executionPath.length,
          executionPath: context.metadata.executionPath
        },
        errors: context.errors,
        context
      }
    } catch (error) {
      const executionError: ExecutionError = {
        code: 'WORKFLOW_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        nodeId: context.metadata.currentNodeId,
        timestamp: new Date(),
        stack: error instanceof Error ? error.stack : undefined
      }

      context.errors.push(executionError)

      return {
        executionId: context.executionId,
        success: false,
        output: {},
        metadata: {
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime(),
          nodesExecuted: context.metadata.executionPath.length,
          executionPath: context.metadata.executionPath
        },
        errors: context.errors,
        context
      }
    } finally {
      this.activeExecutions.delete(context.executionId)
    }
  }

  /**
   * Main execution loop that traverses the workflow graph
   */
  private async executeWorkflowLoop(
    workflow: WorkflowConfig,
    currentNode: WorkflowNode,
    context: WorkflowExecutionContext,
    options: ExecutionOptions
  ): Promise<{ success: boolean; output: Record<string, any>; decision?: any }> {
    const maxIterations = 1000 // Prevent infinite loops
    let iterations = 0
    const finalOutput: Record<string, any> = {}
    let finalDecision: any = undefined

    while (currentNode && iterations < maxIterations) {
      iterations++
      
      // Update current node in context
      context.metadata.currentNodeId = currentNode.id
      context.metadata.executionPath.push(currentNode.id)

      // Check for timeout
      if (options.timeout && Date.now() - context.metadata.startTime.getTime() > options.timeout) {
        throw new Error(`Workflow execution timeout after ${options.timeout}ms`)
      }

      // Execute current node
      const nodeResult = await this.executeNode(currentNode, context)
      
      // Handle node execution result
      if (!nodeResult.success && nodeResult.error) {
        context.errors.push(nodeResult.error)
        
        const errorConnections = this.getNodeConnections(workflow, currentNode.id)
          .filter(conn => conn.connectorType === 'error' || conn.isErrorHandler)
        
        if (errorConnections.length > 0) {
          const nextNodeId = await this.evaluateConnectors(errorConnections, context, nodeResult)
          if (nextNodeId) {
            const nextNode = this.findNodeById(workflow, nextNodeId)
            if (!nextNode) {
              throw new Error(`Next node ${nextNodeId} not found in workflow`)
            }
            currentNode = nextNode
            continue
          }
        }
        
        throw new Error(`Node ${currentNode.id} failed: ${nodeResult.error.message}`)
      }

      // Merge node output into final output
      Object.assign(finalOutput, nodeResult.output)

      // Check if this is an end node
      if (currentNode.type === 'end') {
        finalDecision = nodeResult.output.decision || finalDecision
        break
      }

      // Find next node to execute
      const connections = this.getNodeConnections(workflow, currentNode.id)
      const nextNodeId = await this.evaluateConnectors(connections, context, nodeResult)
      
      if (!nextNodeId) {
        break
      }

      const nextNode = this.findNodeById(workflow, nextNodeId)
      if (!nextNode) {
        throw new Error(`Next node ${nextNodeId} not found in workflow`)
      }
      currentNode = nextNode
    }

    if (iterations >= maxIterations) {
      throw new Error('Workflow execution exceeded maximum iterations (possible infinite loop)')
    }

    return {
      success: context.errors.length === 0,
      output: finalOutput,
      decision: finalDecision
    }
  }

  /**
   * Execute a single node
   */
  async executeNode(
    node: WorkflowNode,
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now()
    
    try {
      // Get node executor
      const executor = this.nodeExecutorFactory.createExecutor(node)
      
      // Execute the node
      const result = await executor.execute(context)
      
      // Update execution time
      result.metadata.executionTime = Date.now() - startTime
      
      return result
    } catch (error) {
      const executionError: ExecutionError = {
        code: 'NODE_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        nodeId: node.id,
        timestamp: new Date(),
        stack: error instanceof Error ? error.stack : undefined,
        context: { nodeType: node.type, nodeData: node.data }
      }

      return {
        success: false,
        output: {},
        nextConnector: 'error',
        error: executionError,
        metadata: {
          executionTime: Date.now() - startTime,
          nodeId: node.id,
          timestamp: new Date()
        }
      }
    }
  }

  /**
   * Evaluate connectors to determine next node
   */
  async evaluateConnectors(
    connections: ExecutableConnection[],
    context: WorkflowExecutionContext,
    nodeResult: NodeExecutionResult
  ): Promise<string | null> {
    if (connections.length === 0) {
      return null
    }

    // Sort connections by priority (higher priority first)
    const sortedConnections = connections.sort((a, b) => b.priority - a.priority)

    for (const connection of sortedConnections) {
      const evaluation = await this.evaluateConnection(connection, context, nodeResult)
      
      if (evaluation.shouldFollow && evaluation.targetNodeId) {
        return evaluation.targetNodeId
      }
    }

    // If no specific connector matches, try to find a default connector
    const defaultConnection = connections.find(conn => conn.connectorType === 'default')
    return defaultConnection?.target || null
  }

  /**
   * Evaluate a single connection
   */
  private async evaluateConnection(
    connection: ExecutableConnection,
    context: WorkflowExecutionContext,
    nodeResult: NodeExecutionResult
  ): Promise<ConnectorEvaluationResult> {
    // Check connector type match
    if (connection.connectorType !== nodeResult.nextConnector && 
        connection.connectorType !== 'default') {
      return {
        shouldFollow: false,
        reason: `Connector type mismatch: expected ${connection.connectorType}, got ${nodeResult.nextConnector}`
      }
    }

    // Evaluate condition if present
    if (connection.condition) {
      const conditionResult = this.evaluateCondition(connection.condition, context, nodeResult)
      if (!conditionResult) {
        return {
          shouldFollow: false,
          reason: `Condition failed: ${connection.condition}`
        }
      }
    }

    return {
      shouldFollow: true,
      targetNodeId: connection.target,
      reason: `Connector ${connection.connectorType} matched`
    }
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(
    condition: string,
    context: WorkflowExecutionContext,
    nodeResult: NodeExecutionResult
  ): boolean {
    try {
      // Simple condition evaluation (can be enhanced with a proper expression parser)
      // For now, support basic comparisons like "output.score > 0.8"
      
      const variables = {
        ...context.variables,
        ...context.inputData,
        output: nodeResult.output,
        input: context.inputData
      }

      // Replace variables in condition
      let evaluatedCondition = condition
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g')
        evaluatedCondition = evaluatedCondition.replace(regex, JSON.stringify(value))
      }

      // Use Function constructor for safe evaluation (in production, use a proper expression parser)
      return new Function(`return ${evaluatedCondition}`)()
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error)
      return false
    }
  }

  /**
   * Pause execution for async operations
   */
  async pauseExecution(executionId: string, reason: string): Promise<void> {
    const context = this.activeExecutions.get(executionId)
    if (!context) {
      throw new Error(`Execution ${executionId} not found`)
    }

    // Implementation depends on your async operation requirements
    // This is a placeholder for the async operation registry
  }

  /**
   * Resume paused execution
   */
  async resumeExecution(executionId: string, resumeData?: Record<string, any>): Promise<void> {
    const context = this.activeExecutions.get(executionId)
    if (!context) {
      throw new Error(`Execution ${executionId} not found`)
    }

    if (resumeData) {
      Object.assign(context.variables, resumeData)
    }

    // Resume execution logic would go here
  }

  // Helper methods
  private async loadWorkflow(workflowId: string): Promise<WorkflowConfig> {
    return await this.workflowService.getWorkflow(workflowId)
  }

  private getNodeConnections(workflow: WorkflowConfig, nodeId: string): ExecutableConnection[] {
    return workflow.connections
      .filter(conn => conn.source === nodeId)
      .map(conn => ({
        ...conn,
        connectorType: (conn as any).connectorType || 'default',
        priority: (conn as any).priority || 0,
        isErrorHandler: (conn as any).isErrorHandler || false
      }))
  }

  private findNodeById(workflow: WorkflowConfig, nodeId: string): WorkflowNode | null {
    return workflow.nodes.find(node => node.id === nodeId) || null
  }
}