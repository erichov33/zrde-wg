/**
 * Workflow Service Layer Interfaces
 * 
 * Comprehensive interfaces for the workflow system that provide proper
 * abstractions and type safety across all workflow-related services.
 */

// Core workflow entities
export interface IWorkflowNode {
  id: string
  type: WorkflowNodeType
  position: Position
  data: WorkflowNodeData
}

export interface IWorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
  data?: Record<string, any>
}

export interface IWorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  nodes: IWorkflowNode[]
  connections: IWorkflowConnection[]
  dataRequirements?: DataRequirements
  metadata?: WorkflowMetadata
}

// Supporting types
export type WorkflowNodeType = "start" | "decision" | "action" | "end" | "data_source" | "rule_set"

export interface Position {
  x: number
  y: number
}

export interface WorkflowNodeData {
  label: string
  description?: string
  config?: Record<string, any>
  rules?: BusinessRule[]
  dataSource?: string
  conditions?: Condition[]
  businessLogic?: string
  [key: string]: any
}

export interface DataRequirements {
  required: string[]
  optional: string[]
  external: string[]
}

export interface WorkflowMetadata {
  created: string
  updated: string
  author: string
  tags: string[]
  version?: string
}

export interface BusinessRule {
  id: string
  name: string
  condition: string
  action: string
  priority: number
  enabled: boolean
}

export interface Condition {
  field: string
  operator: string
  value: any
  type: string
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  nodeId?: string
  connectionId?: string
  severity: "error" | "warning"
}

export interface ValidationWarning {
  code: string
  message: string
  nodeId?: string
  connectionId?: string
  suggestion?: string
}

// Execution interfaces
export interface ExecutionContext {
  workflowId: string
  executionId: string
  data: Record<string, any>
  timestamp: string
  userId?: string
}

export interface ExecutionResult {
  success: boolean
  result?: any
  error?: string
  executionTime: number
  nodeResults: NodeExecutionResult[]
}

export interface NodeExecutionResult {
  nodeId: string
  success: boolean
  result?: any
  error?: string
  executionTime: number
  timestamp: string
}

// Service interfaces
export interface IWorkflowService {
  // Workflow CRUD operations
  createWorkflow(workflow: Omit<IWorkflowDefinition, 'id'>): Promise<IWorkflowDefinition>
  getWorkflow(id: string): Promise<IWorkflowDefinition | null>
  updateWorkflow(id: string, updates: Partial<IWorkflowDefinition>): Promise<IWorkflowDefinition>
  deleteWorkflow(id: string): Promise<boolean>
  listWorkflows(filters?: WorkflowFilters): Promise<IWorkflowDefinition[]>
  
  // Workflow operations
  validateWorkflow(workflow: IWorkflowDefinition): Promise<ValidationResult>
  executeWorkflow(workflowId: string, context: ExecutionContext): Promise<ExecutionResult>
  testWorkflow(workflow: IWorkflowDefinition, testData: Record<string, any>): Promise<ExecutionResult>
  
  // Template operations
  getTemplates(): Promise<IWorkflowTemplate[]>
  createFromTemplate(templateId: string, customizations?: Record<string, any>): Promise<IWorkflowDefinition>
}

export interface IBusinessLogicService {
  // Business logic operations
  getBusinessLogicTemplates(): IBusinessLogicTemplate[]
  executeBusinessLogic(templateId: string, data: Record<string, any>): Promise<any>
  validateBusinessLogic(templateId: string, data: Record<string, any>): ValidationResult
  
  // Rule operations
  getRules(category?: string): BusinessRule[]
  evaluateRule(rule: BusinessRule, data: Record<string, any>): boolean
  createRule(rule: Omit<BusinessRule, 'id'>): BusinessRule
  updateRule(id: string, updates: Partial<BusinessRule>): BusinessRule
  deleteRule(id: string): boolean
}

export interface IConfigurationService {
  // Configuration management
  getConfiguration(id: string): IWorkflowConfiguration | null
  getAllConfigurations(): IWorkflowConfiguration[]
  createConfiguration(config: Omit<IWorkflowConfiguration, 'id'>): IWorkflowConfiguration
  updateConfiguration(id: string, updates: Partial<IWorkflowConfiguration>): IWorkflowConfiguration
  deleteConfiguration(id: string): boolean
  
  // Rule set management
  getRuleSet(id: string): IRuleSet | null
  createRuleSet(ruleSet: Omit<IRuleSet, 'id'>): IRuleSet
  updateRuleSet(id: string, updates: Partial<IRuleSet>): IRuleSet
  deleteRuleSet(id: string): boolean
}

export interface IWorkflowExecutionService {
  // Execution management
  startExecution(workflowId: string, context: ExecutionContext): Promise<string>
  getExecutionStatus(executionId: string): Promise<ExecutionStatus>
  stopExecution(executionId: string): Promise<boolean>
  getExecutionHistory(workflowId: string, limit?: number): Promise<ExecutionHistory[]>
  
  // Node execution
  executeNode(nodeId: string, context: ExecutionContext): Promise<NodeExecutionResult>
  skipNode(nodeId: string, executionId: string): Promise<boolean>
  retryNode(nodeId: string, executionId: string): Promise<NodeExecutionResult>
}

