/**
 * Workflow Validation Hook
 * 
 * Extracts validation logic from UI components to improve separation of concerns
 * and provide reusable validation functionality across the application.
 */

import { useCallback, useMemo } from 'react'
import type { WorkflowNode, WorkflowConnection, ValidationResult, ValidationError } from '@/lib/types'

export interface UseWorkflowValidationProps {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
}

export interface WorkflowValidationHook {
  validateWorkflow: () => Promise<ValidationResult>
  validateNodes: () => ValidationError[]
  validateConnections: () => ValidationError[]
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export function useWorkflowValidation({ 
  nodes, 
  connections 
}: UseWorkflowValidationProps): WorkflowValidationHook {
  
  const validateNodes = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    
    // Check for required start node
    const startNodes = nodes.filter(node => node.type === 'start')
    if (startNodes.length === 0) {
      errors.push({
        code: 'NO_START_NODE',
        message: 'Workflow must have at least one start node',
        severity: 'error'
      })
    } else if (startNodes.length > 1) {
      errors.push({
        code: 'MULTIPLE_START_NODES',
        message: 'Workflow should have only one start node',
        severity: 'warning'
      })
    }
    
    // Check for end nodes
    const endNodes = nodes.filter(node => node.type === 'end')
    if (endNodes.length === 0) {
      errors.push({
        code: 'NO_END_NODE',
        message: 'Workflow should have at least one end node',
        severity: 'warning'
      })
    }
    
    // Validate individual nodes
    nodes.forEach(node => {
      if (!node.id || node.id.trim() === '') {
        errors.push({
          code: 'INVALID_NODE_ID',
          message: `Node must have a valid ID`,
          nodeId: node.id,
          severity: 'error'
        })
      }
      
      if (!node.data?.label || node.data.label.trim() === '') {
        errors.push({
          code: 'MISSING_NODE_LABEL',
          message: `Node ${node.id} must have a label`,
          nodeId: node.id,
          severity: 'error'
        })
      }
      
      // Type-specific validations
      if (node.type === 'condition' && (!node.data.conditions || node.data.conditions.length === 0)) {
        errors.push({
          code: 'MISSING_CONDITIONS',
          message: `Condition node ${node.id} must have at least one condition`,
          nodeId: node.id,
          severity: 'error'
        })
      }
      
      if (node.type === 'rule_set' && (!node.data.rules || node.data.rules.length === 0)) {
        errors.push({
          code: 'MISSING_RULES',
          message: `Rule set node ${node.id} must have at least one rule`,
          nodeId: node.id,
          severity: 'error'
        })
      }
    })
    
    return errors
  }, [nodes])
  
  const validateConnections = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    const nodeIds = new Set(nodes.map(n => n.id))
    
    connections.forEach(connection => {
      // Validate source and target nodes exist
      if (!nodeIds.has(connection.source)) {
        errors.push({
          code: 'INVALID_SOURCE_NODE',
          message: `Connection references non-existent source node: ${connection.source}`,
          connectionId: connection.id,
          severity: 'error'
        })
      }
      
      if (!nodeIds.has(connection.target)) {
        errors.push({
          code: 'INVALID_TARGET_NODE',
          message: `Connection references non-existent target node: ${connection.target}`,
          connectionId: connection.id,
          severity: 'error'
        })
      }
      
      // Check for self-connections
      if (connection.source === connection.target) {
        errors.push({
          code: 'SELF_CONNECTION',
          message: `Connection ${connection.id} connects node to itself`,
          connectionId: connection.id,
          severity: 'warning'
        })
      }
    })
    
    // Check for orphaned nodes
    const connectedNodes = new Set([
      ...connections.map(c => c.source),
      ...connections.map(c => c.target)
    ])
    
    nodes.forEach(node => {
      if (node.type !== 'start' && !connectedNodes.has(node.id)) {
        errors.push({
          code: 'ORPHANED_NODE',
          message: `Node ${node.id} is not connected to any other nodes`,
          nodeId: node.id,
          severity: 'warning'
        })
      }
    })
    
    return errors
  }, [nodes, connections])
  
  const validateWorkflow = useCallback(async (): Promise<ValidationResult> => {
    const nodeErrors = validateNodes()
    const connectionErrors = validateConnections()
    
    const allErrors = [...nodeErrors, ...connectionErrors]
    const errors = allErrors.filter(e => e.severity === 'error')
    const warnings = allErrors.filter(e => e.severity === 'warning')
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }, [validateNodes, validateConnections])
  
  const { isValid, errors, warnings } = useMemo(() => {
    const nodeErrors = validateNodes()
    const connectionErrors = validateConnections()
    
    const allErrors = [...nodeErrors, ...connectionErrors]
    const errors = allErrors.filter(e => e.severity === 'error')
    const warnings = allErrors.filter(e => e.severity === 'warning')
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }, [validateNodes, validateConnections])
  
  return {
    validateWorkflow,
    validateNodes,
    validateConnections,
    isValid,
    errors,
    warnings
  }
}