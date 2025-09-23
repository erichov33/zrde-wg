/**
 * Unified Workflow Type System
 * Centralized type definitions for all workflow-related functionality
 */

import { z } from 'zod'

// ============================================================================
// Core Workflow Types
// ============================================================================

/**
 * Workflow template interface for saving and loading workflow configurations
 */
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  nodes: BaseWorkflowNode[]
  connections: WorkflowConnection[]
  metadata: {
    author: string
    version: string
    createdAt: Date
    updatedAt: Date
    usageCount?: number
  }
}

/**
 * Base workflow node interface
 */
export interface BaseWorkflowNode {
  id: string
  type: WorkflowNodeType
  position: Position
  data: NodeData
  metadata?: NodeMetadata
}

/**
 * All supported workflow node types
 */
export type WorkflowNodeType = 
  | 'start'
  | 'condition' 
  | 'action'
  | 'end'
  | 'data_source'
  | 'rule_set'
  | 'decision'
  | 'validation'
  | 'task'
  | 'loop'
  | 'delay'
  | 'error'
  | 'data'
  | 'transform'
  | 'api'
  | 'email'
  | 'webhook'
  | 'file'
  | 'integration'
  | 'notification'
  | 'ai_decision'
  | 'batch_process'
  | 'audit_log'

/**
 * Position coordinates for nodes
 */
export interface Position {
  x: number
  y: number
}

/**
 * Node data containing configuration and business logic
 */
export interface NodeData {
  label: string
  description?: string
  config?: Record<string, any>
  rules?: BusinessRule[]
  dataSource?: DataSourceConfig
  conditions?: ConditionConfig[]
  businessLogic?: BusinessLogicConfig
  validation?: ValidationConfig
}

/**
 * Node metadata for tracking and debugging
 */
export interface NodeMetadata {
  createdAt: Date
  updatedAt: Date
  version: string
  tags?: string[]
  author?: string
}

/**
 * Workflow connection between nodes
 */
export interface WorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
  conditions?: Record<string, string> | string
  metadata?: ConnectionMetadata
}

/**
 * Connection metadata
 */
export interface ConnectionMetadata {
  createdAt: Date
  priority?: number
  description?: string
}

// ============================================================================
// Business Logic Types
// ============================================================================

/**
 * Business rule definition
 */
export interface BusinessRule {
  id: string
  name: string
  description: string
  condition: RuleCondition
  action: RuleAction
  priority: number
  enabled: boolean
  metadata?: RuleMetadata
}

/**
 * Rule condition configuration
 */
export interface RuleCondition {
  field: string
  operator: ComparisonOperator
  value: any
  dataType: DataType
  logicalOperator?: LogicalOperator
  nestedConditions?: RuleCondition[]
}

/**
 * Rule action configuration
 */
export interface RuleAction {
  type: ActionType
  parameters: Record<string, any>
  outputField?: string
  errorHandling?: ErrorHandlingConfig
}

/**
 * Rule metadata
 */
export interface RuleMetadata {
  createdAt: Date
  updatedAt: Date
  version: string
  author: string
  testCases?: RuleTestCase[]
}

/**
 * Comparison operators for rule conditions
 */
export type ComparisonOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'regex_match'

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = 'AND' | 'OR' | 'NOT'

/**
 * Data types for rule conditions
 */
export type DataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'

/**
 * Action types for rule actions
 */
export type ActionType = 
  | 'set_value'
  | 'calculate'
  | 'validate'
  | 'transform'
  | 'call_service'
  | 'send_notification'
  | 'log_event'
  | 'stop_execution'

// ============================================================================
// Data Source Types
// ============================================================================

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  id: string
  name: string
  type: DataSourceType
  endpoint: string
  authentication?: AuthenticationConfig
  timeout: number
  retryPolicy?: RetryPolicy
  caching?: CachingConfig
  fieldMapping?: FieldMapping[]
  validation?: DataValidationConfig
}

/**
 * Supported data source types
 */
export type DataSourceType = 
  | 'credit_bureau'
  | 'income_verification'
  | 'fraud_detection'
  | 'bank_verification'
  | 'kyc_provider'
  | 'document_verification'
  | 'identity_verification'
  | 'custom_api'

/**
 * Authentication configuration for data sources
 */
