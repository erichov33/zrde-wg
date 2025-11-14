/**
 * Main Library Barrel Export
 * 
 * Provides standardized imports for the entire library to improve
 * code organization and reduce import complexity.
 */

// Core types - export specific types to avoid conflicts
export type { 
  WorkflowConfig, 
  WorkflowNode, 
  WorkflowConnection,
  ExecutionContext
} from './types/unified-workflow'
export type { 
  ExecutableNode,
  WorkflowExecutionResult,
  WorkflowExecutionContext
} from './types/execution-contracts'

// Services
export { serviceRegistry, ServiceRegistry } from './services/ServiceRegistry'
export { UnifiedWorkflowService } from './services/unified-workflow-service'
export { WorkflowBusinessLogicService } from './services/workflow-business-logic-service'
export { EnhancedDecisionService } from './services/enhanced-decision-service'

// Hooks
export { useWorkflowValidation } from './hooks/useWorkflowValidation'
export { useUnifiedWorkflow } from './hooks/useUnifiedWorkflow'
export { useWorkflowCanvas } from './hooks/useWorkflowCanvas'
export { useWorkflowState } from './hooks/useWorkflowState'
export { useWorkflowTemplates } from './hooks/useWorkflowTemplates'

// Utilities
export * from './utils'
export type { WorkflowValidator } from './validators/WorkflowValidator'

// Engines
export { RuleEngine } from './engines/rule-engine'
export * from './engines/workflow-execution-engine'
export * from './engines/node-executor-factory'
export * from './engines/async-operation-registry'

// Contexts
export { AuthProvider, useAuth } from './contexts/auth-context'
export { ApplicationsProvider, useApplications } from './contexts/applications-context'

// Configuration
export type { 
  ConfigurableRule, 
  RuleSet, 
  WorkflowConfiguration as WorkflowConfigurationSettings
} from './config/workflow-config'
export { 
  WorkflowConfigurationManager
} from './config/workflow-config'
export * from './config/business-rules'
export * from './config/env'