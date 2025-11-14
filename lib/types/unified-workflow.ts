/**
 * Unified Workflow Type System
 * 
 * This file provides the single source of truth for all workflow types
 * across the entire application to eliminate type conflicts and duplications.
 */

import { RuleSet, Rule } from "../engines/rule-engine"

// ============================================================================
// CORE WORKFLOW TYPES - SINGLE SOURCE OF TRUTH
// ============================================================================

/**
 * Unified workflow node interface - replaces all other WorkflowNode definitions
 */
export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  position: Position
  data: WorkflowNodeData
  metadata?: WorkflowNodeMetadata
}

/**
 * All supported node types across all workflow modes
 */
export type WorkflowNodeType = 
  | "start" 
  | "condition" 
  | "action" 
  | "end" 
  | "data_source" 
  | "rule_set" 
  | "decision"
  | "validation"
  | "integration"
  | "notification"
  | "ai_decision"
  | "batch_process"
  | "audit_log"

/**
 * Position interface
 */
export interface Position {
  x: number
  y: number
}

/**
 * Comprehensive node data interface
 */
export interface WorkflowNodeData {
  label: string
  description?: string
  config?: Record<string, any>
  rules?: Rule[]
  dataSource?: string
  conditions?: any[]
  businessLogic?: string
  validation?: ValidationConfig
  [key: string]: any // Allow for extensibility
}

/**
 * Node metadata for tracking and versioning/**
 * Workflow node metadata
 */
export interface WorkflowNodeMetadata {
  createdAt?: string
  updatedAt?: string
  version?: string
  author?: string
  tags?: string[]
}

/**
 * Connection types for workflow connections
 */
export type ConnectionType = "success" | "failure" | "conditional" | "default"

/**
 * Workflow connection definition
 */
export interface WorkflowConnection { id: string
  source: string
  target: string
  type?: ConnectionType
  label?: string
  condition?: string
  conditions?: Record<string, string> | string
  metadata?: ConnectionMetadata
}

/**
 * Connection metadata
 */
export interface ConnectionMetadata {
  createdAt?: string
  priority?: number
  description?: string
}

/**
 * Unified workflow definition - replaces all other workflow definition types
 */
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  dataRequirements: DataRequirements
  metadata: WorkflowMetadata
  status: WorkflowStatus
}

/**
 * Data requirements interface
 */
export interface DataRequirements {
  required: string[]
  optional: string[]
  external: string[]
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  createdAt: string
  updatedAt: string
  createdBy: string
  version?: string
  tags?: string[]
  category?: string
}

/**
 * Workflow status
 */
export type WorkflowStatus = "draft" | "active" | "inactive" | "deprecated" | "archived"

/**
 * Validation configuration
 */
export interface ValidationConfig {
  required?: boolean
  rules?: ValidationRule[]
}

/**
 * Validation rule
 */
export interface ValidationRule {
  type: string
  message: string
  parameters?: Record<string, any>
}

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

/**
 * Business rule interface
 */
export interface BusinessRule {
  id: string
  name: string
  condition: string
  action: string
  priority: number
  enabled: boolean
}

/**
 * Workflow configuration for different modes
 */
export interface WorkflowConfiguration {
  mode: WorkflowMode
  features: WorkflowFeatures
  permissions: WorkflowPermissions
}

/**
 * Workflow modes
 */
export type WorkflowMode = "simple" | "enhanced" | "enterprise"

/**
 * Workflow features configuration
 */
export interface WorkflowFeatures {
  dataSourceIntegration: boolean
  businessRules: boolean
  advancedValidation: boolean
  versionControl: boolean
  collaboration: boolean
}

/**
 * Workflow permissions
 */
