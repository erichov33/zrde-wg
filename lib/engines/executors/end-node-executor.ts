/**
 * End Node Executor
 * 
 * Handles workflow termination
 */

import { BaseNodeExecutor } from './base-node-executor'
import { WorkflowExecutionContext, NodeExecutionResult } from '../../types/execution-contracts'

/**
 * Executor for end nodes
 */
export class EndNodeExecutor extends BaseNodeExecutor {
  async execute(context: WorkflowExecutionContext): Promise<NodeExecutionResult> {
    const decision = this.getConfig<any>('decision')
    const message = this.getConfig<string>('message', 'Workflow completed')

    this.log('info', 'Ending workflow execution', {
      workflowId: context.workflowId,
      executionId: context.executionId,
      decision
    })

    // Calculate execution duration
    const duration = Date.now() - context.metadata.startTime.getTime()

    const output = {
      message,
      endTime: new Date(),
      duration,
      executionPath: context.metadata.executionPath,
      finalVariables: { ...context.variables }
    }

    // Add decision if specified
    if (decision) {
      (output as any).decision = decision
    }

    return this.createSuccessResult(output, 'success')
  }

  getOutputSchema(): Record<string, any> {
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
    }
  }
}