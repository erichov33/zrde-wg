"use strict";
/**
 * Base Node Executor
 *
 * Abstract base class for all node executors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseNodeExecutor = void 0;
/**
 * Abstract base class for node executors
 */
class BaseNodeExecutor {
    constructor(node) {
        this.node = node;
    }
    /**
     * Validate node configuration
     */
    validate() {
        const errors = [];
        const warnings = [];
        // Basic validation
        if (!this.node.id) {
            errors.push('Node ID is required');
        }
        if (!this.node.data?.label) {
            warnings.push('Node label is recommended');
        }
        // Allow subclasses to add their own validation
        const customValidation = this.validateNodeSpecific();
        errors.push(...customValidation.errors);
        warnings.push(...customValidation.warnings);
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Node-specific validation - override in subclasses
     */
    validateNodeSpecific() {
        return { isValid: true, errors: [], warnings: [] };
    }
    /**
     * Get input schema for this node type
     */
    getInputSchema() {
        return {
            type: 'object',
            properties: {
                // Base properties that all nodes can access
                variables: { type: 'object' },
                inputData: { type: 'object' }
            }
        };
    }
    /**
     * Get output schema for this node type
     */
    getOutputSchema() {
        return {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                output: { type: 'object' }
            }
        };
    }
    /**
     * Create a successful execution result
     */
    createSuccessResult(output, nextConnector = 'default') {
        return {
            success: true,
            output,
            nextConnector: nextConnector,
            metadata: {
                executionTime: 0, // Will be set by the engine
                nodeId: this.node.id,
                timestamp: new Date()
            }
        };
    }
    /**
     * Create a failed execution result
     */
    createErrorResult(error, output = {}) {
        const executionError = typeof error === 'string'
            ? {
                code: 'NODE_EXECUTION_ERROR',
                message: error,
                nodeId: this.node.id,
                timestamp: new Date()
            }
            : error;
        return {
            success: false,
            output,
            nextConnector: 'error',
            error: executionError,
            metadata: {
                executionTime: 0,
                nodeId: this.node.id,
                timestamp: new Date()
            }
        };
    }
    /**
     * Safely get node configuration value
     */
    getConfig(key, defaultValue) {
        return this.node.data?.config?.[key] ?? defaultValue;
    }
    /**
     * Update workflow context variables
     */
    updateContext(context, updates) {
        Object.assign(context.variables, updates);
    }
    /**
     * Log execution information
     */
    log(level, message, data) {
        const logEntry = {
            level,
            message,
            nodeId: this.node.id,
            nodeType: this.node.type,
            timestamp: new Date(),
            data
        };
        // In production, this would integrate with your logging system
        console.log(`[${level.toUpperCase()}] ${message}`, logEntry);
    }
}
exports.BaseNodeExecutor = BaseNodeExecutor;
