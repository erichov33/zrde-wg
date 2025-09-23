/**
 * Workflow Migration Utilities
 * 
 * Utilities to migrate from old workflow builders to the new unified workflow system
 */

import type { 
  WorkflowConfig, 
  WorkflowNode, 
  WorkflowConnection, 
  NodeType,
  ConnectionType 
} from "@/lib/types/unified-workflow"

/**
 * Migration interface for legacy workflow data
 */
export interface LegacyWorkflowData {
  nodes: any[]
  connections: any[]
  name?: string
  description?: string
  version?: string
  [key: string]: any
}

/**
 * Migrate from any legacy workflow format to unified workflow system
 */
export function migrateToUnifiedWorkflow(
  legacyData: LegacyWorkflowData,
  sourceType: "unified" | "connected" | "enhanced" | "consolidated" | "generic" = "generic"
): WorkflowConfig {
  const now = new Date()
  
  // Migrate nodes
  const migratedNodes: WorkflowNode[] = legacyData.nodes.map(node => ({
    id: node.id || `node-${Date.now()}-${Math.random()}`,
    type: normalizeNodeType(node.type),
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.data?.label || node.label || `${node.type} Node`,
      description: node.data?.description || node.description,
      config: node.data?.config || node.config || {}
    },
    metadata: {
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: "1"
    }
  }))

  // Migrate connections
  const migratedConnections: WorkflowConnection[] = legacyData.connections.map(conn => ({
    id: conn.id || `conn-${Date.now()}-${Math.random()}`,
    source: conn.source,
    target: conn.target,
    type: normalizeConnectionType(conn.type || conn.label),
    label: conn.label,
    conditions: conn.condition ? { condition: conn.condition } : undefined
  }))

  // Create unified workflow config
  const unifiedWorkflow: WorkflowConfig = {
    id: `workflow-${Date.now()}`,
    name: legacyData.name || "Migrated Workflow",
    description: legacyData.description || "",
    version: legacyData.version || "1.0.0",
    mode: determineWorkflowMode(migratedNodes),
    nodes: migratedNodes,
    connections: migratedConnections,
    dataRequirements: {
      required: [],
      optional: [],
      external: []
    },
    status: "draft" as const,
    settings: {
      autoSave: true,
      validation: true,
      execution: {
        timeout: 30000,
        retries: 3
      }
    },
    metadata: {
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: "migration-tool",
      tags: ["migrated", sourceType]
    }
  }

  return unifiedWorkflow
}

/**
 * Normalize legacy node types to unified node types
 */
function normalizeNodeType(type: string): NodeType {
  const typeMap: Record<string, NodeType> = {
    "start": "start",
    "begin": "start",
    "initial": "start",
    "condition": "condition",
    "decision": "condition",
    "if": "condition",
    "rule": "condition",
    "action": "action",
    "task": "action",
    "process": "action",
    "end": "end",
    "finish": "end",
    "terminate": "end",
    "data_source": "data_source",
    "datasource": "data_source",
    "rule_set": "rule_set",
    "ruleset": "rule_set",
    "notification": "notification",
    "notify": "notification",
    "integration": "integration",
    "api": "integration",
    "ai_decision": "ai_decision",
    "ai": "ai_decision",
    "batch_process": "batch_process",
    "batch": "batch_process",
    "audit_log": "audit_log",
    "audit": "audit_log"
  }

  return typeMap[type.toLowerCase()] || "action"
}

/**
 * Normalize legacy connection types to unified connection types
 */
function normalizeConnectionType(type?: string): ConnectionType {
  if (!type) return "default"
  
  const typeMap: Record<string, ConnectionType> = {
    "success": "success",
    "approved": "success",
    "yes": "success",
    "true": "success",
    "failure": "failure",
    "declined": "failure",
    "no": "failure",
    "false": "failure",
    "error": "failure",
    "conditional": "conditional",
    "condition": "conditional",
    "if": "conditional",
    "default": "default",
    "next": "default",
    "continue": "default"
  }

  return typeMap[type.toLowerCase()] || "default"
}

/**
 * Determine workflow mode based on node types
 */
function determineWorkflowMode(nodes: WorkflowNode[]): "simple" | "enhanced" | "enterprise" {
  const nodeTypes = new Set(nodes.map(n => n.type))
  
  const enterpriseTypes = ["ai_decision", "batch_process", "audit_log"]
  const enhancedTypes = ["data_source", "rule_set", "notification", "integration"]
  
  if (enterpriseTypes.some(type => nodeTypes.has(type as NodeType))) {
    return "enterprise"
  }
  
  if (enhancedTypes.some(type => nodeTypes.has(type as NodeType))) {
    return "enhanced"
  }
  
  return "simple"
}

/**
 * Validate migrated workflow
 */
