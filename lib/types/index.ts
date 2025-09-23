/**
 * Centralized Type Exports - Single Source of Truth
 * 
 * This file serves as the main entry point for all type definitions
 * to eliminate conflicts and provide consistent imports across the codebase.
 */

// Core workflow types from unified-workflow.ts (primary source)
export type {
  WorkflowNode,
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNodeType,
  WorkflowMode,
  WorkflowStatus,
  WorkflowMetadata,
  DataRequirements,
  Position,
  WorkflowNodeData,
  WorkflowNodeMetadata,
  ConnectionType,
  ConnectionMetadata,
  ValidationConfig,
  ValidationRule,
  WorkflowConfiguration,
  WorkflowFeatures,
  WorkflowPermissions,
  ExecutionContext,
  ExecutionResult,
  NodeExecutionResult,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  WorkflowState,
  WorkflowActions,
  IWorkflowService,
  WorkflowEvent,
  NodeEvent,
  ConnectionEvent
} from './unified-workflow'

// Rule-related types from workflow.ts (including complete BusinessRule interface)
export type {
  BusinessRule,
  RuleCondition,
  RuleAction,
  ComparisonOperator,
  LogicalOperator,
  DataType,
  ActionType
} from './workflow'

// Application types
export type {
  Application,
  ApplicationFilters,
  ManualApplicationData,
  ApplicationStatus
} from './application'

// Legacy compatibility exports (marked for deprecation)
export type {
  BaseWorkflowDefinition,
  EnhancedWorkflowDefinition,
  FullWorkflowDefinition,
  DataSourceConfig,
  EnhancedDataRequirements,
  ComputedField
} from './workflow-definitions'

// Utility functions
export {
  createDefaultWorkflow,
  getAvailableNodeTypes,
  isStartNode,
  isEndNode,
  hasRules
} from './unified-workflow'

export {
  isEnhancedWorkflowDefinition,
  isFullWorkflowDefinition,
  convertExternalSourcesToIds,
  createDataRequirements
} from './workflow-definitions'

// Constants
export { WORKFLOWS, ASSIGNEES, PRIORITIES } from './application'