export interface IDataSourceService {
  // Data source management
  getDataSources(): IDataSource[]
  getDataSource(id: string): IDataSource | null
  createDataSource(dataSource: Omit<IDataSource, 'id'>): IDataSource
  updateDataSource(id: string, updates: Partial<IDataSource>): IDataSource
  deleteDataSource(id: string): boolean
  
  // Data operations
  fetchData(dataSourceId: string, parameters?: Record<string, any>): Promise<any>
  validateConnection(dataSourceId: string): Promise<boolean>
  testQuery(dataSourceId: string, query: string): Promise<any>
}

// Template interfaces
export interface IWorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: IWorkflowNode[]
  connections: IWorkflowConnection[]
  metadata: TemplateMetadata
}

export interface IBusinessLogicTemplate {
  id: string
  name: string
  description: string
  category: string
  businessLogic: string
  requiredFields: string[]
  returnType: string
  metadata: TemplateMetadata
}

export interface TemplateMetadata {
  created: string
  updated: string
  author: string
  version: string
  tags: string[]
  complexity: "simple" | "medium" | "complex"
  usageCount?: number
}

// Configuration interfaces
export interface IWorkflowConfiguration {
  id: string
  name: string
  description: string
  version: string
  ruleSets: IRuleSet[]
  nodeConfigurations: Record<string, NodeConfiguration>
  metadata: ConfigurationMetadata
}

export interface IRuleSet {
  id: string
  name: string
  description: string
  rules: IConfigurableRule[]
  mode: RuleSetMode
  enabled: boolean
  priority: number
}

export interface IConfigurableRule {
  id: string
  name: string
  field: string
  operator: string
  value: any
  action: string
  category: string
  enabled: boolean
  priority: number
}

export interface NodeConfiguration {
  type: WorkflowNodeType
  defaultConfig: Record<string, any>
  validationRules: ValidationRule[]
  displayOptions: DisplayOptions
}

export interface ValidationRule {
  field: string
  type: "required" | "type" | "range" | "pattern"
  value?: any
  message: string
}

export interface DisplayOptions {
  icon?: string
  color?: string
  position?: Position
  size?: { width: number; height: number }
}

export type RuleSetMode = "all_must_pass" | "any_must_pass" | "majority_must_pass"

export interface ConfigurationMetadata {
  created: string
  updated: string
  author: string
  version: string
  tags: string[]
  environment: "development" | "staging" | "production"
}

// Execution status interfaces
export interface ExecutionStatus {
  executionId: string
  workflowId: string
  status: ExecutionState
  currentNodeId?: string
  progress: ExecutionProgress
  startTime: string
  endTime?: string
  error?: string
}

export interface ExecutionProgress {
  totalNodes: number
  completedNodes: number
  failedNodes: number
  skippedNodes: number
  percentage: number
}

export type ExecutionState = "pending" | "running" | "completed" | "failed" | "cancelled" | "paused"

export interface ExecutionHistory {
  executionId: string
  workflowId: string
  status: ExecutionState
  startTime: string
  endTime?: string
  duration?: number
  triggeredBy: string
  result?: any
  error?: string
}

// Data source interfaces
export interface IDataSource {
  id: string
  name: string
  description: string
  type: DataSourceType
  connectionConfig: ConnectionConfig
  schema?: DataSourceSchema
  metadata: DataSourceMetadata
}

export type DataSourceType = "database" | "api" | "file" | "webhook" | "queue" | "cache"

export interface ConnectionConfig {
  endpoint?: string
  authentication: AuthenticationConfig
  timeout: number
  retryPolicy: RetryPolicy
  headers?: Record<string, string>
  parameters?: Record<string, any>
}

export interface AuthenticationConfig {
  type: "none" | "api_key" | "oauth" | "basic" | "bearer"
  credentials?: Record<string, string>
}

export interface RetryPolicy {
  maxRetries: number
  backoffStrategy: "linear" | "exponential"
  baseDelay: number
  maxDelay: number
}

export interface DataSourceSchema {
  fields: SchemaField[]
  primaryKey?: string
  indexes?: string[]
}

export interface SchemaField {
  name: string
  type: "string" | "number" | "boolean" | "date" | "object" | "array"
  required: boolean
  description?: string
  validation?: FieldValidation
}

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  enum?: any[]
}

export interface DataSourceMetadata {
  created: string
  updated: string
  author: string
  version: string
  tags: string[]
  lastTested?: string
  status: "active" | "inactive" | "error"
}

// Filter interfaces
export interface WorkflowFilters {
  name?: string
  author?: string
  tags?: string[]
  dateRange?: DateRange
  status?: string[]
  category?: string
}

export interface DateRange {
  start: string
  end: string
}

// Event interfaces for workflow system
export interface WorkflowEvent {
  id: string
  type: WorkflowEventType
  workflowId: string
  executionId?: string
  nodeId?: string
  timestamp: string
  data: Record<string, any>
  userId?: string
}

export type WorkflowEventType = 
  | "workflow_created"
  | "workflow_updated" 
  | "workflow_deleted"
  | "execution_started"
  | "execution_completed"
  | "execution_failed"
  | "node_executed"
  | "node_failed"
  | "rule_evaluated"
  | "data_fetched"

// Error interfaces
export interface WorkflowError extends Error {
  code: string
  workflowId?: string
  nodeId?: string
  executionId?: string
  context?: Record<string, any>
}

export interface ServiceError extends Error {
  service: string
  operation: string
  code: string
  details?: Record<string, any>
}