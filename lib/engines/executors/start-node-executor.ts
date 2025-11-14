/**
 * Start Node Executor
 * 
 * Handles workflow start nodes
 */

import { BaseNodeExecutor } from './base-node-executor'
import { WorkflowExecutionContext, NodeExecutionResult } from '../../types/execution-contracts'

/**
 * Executor for start nodes
 */
export class StartNodeExecutor extends BaseNodeExecutor {
  async execute(context: WorkflowExecutionContext): Promise<NodeExecutionResult> {
    this.log('info', 'Starting workflow execution', {
      workflowId: context.workflowId,
      executionId: context.executionId
    })

    // Initialize workflow variables with input data
    this.updateContext(context, {
      ...context.inputData,
      startTime: new Date(),
      executionId: context.executionId
    })

    // Start nodes always succeed and pass to the next node
    return this.createSuccessResult({
      message: 'Workflow started successfully',
      startTime: new Date(),
      inputData: context.inputData
    }, 'success')
  }

  getOutputSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        message: { type: 'string' },
        startTime: { type: 'string', format: 'date-time' },
        inputData: { type: 'object' }
      }
    }
  }
}