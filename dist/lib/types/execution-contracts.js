"use strict";
/**
 * Workflow Execution Contracts
 *
 * Defines the standard interfaces for node execution, connectors,
 * and the execution engine runtime.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExecutableNode = isExecutableNode;
exports.isExecutableConnection = isExecutableConnection;
exports.createExecutionContext = createExecutionContext;
// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================
/**
 * Type guard for executable nodes
 */
function isExecutableNode(obj) {
    return obj &&
        typeof obj.execute === 'function' &&
        typeof obj.validate === 'function' &&
        obj.node !== undefined;
}
/**
 * Type guard for executable connections
 */
function isExecutableConnection(obj) {
    return obj &&
        typeof obj.connectorType === 'string' &&
        typeof obj.priority === 'number' &&
        typeof obj.isErrorHandler === 'boolean';
}
/**
 * Create default execution context
 */
function createExecutionContext(workflowId, inputData, options = {}) {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
        executionId,
        workflowId,
        variables: {},
        inputData: { ...inputData },
        metadata: {
            startTime: new Date(),
            currentNodeId: '',
            executionPath: [],
            ...options.metadata
        },
        errors: [],
        ...options
    };
}
