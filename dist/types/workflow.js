"use strict";
/**
 * Unified Workflow Type System
 * Centralized type definitions for all workflow-related functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDefinitionSchema = exports.WorkflowConnectionSchema = exports.WorkflowNodeSchema = exports.PositionSchema = void 0;
exports.isWorkflowNode = isWorkflowNode;
exports.isWorkflowConnection = isWorkflowConnection;
exports.isWorkflowDefinition = isWorkflowDefinition;
const zod_1 = require("zod");
// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================
/**
 * Zod schema for position validation
 */
exports.PositionSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number()
});
/**
 * Zod schema for workflow node validation
 */
exports.WorkflowNodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.enum(['start', 'condition', 'action', 'end', 'data_source', 'rule_set', 'decision', 'validation', 'task', 'loop', 'delay', 'error', 'data', 'transform', 'api', 'email', 'webhook', 'file', 'integration', 'notification', 'ai_decision', 'batch_process', 'audit_log']),
    position: exports.PositionSchema,
    data: zod_1.z.object({
        label: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        config: zod_1.z.record(zod_1.z.any()).optional(),
        rules: zod_1.z.array(zod_1.z.any()).optional(),
        dataSource: zod_1.z.any().optional(),
        conditions: zod_1.z.array(zod_1.z.any()).optional(),
        businessLogic: zod_1.z.any().optional(),
        validation: zod_1.z.any().optional()
    }),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.date(),
        updatedAt: zod_1.z.date(),
        version: zod_1.z.string(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        author: zod_1.z.string().optional()
    }).optional()
});
/**
 * Zod schema for workflow connection validation
 */
exports.WorkflowConnectionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    source: zod_1.z.string(),
    target: zod_1.z.string(),
    label: zod_1.z.string().optional(),
    condition: zod_1.z.string().optional(),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.date(),
        priority: zod_1.z.number().optional(),
        description: zod_1.z.string().optional()
    }).optional()
});
/**
 * Zod schema for workflow definition validation
 */
exports.WorkflowDefinitionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    version: zod_1.z.string(),
    status: zod_1.z.enum(['draft', 'active', 'inactive', 'deprecated', 'archived']),
    nodes: zod_1.z.array(exports.WorkflowNodeSchema),
    connections: zod_1.z.array(exports.WorkflowConnectionSchema),
    dataRequirements: zod_1.z.object({
        required: zod_1.z.array(zod_1.z.string()),
        optional: zod_1.z.array(zod_1.z.string()),
        external: zod_1.z.array(zod_1.z.any()),
        computed: zod_1.z.array(zod_1.z.any())
    }),
    businessRules: zod_1.z.array(zod_1.z.any()),
    configuration: zod_1.z.any(),
    metadata: zod_1.z.any()
});
// ============================================================================
// Type Guards
// ============================================================================
/**
 * Type guard for workflow nodes
 */
function isWorkflowNode(obj) {
    return exports.WorkflowNodeSchema.safeParse(obj).success;
}
/**
 * Type guard for workflow connections
 */
function isWorkflowConnection(obj) {
    return exports.WorkflowConnectionSchema.safeParse(obj).success;
}
/**
 * Type guard for workflow definitions
 */
function isWorkflowDefinition(obj) {
    return exports.WorkflowDefinitionSchema.safeParse(obj).success;
}
