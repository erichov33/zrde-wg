"use strict";
/**
 * Unified Workflow Type System
 *
 * This file provides the single source of truth for all workflow types
 * across the entire application to eliminate type conflicts and duplications.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStartNode = isStartNode;
exports.isEndNode = isEndNode;
exports.hasRules = hasRules;
exports.getAvailableNodeTypes = getAvailableNodeTypes;
exports.createDefaultWorkflow = createDefaultWorkflow;
// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================
/**
 * Type guard to check if a node is a start node
 */
function isStartNode(node) {
    return node.type === "start";
}
/**
 * Type guard to check if a node is an end node
 */
function isEndNode(node) {
    return node.type === "end";
}
/**
 * Type guard to check if a node has rules
 */
function hasRules(node) {
    return node.type === "condition" || node.type === "rule_set";
}
/**
 * Get available node types for a specific workflow mode
 */
function getAvailableNodeTypes(mode) {
    const baseTypes = ["start", "condition", "action", "end"];
    const enhancedTypes = ["data_source", "rule_set", "validation"];
    const enterpriseTypes = ["decision", "integration", "notification", "ai_decision", "batch_process", "audit_log"];
    switch (mode) {
        case "enhanced":
            return [...baseTypes, ...enhancedTypes];
        case "enterprise":
            return [...baseTypes, ...enhancedTypes, ...enterpriseTypes];
        default:
            return baseTypes;
    }
}
/**
 * Create a default workflow definition
 */
function createDefaultWorkflow(name, mode = "simple") {
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
    };
}