export interface WorkflowPermissions {
  canEdit: boolean
  canDelete: boolean
  canExecute: boolean
  canShare: boolean
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

/**
 * Workflow execution context
 */
export interface ExecutionContext {
  workflowId: string
  executionId: string
  data: Record<string, any>
  timestamp: string
  userId?: string
}

/**
 * Execution result
 */
export interface ExecutionResult {
  success: boolean
  result?: any
  error?: string
  executionTime: number
  nodeResults: NodeExecutionResult[]
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  nodeId: string
  success: boolean
  result?: any
  error?: string
  executionTime: number
  timestamp: string
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string
  message: string
  nodeId?: string
  connectionId?: string
  severity: "error" | "warning"
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string
  message: string
  nodeId?: string
  connectionId?: string
  suggestion?: string
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if a node is a start node
 */
export function isStartNode(node: WorkflowNode): boolean {
  return node.type === "start"
}

/**
 * Type guard to check if a node is an end node
 */
export function isEndNode(node: WorkflowNode): boolean {
  return node.type === "end"
}

/**
 * Type guard to check if a node has rules
 */
export function hasRules(node: WorkflowNode): boolean {
  return node.type === "condition" || node.type === "rule_set"
}

/**
 * Get available node types for a specific workflow mode
 */
export function getAvailableNodeTypes(mode: WorkflowMode): WorkflowNodeType[] {
  const baseTypes: WorkflowNodeType[] = ["start", "condition", "action", "end"]
  const enhancedTypes: WorkflowNodeType[] = ["data_source", "rule_set", "validation"]
  const enterpriseTypes: WorkflowNodeType[] = ["decision", "integration", "notification", "ai_decision", "batch_process", "audit_log"]

  switch (mode) {
    case "enhanced":
      return [...baseTypes, ...enhancedTypes]
    case "enterprise":
      return [...baseTypes, ...enhancedTypes, ...enterpriseTypes]
    default:
      return baseTypes
  }
}

/**
 * Create a default workflow definition
 */
export function createDefaultWorkflow(name: string, mode: WorkflowMode = "simple"): WorkflowDefinition {
  return {
    id: `workflow-${Date.now()}`,
    name,
    description: "",
    version: "1.0.0",
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 100 },
        data: { label: "Start" }
      }
    ],
    connections: [],
    dataRequirements: {
      required: [],
      optional: [],
      external: []
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system"
    },
    status: "draft"
  }
}

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

/**
 * Legacy types for backward compatibility - will be deprecated
 */
export type NodeType = WorkflowNodeType
export interface NodeData extends WorkflowNodeData {}
export interface WorkflowConfig extends WorkflowDefinition {
  mode: WorkflowMode
  settings: {
    autoSave: boolean
    validation: boolean
    execution: {
      timeout: number
      retries: number
    }
  }
}

// State management types
export interface WorkflowState {
  workflow: WorkflowConfig | null
  selectedNode: WorkflowNode | null
  connectionPreview: {
    startNodeId: string
    currentPosition: Position
  } | null
  isLoading: boolean
  error: string | null
  isDirty: boolean
}

export interface WorkflowActions {
  // Workflow operations
  loadWorkflow: (id: string) => Promise<void>
  saveWorkflow: (workflow?: WorkflowConfig) => Promise<void>
  updateWorkflow: (updates: Partial<WorkflowConfig>) => void
  
  // Node operations
  addNode: (type: WorkflowNodeType, position: Position) => void
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void
  deleteNode: (nodeId: string) => void
  moveNode: (nodeId: string, position: Position) => void
  selectNode: (nodeId: string | null) => void
  
  // Connection operations
  createConnection: (source: string, target: string, type?: ConnectionType) => void
  deleteConnection: (connectionId: string) => void
  startConnection: (nodeId: string, position: Position) => void
  endConnection: (nodeId?: string) => void
  updateConnectionPreview: (position: Position) => void
  
  // Utility operations
  clearError: () => void
  resetWorkflow: () => void
}

// Service interfaces
export interface IWorkflowService {
  getWorkflow(id: string): Promise<WorkflowConfig>
  saveWorkflow(workflow: WorkflowDefinition): Promise<WorkflowConfig>
  deleteWorkflow(id: string): Promise<void>
  executeWorkflow(id: string): Promise<any>
  validateWorkflow(workflow: WorkflowConfig): Promise<ValidationResult>
}

// Event types
export interface WorkflowEvent {
  type: string
  payload: any
  timestamp: Date
}

export interface NodeEvent extends WorkflowEvent {
  nodeId: string
}

export interface ConnectionEvent extends WorkflowEvent {
  connectionId: string
}