export interface AuthenticationConfig {
  type: AuthenticationType
  credentials: Record<string, string>
  headers?: Record<string, string>
}

/**
 * Authentication types
 */
export type AuthenticationType = 
  | 'api_key'
  | 'bearer_token'
  | 'basic_auth'
  | 'oauth2'
  | 'custom'

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number
  backoffStrategy: BackoffStrategy
  retryableErrors?: string[]
}

/**
 * Backoff strategies for retries
 */
export type BackoffStrategy = 
  | 'fixed'
  | 'exponential'
  | 'linear'

/**
 * Caching configuration
 */
export interface CachingConfig {
  enabled: boolean
  ttl: number // Time to live in milliseconds
  strategy: CacheStrategy
}

/**
 * Cache strategies
 */
export type CacheStrategy = 
  | 'memory'
  | 'redis'
  | 'database'

/**
 * Field mapping for data transformation
 */
export interface FieldMapping {
  sourceField: string
  targetField: string
  transformation?: TransformationConfig
}

/**
 * Data transformation configuration
 */
export interface TransformationConfig {
  type: TransformationType
  parameters?: Record<string, any>
}

/**
 * Transformation types
 */
export type TransformationType = 
  | 'format'
  | 'calculate'
  | 'lookup'
  | 'conditional'
  | 'aggregate'

// ============================================================================
// Workflow Definition Types
// ============================================================================

/**
 * Complete workflow definition
 */
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  status: WorkflowStatus
  nodes: BaseWorkflowNode[]
  connections: WorkflowConnection[]
  dataRequirements: DataRequirements
  businessRules: BusinessRule[]
  configuration: WorkflowConfiguration
  metadata: WorkflowMetadata
}

/**
 * Workflow status
 */
export type WorkflowStatus = 
  | 'draft'
  | 'active'
  | 'inactive'
  | 'deprecated'
  | 'archived'

/**
 * Data requirements for workflow execution
 */
export interface DataRequirements {
  required: string[]
  optional: string[]
  external: DataSourceConfig[]
  computed: ComputedField[]
}

/**
 * Computed field definition
 */
export interface ComputedField {
  name: string
  expression: string
  dataType: DataType
  dependencies: string[]
}

/**
 * Workflow configuration
 */
export interface WorkflowConfiguration {
  timeout: number
  maxRetries: number
  errorHandling: ErrorHandlingConfig
  logging: LoggingConfig
  notifications: NotificationConfig[]
  performance: PerformanceConfig
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  strategy: ErrorHandlingStrategy
  fallbackAction?: string
  notifyOnError: boolean
  logErrors: boolean
}

/**
 * Error handling strategies
 */
export type ErrorHandlingStrategy = 
  | 'fail_fast'
  | 'continue_on_error'
  | 'retry_with_fallback'
  | 'manual_intervention'

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: LogLevel
  includePayload: boolean
  includeTimings: boolean
  destinations: LogDestination[]
}

/**
 * Log levels
 */
export type LogLevel = 
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'

/**
 * Log destinations
 */
export type LogDestination = 
  | 'console'
  | 'file'
  | 'database'
  | 'external_service'

/**
 * Notification configuration
 */
export interface NotificationConfig {
  type: NotificationType
  recipients: string[]
  template: string
  conditions: NotificationCondition[]
}

/**
 * Notification types
 */
export type NotificationType = 
  | 'email'
  | 'sms'
  | 'webhook'
  | 'slack'
  | 'teams'

/**
 * Notification conditions
 */
export interface NotificationCondition {
  event: WorkflowEvent
  condition?: string
}

/**
 * Workflow events
 */
export type WorkflowEvent = 
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'node_executed'
  | 'rule_triggered'
  | 'data_source_called'
  | 'validation_failed'

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  enableProfiling: boolean
  maxExecutionTime: number
  memoryLimit: number
  concurrentExecutions: number
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  tags: string[]
  category: string
  priority: WorkflowPriority
  estimatedExecutionTime: number
  dependencies: string[]
}

/**
 * Workflow priority levels
 */
export type WorkflowPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

// ============================================================================
// Execution Types
// ============================================================================

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  executionId: string
  workflowId: string
  inputData: Record<string, any>
  currentNode?: string
  executionState: ExecutionState
  startTime: Date
  endTime?: Date
  results: ExecutionResults
  errors: ExecutionError[]
  metrics: ExecutionMetrics
}

