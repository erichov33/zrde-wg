// Re-export all utility functions for easy access
export * from './workflow-migration'
export * from './workflow-type-guards'
export * from './workflow-testing'

// Ensure backward compatibility
export { migrateToUnifiedWorkflow as migrateWorkflow } from './workflow-migration'
export { getConnectionCondition, setConnectionCondition } from './workflow-migration'
export { hasConditions, isValidWorkflowConnection } from './workflow-type-guards'