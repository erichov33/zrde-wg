/**
 * Workflow Migration Utilities
 * 
 * Utilities to migrate from old workflow builders to the new consolidated builder
 */

import type { ConsolidatedWorkflowNode, ConsolidatedWorkflowConnection, ConsolidatedWorkflowDefinition } from "@/components/workflows/consolidated-workflow-builder"
import type { UnifiedWorkflowNode, WorkflowConnection } from "@/components/workflows/unified-workflow-builder"

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
 * Migrate from unified workflow builder to consolidated builder
 */
export function migrateFromUnifiedBuilder(
  legacyData: {
    nodes: UnifiedWorkflowNode[]
    connections: WorkflowConnection[]
    name?: string
    description?: string
  }
): ConsolidatedWorkflowDefinition {
  const migratedNodes: ConsolidatedWorkflowNode[] = legacyData.nodes.map(node => ({
    id: node.id,
    type: node.type === "condition" ? "decision" : node.type,
    position: node.position,
    data: {
      ...node.data,
      description: node.data.description || `${node.data.label} node`
    }
  }))

  const migratedConnections: ConsolidatedWorkflowConnection[] = legacyData.connections.map(conn => ({
    id: conn.id,
    source: conn.source,
    target: conn.target,
    label: conn.label,
    condition: conn.condition,
    data: {}
  }))

  return {
    id: `migrated_${Date.now()}`,
    name: legacyData.name || "Migrated Workflow",
    description: legacyData.description || "Workflow migrated from unified builder",
    version: "1.0.0",
    nodes: migratedNodes,
    connections: migratedConnections,
    dataRequirements: {
      required: ["creditScore", "income", "debtToIncomeRatio"],
      optional: ["employmentHistory", "bankingHistory"],
      external: ["credit_bureau", "income_verification"]
    },
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      author: "migration_tool",
      tags: ["migrated", "unified_builder"]
    }
  }
}

/**
 * Migrate from connected workflow builder to consolidated builder
 */
export function migrateFromConnectedBuilder(
  legacyData: LegacyWorkflowData
): ConsolidatedWorkflowDefinition {
  const migratedNodes: ConsolidatedWorkflowNode[] = legacyData.nodes.map(node => ({
    id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: node.type || "action",
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.data?.label || node.label || "Unnamed Node",
      description: node.data?.description || node.description || `${node.type} node`,
      config: node.data?.config || node.config || {},
      ...node.data
    }
  }))

  const migratedConnections: ConsolidatedWorkflowConnection[] = legacyData.connections.map(conn => ({
    id: conn.id || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    source: conn.source,
    target: conn.target,
    label: conn.label,
    condition: conn.condition,
    data: conn.data || {}
  }))

  return {
    id: `migrated_${Date.now()}`,
    name: legacyData.name || "Migrated Workflow",
    description: legacyData.description || "Workflow migrated from connected builder",
    version: legacyData.version || "1.0.0",
    nodes: migratedNodes,
    connections: migratedConnections,
    dataRequirements: {
      required: ["creditScore", "income", "debtToIncomeRatio"],
      optional: ["employmentHistory", "bankingHistory"],
      external: ["credit_bureau", "income_verification"]
    },
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      author: "migration_tool",
      tags: ["migrated", "connected_builder"]
    }
  }
}

/**
 * Generic migration function for any legacy workflow format
 */
export function migrateWorkflow(
  legacyData: LegacyWorkflowData,
  sourceType: "unified" | "connected" | "generic" = "generic"
): ConsolidatedWorkflowDefinition {
  switch (sourceType) {
    case "unified":
      return migrateFromUnifiedBuilder(legacyData as any)
    case "connected":
      return migrateFromConnectedBuilder(legacyData)
    default:
      return migrateFromGenericFormat(legacyData)
  }
}

/**
 * Migrate from generic workflow format
 */
function migrateFromGenericFormat(
  legacyData: LegacyWorkflowData
): ConsolidatedWorkflowDefinition {
  const migratedNodes: ConsolidatedWorkflowNode[] = legacyData.nodes.map((node, index) => {
    // Handle various node formats
    const nodeId = node.id || `node_${index}`
    const nodeType = normalizeNodeType(node.type || "action")
    const nodePosition = node.position || { x: index * 200, y: 100 }
    
    return {
      id: nodeId,
      type: nodeType,
      position: nodePosition,
      data: {
        label: node.label || node.data?.label || `Node ${index + 1}`,
        description: node.description || node.data?.description || `${nodeType} node`,
        config: node.config || node.data?.config || {},
        ...extractNodeData(node)
      }
    }
  })

  const migratedConnections: ConsolidatedWorkflowConnection[] = legacyData.connections.map((conn, index) => ({
    id: conn.id || `conn_${index}`,
    source: conn.source || conn.from,
    target: conn.target || conn.to,
    label: conn.label || conn.name,
    condition: conn.condition || conn.rule,
    data: conn.data || {}
  }))

  return {
    id: `migrated_${Date.now()}`,
    name: legacyData.name || "Migrated Workflow",
    description: legacyData.description || "Workflow migrated from legacy format",
    version: legacyData.version || "1.0.0",
    nodes: migratedNodes,
    connections: migratedConnections,
    dataRequirements: {
      required: ["creditScore", "income", "debtToIncomeRatio"],
      optional: ["employmentHistory", "bankingHistory"],
      external: ["credit_bureau", "income_verification"]
    },
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      author: "migration_tool",
      tags: ["migrated", "generic"]
    }
  }
}

