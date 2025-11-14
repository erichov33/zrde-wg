import type { WorkflowConnection, WorkflowNode } from '@/lib/types/unified-workflow'

/**
 * Type guards and utilities for workflow type safety
 */

export function isValidWorkflowConnection(obj: any): obj is WorkflowConnection {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.target === 'string' &&
    (obj.type === undefined || typeof obj.type === 'string') &&
    (obj.label === undefined || typeof obj.label === 'string') &&
    (obj.condition === undefined || typeof obj.condition === 'string') &&
    (obj.conditions === undefined || typeof obj.conditions === 'object' || typeof obj.conditions === 'string')
  )
}

export function isValidWorkflowNode(obj: any): obj is WorkflowNode {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    obj.position &&
    typeof obj.position.x === 'number' &&
    typeof obj.position.y === 'number' &&
    obj.data &&
    typeof obj.data === 'object' &&
    typeof obj.data.label === 'string'
  )
}

export function hasConditions(connection: WorkflowConnection): boolean {
  return !!(
    (connection.conditions && Object.keys(connection.conditions).length > 0) ||
    (connection.condition && connection.condition.trim() !== '')
  )
}

export function getConnectionLabel(connection: WorkflowConnection): string {
  return connection.label || connection.condition || 'Connection'
}

export function isLegacyConnection(connection: any): boolean {
  return !!(connection.condition && !connection.conditions)
}

export function isUnifiedConnection(connection: any): boolean {
  return !!(connection.conditions !== undefined)
}