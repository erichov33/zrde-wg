/**
 * Unified Workflow Definition Types
 * 
 * This file provides a single source of truth for workflow definitions
 * to resolve type conflicts across the codebase.
 */

import { RuleSet } from "@/lib/engines/rule-engine"

// Base data source configuration
export interface DataSourceConfig {
  id: string
  name: string
  type: "credit_bureau" | "kyc_provider" | "fraud_service" | "income_verification" | "custom"
  endpoint: string
  apiKey?: string
  timeout: number
  retries: number
  enabled: boolean
  fields?: string[]
}

// Unified data requirements interface
export interface DataRequirements {
  required: string[]
  optional: string[]
  external: string[] // Standardized as string array for external source IDs
}

// Enhanced data requirements for complex workflows
export interface EnhancedDataRequirements extends DataRequirements {
  externalSources: DataSourceConfig[] // Full configuration objects
  computed?: ComputedField[]
}

export interface ComputedField {
  name: string
  expression: string
  dataType: string
  dependencies: string[]
}

// Base workflow definition (used by enhanced-decision-service)
export interface BaseWorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  dataRequirements: DataRequirements
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    status: "draft" | "active" | "deprecated"
  }
}

// Enhanced workflow definition (extends base with rule set)
export interface EnhancedWorkflowDefinition extends BaseWorkflowDefinition {
  ruleSet: RuleSet
}

// Import proper types from the unified workflow system
import type { 
  WorkflowNode, 
  WorkflowConnection, 
  BusinessRule, 
  WorkflowConfiguration 
} from "./unified-workflow"

// Full workflow definition (for complex workflow systems)
export interface FullWorkflowDefinition extends BaseWorkflowDefinition {
  status: "draft" | "active" | "inactive" | "deprecated" | "archived"
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  businessRules: BusinessRule[]
  configuration: WorkflowConfiguration
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    status: "draft" | "active" | "deprecated"
    version: string
    lastModified: Date
    author: string
    tags?: string[]
  }
}

// Type guards
export function isEnhancedWorkflowDefinition(
  workflow: BaseWorkflowDefinition
): workflow is EnhancedWorkflowDefinition {
  return 'ruleSet' in workflow
}

export function isFullWorkflowDefinition(
  workflow: BaseWorkflowDefinition
): workflow is FullWorkflowDefinition {
  return 'nodes' in workflow && 'connections' in workflow
}

// Utility functions for type conversion
export function convertExternalSourcesToIds(sources: DataSourceConfig[]): string[] {
  return sources.map(source => source.id)
}

export function createDataRequirements(
  required: string[] = [],
  optional: string[] = [],
  external: string[] = []
): DataRequirements {
  return { required, optional, external }
}