/**
 * Normalize node types to consolidated format
 */
function normalizeNodeType(type: string): ConsolidatedWorkflowNode["type"] {
  const typeMap: Record<string, ConsolidatedWorkflowNode["type"]> = {
    "condition": "decision",
    "conditional": "decision",
    "decision": "decision",
    "start": "start",
    "begin": "start",
    "end": "end",
    "finish": "end",
    "action": "action",
    "task": "action",
    "data_source": "data_source",
    "datasource": "data_source",
    "rule_set": "rule_set",
    "rules": "rule_set"
  }

  return typeMap[type.toLowerCase()] || "action"
}

/**
 * Extract node data from various formats
 */
function extractNodeData(node: any): Record<string, any> {
  const data: Record<string, any> = {}

  // Extract common properties
  if (node.rules) data.rules = node.rules
  if (node.dataSource) data.dataSource = node.dataSource
  if (node.conditions) data.conditions = node.conditions
  if (node.businessLogic) data.businessLogic = node.businessLogic

  // Extract nested data
  if (node.data) {
    Object.keys(node.data).forEach(key => {
      if (!data[key]) {
        data[key] = node.data[key]
      }
    })
  }

  return data
}

/**
 * Validate migrated workflow
 */
export function validateMigratedWorkflow(
  workflow: ConsolidatedWorkflowDefinition
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!workflow.name) errors.push("Workflow name is required")
  if (!workflow.description) warnings.push("Workflow description is missing")
  if (!workflow.version) warnings.push("Workflow version is missing")

  // Check nodes
  if (workflow.nodes.length === 0) {
    errors.push("Workflow must have at least one node")
  } else {
    // Check for start and end nodes
    const hasStart = workflow.nodes.some(n => n.type === "start")
    const hasEnd = workflow.nodes.some(n => n.type === "end")
    
    if (!hasStart) warnings.push("Workflow should have a start node")
    if (!hasEnd) warnings.push("Workflow should have an end node")

    // Check node data
    workflow.nodes.forEach((node, index) => {
      if (!node.id) errors.push(`Node ${index} is missing an ID`)
      if (!node.data.label) warnings.push(`Node ${node.id} is missing a label`)
    })
  }

  // Check connections
  workflow.connections.forEach((conn, index) => {
    if (!conn.source) errors.push(`Connection ${index} is missing source`)
    if (!conn.target) errors.push(`Connection ${index} is missing target`)
    
    // Check if referenced nodes exist
    const sourceExists = workflow.nodes.some(n => n.id === conn.source)
    const targetExists = workflow.nodes.some(n => n.id === conn.target)
    
    if (!sourceExists) errors.push(`Connection ${conn.id} references non-existent source node: ${conn.source}`)
    if (!targetExists) errors.push(`Connection ${conn.id} references non-existent target node: ${conn.target}`)
  })

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
  migratedWorkflow?: ConsolidatedWorkflowDefinition
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
  sourceType: "unified" | "connected" | "generic" = "generic"
): MigrationReport {
  try {
    const migratedWorkflow = migrateWorkflow(legacyData, sourceType)
    const validation = validateMigratedWorkflow(migratedWorkflow)
    
    const statistics = {
      originalNodes: legacyData.nodes?.length || 0,
      migratedNodes: migratedWorkflow.nodes.length,
      originalConnections: legacyData.connections?.length || 0,
      migratedConnections: migratedWorkflow.connections.length,
      dataLoss: [] as string[]
    }

    // Check for data loss
    if (statistics.originalNodes !== statistics.migratedNodes) {
      statistics.dataLoss.push(`Node count mismatch: ${statistics.originalNodes} -> ${statistics.migratedNodes}`)
    }
    if (statistics.originalConnections !== statistics.migratedConnections) {
      statistics.dataLoss.push(`Connection count mismatch: ${statistics.originalConnections} -> ${statistics.migratedConnections}`)
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
        errors: [error instanceof Error ? error.message : "Unknown migration error"],
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