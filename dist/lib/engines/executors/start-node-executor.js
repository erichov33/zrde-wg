"use strict";
/**
 * Start Node Executor
 *
 * Handles workflow start nodes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartNodeExecutor = void 0;
const base_node_executor_1 = require("./base-node-executor");
/**
 * Executor for start nodes
 */
class StartNodeExecutor extends base_node_executor_1.BaseNodeExecutor {
    async execute(context) {
        this.log('info', 'Starting workflow execution', {
            workflowId: context.workflowId,
            executionId: context.executionId
        });
        // Initialize workflow variables with input data
        this.updateContext(context, {
            ...context.inputData,
            startTime: new Date(),
            executionId: context.executionId
        });
        // Start nodes always succeed and pass to the next node
        return this.createSuccessResult({
            message: 'Workflow started successfully',
            startTime: new Date(),
            inputData: context.inputData
        }, 'success');
    }
    getOutputSchema() {
        return {
            type: 'object',
            properties: {
                message: { type: 'string' },
                startTime: { type: 'string', format: 'date-time' },
                inputData: { type: 'object' }
            }
        };
    }
}
exports.StartNodeExecutor = StartNodeExecutor;
