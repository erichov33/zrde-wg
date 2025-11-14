/**
 * Base Node Executor
 * 
 * Abstract base class for all node executors
 */

import {
  ExecutableNode,
  WorkflowExecutionContext,
  NodeExecutionResult,
  ValidationResult,
  ExecutionError
} from '../../types/execution-contracts'
import { WorkflowNode } from '../../types/unified-workflow'

/**
 * Abstract base class for node executors
 */
export abstract class BaseNodeExecutor implements ExecutableNode {
  public node: WorkflowNode

  constructor(node: WorkflowNode) {
    this.node = node
  }

  /**
   * Execute the node - must be implemented by subclasses
   */
  abstract execute(context: WorkflowExecutionContext): Promise<NodeExecutionResult>

  /**
   * Validate node configuration
   */
  validate(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic validation
    if (!this.node.id) {
      errors.push('Node ID is required')
    }

    if (!this.node.data?.label) {
      warnings.push('Node label is recommended')
    }

    // Allow subclasses to add their own validation
    const customValidation = this.validateNodeSpecific()
    errors.push(...customValidation.errors)
    warnings.push(...customValidation.warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Node-specific validation - override in subclasses
   */
  protected validateNodeSpecific(): ValidationResult {
    return { isValid: true, errors: [], warnings: [] }
  }

  /**
   * Get input schema for this node type
   */
  getInputSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        // Base properties that all nodes can access
        variables: { type: 'object' },
        inputData: { type: 'object' }
      }
    }
  }

  /**
   * Get output schema for this node type
   */
  getOutputSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        output: { type: 'object' }
      }
    }
  }

  /**
   * Create a successful execution result
   */
  protected createSuccessResult(
    output: Record<string, any>,
    nextConnector: string = 'default'
  ): NodeExecutionResult {
    return {
      success: true,
      output,
      nextConnector: nextConnector as any,
      metadata: {
        executionTime: 0, // Will be set by the engine
        nodeId: this.node.id,
        timestamp: new Date()
      }
    }
  }

  /**
   * Create a failed execution result
   */
  protected createErrorResult(
    error: string | ExecutionError,
    output: Record<string, any> = {}
  ): NodeExecutionResult {
    const executionError: ExecutionError = typeof error === 'string' 
      ? {
          code: 'NODE_EXECUTION_ERROR',
          message: error,
          nodeId: this.node.id,
          timestamp: new Date()
        }
      : error

    return {
      success: false,
      output,
      nextConnector: 'error',
      error: executionError,
      metadata: {
        executionTime: 0,
        nodeId: this.node.id,
        timestamp: new Date()
      }
    }
  }

  /**
   * Safely get node configuration value
   */
  protected getConfig<T>(key: string, defaultValue?: T): T {
    return this.node.data?.config?.[key] ?? defaultValue
  }

  /**
   * Update workflow context variables
   */
  protected updateContext(
    context: WorkflowExecutionContext,
    updates: Record<string, any>
  ): void {
    Object.assign(context.variables, updates)
  }

  /**
   * Log execution information
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      level,
      message,
      nodeId: this.node.id,
      nodeType: this.node.type,
      timestamp: new Date(),
      data
    }

    // In production, this would integrate with your logging system
    console.log(`[${level.toUpperCase()}] ${message}`, logEntry)
  }
}