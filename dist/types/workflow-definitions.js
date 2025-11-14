"use strict";
/**
 * Unified Workflow Definition Types
 *
 * This file provides a single source of truth for workflow definitions
 * to resolve type conflicts across the codebase.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnhancedWorkflowDefinition = isEnhancedWorkflowDefinition;
exports.isFullWorkflowDefinition = isFullWorkflowDefinition;
exports.convertExternalSourcesToIds = convertExternalSourcesToIds;
exports.createDataRequirements = createDataRequirements;
// Type guards
function isEnhancedWorkflowDefinition(workflow) {
    return 'ruleSet' in workflow;
}
function isFullWorkflowDefinition(workflow) {
    return 'nodes' in workflow && 'connections' in workflow;
}
// Utility functions for type conversion
function convertExternalSourcesToIds(sources) {
    return sources.map(source => source.id);
}
function createDataRequirements(required = [], optional = [], external = []) {
    return { required, optional, external };
}