/**
 * Execution state
 */
export type ExecutionState = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'

/**
 * Execution results
 */
export interface ExecutionResults {
  decision?: DecisionResult
  outputData: Record<string, any>
  nodeResults: Record<string, NodeExecutionResult>
  dataSourceResults: Record<string, DataSourceResult>
}

/**
 * Decision result
 */
export interface DecisionResult {
  decision: DecisionType
  confidence: number
  reasons: string[]
  riskLevel: RiskLevel
  recommendedActions?: string[]
  metadata?: Record<string, any>
}

/**
 * Decision types
 */
export type DecisionType = 
  | 'approved'
  | 'declined'
  | 'manual_review'
  | 'pending_information'
  | 'conditional_approval'

/**
 * Risk levels
 */
export type RiskLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  nodeId: string
  status: ExecutionState
  startTime: Date
  endTime?: Date
  inputData: Record<string, any>
  outputData: Record<string, any>
  errors?: ExecutionError[]
  metrics?: NodeExecutionMetrics
}

/**
 * Data source result
 */
export interface DataSourceResult {
  dataSourceId: string
  success: boolean
  data?: any
  error?: string
  timestamp: Date
  responseTime: number
  cacheHit: boolean
}

/**
 * Execution error
 */
export interface ExecutionError {
  id: string
  type: ErrorType
  message: string
  nodeId?: string
  timestamp: Date
  stack?: string
  context?: Record<string, any>
}

/**
 * Error types
 */
export type ErrorType = 
  | 'validation_error'
  | 'business_rule_error'
  | 'data_source_error'
  | 'timeout_error'
  | 'configuration_error'
  | 'system_error'

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  totalExecutionTime: number
  nodeExecutionTimes: Record<string, number>
  dataSourceResponseTimes: Record<string, number>
  memoryUsage: number
  cpuUsage: number
}

/**
 * Node execution metrics
 */
export interface NodeExecutionMetrics {
  executionTime: number
  memoryUsage: number
  cacheHits: number
  cacheMisses: number
}

// ============================================================================
// Testing Types
// ============================================================================

/**
 * Test case definition
 */
export interface TestCase {
  id: string
  name: string
  description: string
  inputData: Record<string, any>
  expectedOutput: ExpectedOutput
  tags: string[]
  metadata: TestCaseMetadata
}

/**
 * Expected test output
 */
export interface ExpectedOutput {
  decision?: DecisionType
  outputData?: Record<string, any>
  errors?: ExpectedError[]
  executionTime?: number
}

/**
 * Expected error for testing
 */
export interface ExpectedError {
  type: ErrorType
  message?: string
  nodeId?: string
}

/**
 * Test case metadata
 */
export interface TestCaseMetadata {
  createdAt: Date
  updatedAt: Date
  createdBy: string
  category: string
  priority: TestPriority
}

/**
 * Test priority levels
 */
export type TestPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

/**
 * Test execution result
 */
export interface TestExecutionResult {
  testCaseId: string
  status: TestStatus
  executionTime: number
  actualOutput: ExecutionResults
  expectedOutput: ExpectedOutput
  differences: TestDifference[]
  errors: ExecutionError[]
}

/**
 * Test status
 */
export type TestStatus = 
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'error'

/**
 * Test difference
 */
export interface TestDifference {
  field: string
  expected: any
  actual: any
  type: DifferenceType
}

/**
 * Difference types
 */
export type DifferenceType = 
  | 'value_mismatch'
  | 'type_mismatch'
  | 'missing_field'
  | 'extra_field'

/**
 * Rule test case
 */
