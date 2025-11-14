"use strict";
/**
 * End Node Executor
 *
 * Handles workflow termination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndNodeExecutor = void 0;
const base_node_executor_1 = require("./base-node-executor");
/**
 * Executor for end nodes
 */
class EndNodeExecutor extends base_node_executor_1.BaseNodeExecutor {
    async execute(context) {
        const decision = this.getConfig('decision');
        const message = this.getConfig('message', 'Workflow completed');
        this.log('info', 'Ending workflow execution', {
            workflowId: context.workflowId,
            executionId: context.executionId,
            decision
        });
        // Calculate execution duration
        const duration = Date.now() - context.metadata.startTime.getTime();
        const output = {
            message,
            endTime: new Date(),
            duration,
            executionPath: context.metadata.executionPath,
            finalVariables: { ...context.variables }
        };
        // Add decision if specified
        if (decision) {
            output.decision = decision;
        }
        return this.createSuccessResult(output, 'success');
    }
    getOutputSchema() {
        return {
            type: 'object',
            properties: {
                message: { type: 'string' },
                endTime: { type: 'string', format: 'date-time' },
                duration: { type: 'number' },
                executionPath: { type: 'array', items: { type: 'string' } },
                finalVariables: { type: 'object' },
                decision: { type: 'object' }
            }
        };
    }
}
exports.EndNodeExecutor = EndNodeExecutor;
