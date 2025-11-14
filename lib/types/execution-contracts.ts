/**
 * Workflow Execution Contracts
 * 
 * Defines the standard interfaces for node execution, connectors,
 * and the execution engine runtime.
 */

import { WorkflowNode, WorkflowConnection } from './unified-workflow'

// ============================================================================
// EXECUTION CONTEXT & STATE
// ============================================================================

/**
 * Global workflow execution context that flows through all nodes
 */
export interface WorkflowExecutionContext {
  /** Unique execution ID for tracking */
  executionId: string
  /** Workflow being executed */
  workflowId: string
  /** Shared state that nodes can read/write */
  variables: Record<string, any>
  /** Input data provided to the workflow */
  inputData: Record<string, any>
  /** Execution metadata */
  metadata: {
    startTime: Date
    currentNodeId: string
    executionPath: string[]
    userId?: string
    sessionId?: string
  }
  /** Error context if any */
  errors: ExecutionError[]
}

/**
 * Result of node execution
 */
export interface NodeExecutionResult {
  /** Whether execution was successful */
  success: boolean
  /** Output data from the node */
  output: Record<string, any>
  /** Which connector to follow next */
  nextConnector: ConnectorType
  /** Any errors that occurred */
  error?: ExecutionError
  /** Execution metadata */
  metadata: {
    executionTime: number
    nodeId: string
    timestamp: Date
  }
}

/**
 * Execution error with context
 */
export interface ExecutionError {
  code: string
  message: string
  nodeId: string
  timestamp: Date
  stack?: string
  context?: Record<string, any>
}

// ============================================================================
// CONNECTOR TYPES & EXECUTION
// ============================================================================

/**
 * Types of connectors for different execution paths
 */
export type ConnectorType = 
  | 'default'      // Normal flow to next node
  | 'success'      // Successful execution path
  | 'failure'      // Failed execution path
  | 'true'         // Condition evaluated to true
  | 'false'        // Condition evaluated to false
  | 'error'        // Error fallback path
  | 'timeout'      // Timeout fallback path
  | 'manual'       // Manual review required

/**
 * Enhanced workflow connection with execution logic
 */
export interface ExecutableConnection extends WorkflowConnection {
  /** Type of connector for execution routing */
  connectorType: ConnectorType
  /** Condition to evaluate for conditional connectors */
  condition?: string
  /** Priority when multiple connectors match */
  priority: number
  /** Whether this connector handles errors */
  isErrorHandler: boolean
}

/**
 * Result of connector evaluation
 */
export interface ConnectorEvaluationResult {
  /** Whether this connector should be followed */
  shouldFollow: boolean
  /** Target node ID if connector should be followed */
  targetNodeId?: string
  /** Reason for the decision */
  reason: string
}

// ============================================================================
// NODE EXECUTION CONTRACT
// ============================================================================

/**
 * Standard interface that all executable nodes must implement
 */
export interface ExecutableNode {
  /** Node configuration */
  node: WorkflowNode
  /** Execute the node with given context */
  execute(context: WorkflowExecutionContext): Promise<NodeExecutionResult>
  /** Validate node configuration */
  validate(): ValidationResult
  /** Get input schema for this node type */
  getInputSchema(): Record<string, any>
  /** Get output schema for this node type */
  getOutputSchema(): Record<string, any>
}

/**
 * Validation result for node configuration
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================================================
// EXECUTION ENGINE INTERFACE
// ============================================================================

/**
 * Workflow execution engine interface
 */
export interface IWorkflowExecutionEngine {
  /** Execute a complete workflow */
  executeWorkflow(
    workflowId: string, 
    inputData: Record<string, any>,
    options?: ExecutionOptions
  ): Promise<WorkflowExecutionResult>
  
  /** Execute a single node */
  executeNode(
    node: WorkflowNode, 
    context: WorkflowExecutionContext
  ): Promise<NodeExecutionResult>
  
  /** Evaluate connectors to find next node */
  evaluateConnectors(
    connections: ExecutableConnection[],
    context: WorkflowExecutionContext,
    nodeResult: NodeExecutionResult
  ): Promise<string | null>
  
  /** Pause execution (for async operations) */
  pauseExecution(executionId: string, reason: string): Promise<void>
  
  /** Resume paused execution */
  resumeExecution(executionId: string, resumeData?: Record<string, any>): Promise<void>
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  /** Maximum execution time in milliseconds */
  timeout?: number
  /** Whether to enable debug mode */
  debug?: boolean
  /** Custom variable overrides */
  variableOverrides?: Record<string, any>
  /** Execution mode */
  mode?: 'sync' | 'async' | 'step'
}

/**
 * Final workflow execution result
 */
export interface WorkflowExecutionResult {
  /** Execution ID */
  executionId: string
  /** Whether workflow completed successfully */
  success: boolean
  /** Final output data */
  output: Record<string, any>
  /** Final decision if applicable */
  decision?: {
    type: 'approved' | 'declined' | 'manual_review' | 'pending'
    confidence: number
    reasons: string[]
  }
  /** Execution metadata */
  metadata: {
    startTime: Date
    endTime: Date
    duration: number
    nodesExecuted: number
    executionPath: string[]
  }
  /** Any errors that occurred */
  errors: ExecutionError[]
  /** Final execution context */
  context: WorkflowExecutionContext
}

// ============================================================================
// ASYNC EXECUTION SUPPORT
// ============================================================================

/**
 * Async operation handle for long-running tasks
 */
export interface AsyncOperationHandle {
  /** Operation ID */
  operationId: string
  /** Node that initiated the operation */
  nodeId: string
  /** Operation type */
  type: 'api_call' | 'data_fetch' | 'external_service' | 'manual_review'
  /** Operation status */
  status: 'pending' | 'completed' | 'failed' | 'timeout'
  /** Result data when completed */
  result?: any
  /** Error if failed */
  error?: ExecutionError
  /** Callback to resume execution */
  resumeCallback: (result: any) => Promise<void>
}

/**
 * Registry for managing async operations
 */
export interface IAsyncOperationRegistry {
  /** Register a new async operation */
  register(operation: AsyncOperationHandle): Promise<void>
  /** Complete an async operation */
  complete(operationId: string, result: any): Promise<void>
  /** Fail an async operation */
  fail(operationId: string, error: ExecutionError): Promise<void>
  /** Get operation status */
  getStatus(operationId: string): Promise<AsyncOperationHandle | null>
  /** Cleanup completed operations */
  cleanup(olderThan: Date): Promise<void>
}

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

/**
 * Type guard for executable nodes
 */
export function isExecutableNode(obj: any): obj is ExecutableNode {
  return obj && 
    typeof obj.execute === 'function' &&
    typeof obj.validate === 'function' &&
    obj.node !== undefined
}

/**
 * Type guard for executable connections
 */
export function isExecutableConnection(obj: any): obj is ExecutableConnection {
  return obj &&
    typeof obj.connectorType === 'string' &&
    typeof obj.priority === 'number' &&
    typeof obj.isErrorHandler === 'boolean'
}

/**
 * Create default execution context
 */
export function createExecutionContext(
  workflowId: string,
  inputData: Record<string, any>,
  options: Partial<WorkflowExecutionContext> = {}
): WorkflowExecutionContext {
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    executionId,
    workflowId,
    variables: {},
    inputData: { ...inputData },
    metadata: {
      startTime: new Date(),
      currentNodeId: '',
      executionPath: [],
      ...options.metadata
    },
    errors: [],
    ...options
  }
}