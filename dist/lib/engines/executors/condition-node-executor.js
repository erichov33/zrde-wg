"use strict";
/**
 * Condition Node Executor
 *
 * Handles conditional branching in workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionNodeExecutor = void 0;
const base_node_executor_1 = require("./base-node-executor");
/**
 * Executor for condition nodes
 */
class ConditionNodeExecutor extends base_node_executor_1.BaseNodeExecutor {
    async execute(context) {
        const condition = this.getConfig('condition');
        if (!condition) {
            return this.createErrorResult('No condition specified for condition node');
        }
        this.log('info', 'Evaluating condition', { condition });
        try {
            const result = this.evaluateCondition(condition, context);
            this.log('info', 'Condition evaluated', { condition, result });
            return this.createSuccessResult({
                conditionResult: result,
                condition,
                evaluatedAt: new Date()
            }, result ? 'true' : 'false');
        }
        catch (error) {
            return this.createErrorResult(`Failed to evaluate condition: ${error}`);
        }
    }
    /**
     * Evaluate the condition expression
     */
    evaluateCondition(condition, context) {
        // Create evaluation context with variables and input data
        const evalContext = {
            ...context.variables,
            ...context.inputData,
            // Add common helper functions
            Math,
            Date,
            // Add utility functions
            isEmpty: (value) => value == null || value === '' || (Array.isArray(value) && value.length === 0),
            isNotEmpty: (value) => !this.isEmpty(value),
            contains: (array, value) => Array.isArray(array) && array.includes(value),
            between: (value, min, max) => value >= min && value <= max
        };
        // Replace variables in condition
        let evaluatedCondition = condition;
        for (const [key, value] of Object.entries(evalContext)) {
            if (typeof value !== 'function') {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                evaluatedCondition = evaluatedCondition.replace(regex, JSON.stringify(value));
            }
        }
        // Evaluate the condition safely
        try {
            return new Function('context', `
        with (context) {
          return ${evaluatedCondition};
        }
      `)(evalContext);
        }
        catch (error) {
            throw new Error(`Invalid condition expression: ${condition}`);
        }
    }
    isEmpty(value) {
        return value == null || value === '' || (Array.isArray(value) && value.length === 0);
    }
    validateNodeSpecific() {
        const errors = [];
        const warnings = [];
        const condition = this.getConfig('condition');
        if (!condition) {
            errors.push('Condition expression is required');
        }
        else {
            // Basic syntax validation
            try {
                // Try to parse the condition (basic validation)
                new Function(`return ${condition}`);
            }
            catch (error) {
                warnings.push(`Condition syntax may be invalid: ${condition}`);
            }
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
    getInputSchema() {
        return {
            ...super.getInputSchema(),
            properties: {
                ...super.getInputSchema().properties,
                condition: { type: 'string', description: 'JavaScript expression to evaluate' }
            }
        };
    }
    getOutputSchema() {
        return {
            type: 'object',
            properties: {
                conditionResult: { type: 'boolean' },
                condition: { type: 'string' },
                evaluatedAt: { type: 'string', format: 'date-time' }
            }
        };
    }
}
exports.ConditionNodeExecutor = ConditionNodeExecutor;