export function validateMigratedWorkflow(
  workflow: WorkflowConfig
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic validation
  if (!workflow.name?.trim()) {
    errors.push("Workflow name is required")
  }

  if (workflow.nodes.length === 0) {
    errors.push("Workflow must contain at least one node")
  }

  // Node validation
  const startNodes = workflow.nodes.filter(n => n.type === "start")
  if (startNodes.length === 0) {
    errors.push("Workflow must have a start node")
  } else if (startNodes.length > 1) {
    warnings.push("Multiple start nodes detected")
  }

  const endNodes = workflow.nodes.filter(n => n.type === "end")
  if (endNodes.length === 0) {
    warnings.push("Workflow should have at least one end node")
  }

  // Connection validation
  const nodeIds = new Set(workflow.nodes.map(n => n.id))
  for (const connection of workflow.connections) {
    if (!nodeIds.has(connection.source)) {
      errors.push(`Connection source node ${connection.source} not found`)
    }
    if (!nodeIds.has(connection.target)) {
      errors.push(`Connection target node ${connection.target} not found`)
    }
  }

  // Check for orphaned nodes
  const connectedNodeIds = new Set([
    ...workflow.connections.map(c => c.source),
    ...workflow.connections.map(c => c.target)
  ])

  for (const node of workflow.nodes) {
    if (node.type !== "start" && !connectedNodeIds.has(node.id)) {
      warnings.push(`Node ${node.data.label} is not connected`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Migration report interface
 */
export interface MigrationReport {
  success: boolean
  migratedWorkflow?: WorkflowConfig
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
  statistics: {
    originalNodes: number
    migratedNodes: number
    originalConnections: number
    migratedConnections: number
    dataLoss: string[]
  }
}

/**
 * Perform complete migration with validation and reporting
 */
export function performMigration(
  legacyData: LegacyWorkflowData,
  sourceType: "unified" | "connected" | "enhanced" | "consolidated" | "generic" = "generic"
): MigrationReport {
  try {
    // Perform migration
    const migratedWorkflow = migrateToUnifiedWorkflow(legacyData, sourceType)
    
    // Validate result
    const validation = validateMigratedWorkflow(migratedWorkflow)
    
    // Generate statistics
    const statistics = {
      originalNodes: legacyData.nodes?.length || 0,
      migratedNodes: migratedWorkflow.nodes.length,
      originalConnections: legacyData.connections?.length || 0,
      migratedConnections: migratedWorkflow.connections.length,
      dataLoss: [] // Could be enhanced to detect actual data loss
    }

    return {
      success: true,
      migratedWorkflow,
      validation,
      statistics
    }
  } catch (error) {
    return {
      success: false,
      validation: {
        isValid: false,
        errors: [error instanceof Error ? error.message : "Migration failed"],
        warnings: []
      },
      statistics: {
        originalNodes: legacyData.nodes?.length || 0,
        migratedNodes: 0,
        originalConnections: legacyData.connections?.length || 0,
        migratedConnections: 0,
        dataLoss: ["Complete migration failure"]
      }
    }
  }
}

/**
 * Batch migrate multiple workflows
 */
export function batchMigrate(
  workflows: Array<{ data: LegacyWorkflowData; sourceType?: string }>,
  onProgress?: (completed: number, total: number) => void
): MigrationReport[] {
  const results: MigrationReport[] = []
  
  workflows.forEach((workflow, index) => {
    const result = performMigration(
      workflow.data, 
      workflow.sourceType as any || "generic"
    )
    results.push(result)
    
    if (onProgress) {
      onProgress(index + 1, workflows.length)
    }
  })
  
  return results
}

// Legacy function aliases for backward compatibility
export const migrateWorkflow = migrateToUnifiedWorkflow
export const migrateFromUnifiedBuilder = migrateToUnifiedWorkflow
export const migrateFromConnectedBuilder = migrateToUnifiedWorkflow

/**
 * Migrate WorkflowConnection from old format to unified format
 */
export function migrateWorkflowConnection(
  oldConnection: any
): WorkflowConnection {
  const baseConnection = {
    id: oldConnection.id || `conn-${Date.now()}-${Math.random()}`,
    source: oldConnection.source,
    target: oldConnection.target,
    type: normalizeConnectionType(oldConnection.type),
    label: oldConnection.label
  }

  // Handle condition/conditions migration
  if (oldConnection.conditions) {
    // Already in new format
    return {
      ...baseConnection,
      conditions: oldConnection.conditions,
      condition: oldConnection.condition // Keep for backward compatibility
    }
  } else if (oldConnection.condition) {
    // Migrate from old format
    return {
      ...baseConnection,
      conditions: { default: oldConnection.condition },
      condition: oldConnection.condition // Keep for backward compatibility
    }
  }

  return baseConnection
}

/**
 * Get the effective condition from a connection (handles both formats)
 */
export function getConnectionCondition(connection: WorkflowConnection): string | undefined {
  // Prefer new conditions format
  if (connection.conditions) {
    if (typeof connection.conditions === 'string') {
      return connection.conditions
    }
    if (connection.conditions.default) {
      return connection.conditions.default
    }
    // Return first condition if multiple
    const firstKey = Object.keys(connection.conditions)[0]
    return firstKey ? connection.conditions[firstKey] : undefined
  }
  
  // Fallback to legacy condition
  return connection.condition
}

/**
 * Set condition on a connection (updates both formats for compatibility)
 */
export function setConnectionCondition(
  connection: WorkflowConnection, 
  condition: string
): WorkflowConnection {
  return {
    ...connection,
    condition, // Legacy format
    conditions: { default: condition } // New format
  }
}