export interface RuleTestCase {
  id: string
  ruleId: string
  inputData: Record<string, any>
  expectedResult: boolean
  description: string
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Condition configuration
 */
export interface ConditionConfig {
  id: string
  expression: string
  description: string
  variables: VariableDefinition[]
}

/**
 * Variable definition
 */
export interface VariableDefinition {
  name: string
  dataType: DataType
  required: boolean
  defaultValue?: any
  validation?: ValidationRule[]
}

/**
 * Business logic configuration
 */
export interface BusinessLogicConfig {
  functionName: string
  parameters: Record<string, any>
  returnType: DataType
  description: string
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  rules: ValidationRule[]
  onFailure: ValidationFailureAction
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string
  type: ValidationType
  parameters?: Record<string, any>
  message: string
}

/**
 * Validation types
 */
export type ValidationType = 
  | 'required'
  | 'min_length'
  | 'max_length'
  | 'pattern'
  | 'range'
  | 'custom'

/**
 * Validation failure actions
 */
export type ValidationFailureAction = 
  | 'stop_execution'
  | 'continue_with_warning'
  | 'use_default_value'
  | 'request_manual_input'

/**
 * Data validation configuration
 */
export interface DataValidationConfig {
  schema: ValidationSchema
  strictMode: boolean
  allowAdditionalFields: boolean
}

/**
 * Validation schema
 */
export interface ValidationSchema {
  fields: Record<string, FieldValidation>
  required: string[]
}

/**
 * Field validation
 */
export interface FieldValidation {
  type: DataType
  rules: ValidationRule[]
  nullable: boolean
}

/**
 * Workflow validation result
 */
export interface WorkflowValidationResult {
  isValid: boolean
  errors: WorkflowValidationError[]
  warnings: WorkflowValidationWarning[]
  nodeId?: string
  connectionId?: string
}

/**
 * Workflow validation error
 */
export interface WorkflowValidationError {
  code: string
  message: string
  nodeId?: string
  connectionId?: string
  severity: "error" | "warning"
  field?: string
}

/**
 * Workflow validation warning
 */
export interface WorkflowValidationWarning {
  code: string
  message: string
  nodeId?: string
  connectionId?: string
  suggestion?: string
  field?: string
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Zod schema for position validation
 */
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number()
})

/**
 * Zod schema for workflow node validation
 */
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['start', 'condition', 'action', 'end', 'data_source', 'rule_set', 'decision', 'validation', 'task', 'loop', 'delay', 'error', 'data', 'transform', 'api', 'email', 'webhook', 'file', 'integration', 'notification', 'ai_decision', 'batch_process', 'audit_log']),
  position: PositionSchema,
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
    config: z.record(z.any()).optional(),
    rules: z.array(z.any()).optional(),
    dataSource: z.any().optional(),
    conditions: z.array(z.any()).optional(),
    businessLogic: z.any().optional(),
    validation: z.any().optional()
  }),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    version: z.string(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional()
  }).optional()
})

/**
 * Zod schema for workflow connection validation
 */
export const WorkflowConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  condition: z.string().optional(),
  metadata: z.object({
    createdAt: z.date(),
    priority: z.number().optional(),
    description: z.string().optional()
  }).optional()
})

/**
 * Zod schema for workflow definition validation
 */
export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  status: z.enum(['draft', 'active', 'inactive', 'deprecated', 'archived']),
  nodes: z.array(WorkflowNodeSchema),
  connections: z.array(WorkflowConnectionSchema),
  dataRequirements: z.object({
    required: z.array(z.string()),
    optional: z.array(z.string()),
    external: z.array(z.any()),
    computed: z.array(z.any())
  }),
  businessRules: z.array(z.any()),
  configuration: z.any(),
  metadata: z.any()
})

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for workflow nodes
 */
export function isWorkflowNode(obj: any): obj is BaseWorkflowNode {
  return WorkflowNodeSchema.safeParse(obj).success
}

/**
 * Type guard for workflow connections
 */
export function isWorkflowConnection(obj: any): obj is WorkflowConnection {
  return WorkflowConnectionSchema.safeParse(obj).success
}

/**
 * Type guard for workflow definitions
 */
export function isWorkflowDefinition(obj: any): obj is WorkflowDefinition {
  return WorkflowDefinitionSchema.safeParse(obj).success
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Partial workflow for creation/updates
 */
export type PartialWorkflow = Partial<WorkflowDefinition>

/**
 * Node creation data
 */
export type CreateNodeData = Omit<BaseWorkflowNode, 'id' | 'metadata'>

/**
 * Connection creation data
 */
export type CreateConnectionData = Omit<WorkflowConnection, 'id' | 'metadata'>

/**
 * Workflow update data
 */
export type UpdateWorkflowData = Partial<Omit<WorkflowDefinition, 'id' | 'metadata'>>