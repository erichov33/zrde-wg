/**
 * Condition Node Executor
 * 
 * Handles conditional branching in workflows
 */

import { BaseNodeExecutor } from './base-node-executor'
import { WorkflowExecutionContext, NodeExecutionResult, ValidationResult } from '../../types/execution-contracts'

/**
 * Executor for condition nodes
 */
export class ConditionNodeExecutor extends BaseNodeExecutor {
  async execute(context: WorkflowExecutionContext): Promise<NodeExecutionResult> {
    const condition = this.getConfig<string>('condition')
    
    if (!condition) {
      return this.createErrorResult('No condition specified for condition node')
    }

    this.log('info', 'Evaluating condition', { condition })

    try {
      const result = this.evaluateCondition(condition, context)
      
      this.log('info', 'Condition evaluated', { condition, result })

      return this.createSuccessResult({
        conditionResult: result,
        condition,
        evaluatedAt: new Date()
      }, result ? 'true' : 'false')
    } catch (error) {
      return this.createErrorResult(`Failed to evaluate condition: ${error}`)
    }
  }

  /**
   * Evaluate the condition expression
   */
  private evaluateCondition(condition: string, context: WorkflowExecutionContext): boolean {
    // Create evaluation context with variables and input data
    const evalContext = {
      ...context.variables,
      ...context.inputData,
      // Add common helper functions
      Math,
      Date,
      // Add utility functions
      isEmpty: (value: any) => value == null || value === '' || (Array.isArray(value) && value.length === 0),
      isNotEmpty: (value: any) => !this.isEmpty(value),
      contains: (array: any[], value: any) => Array.isArray(array) && array.includes(value),
      between: (value: number, min: number, max: number) => value >= min && value <= max
    }

    // Replace variables in condition
    let evaluatedCondition = condition
    for (const [key, value] of Object.entries(evalContext)) {
      if (typeof value !== 'function') {
        const regex = new RegExp(`\\b${key}\\b`, 'g')
        evaluatedCondition = evaluatedCondition.replace(regex, JSON.stringify(value))
      }
    }

    // Evaluate the condition safely
    try {
      return new Function('context', `
        with (context) {
          return ${evaluatedCondition};
        }
      `)(evalContext)
    } catch (error) {
      throw new Error(`Invalid condition expression: ${condition}`)
    }
  }

  private isEmpty(value: any): boolean {
    return value == null || value === '' || (Array.isArray(value) && value.length === 0)
  }

  protected validateNodeSpecific(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    const condition = this.getConfig<string>('condition')
    if (!condition) {
      errors.push('Condition expression is required')
    } else {
      // Basic syntax validation
      try {
        // Try to parse the condition (basic validation)
        new Function(`return ${condition}`)
      } catch (error) {
        warnings.push(`Condition syntax may be invalid: ${condition}`)
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  getInputSchema(): Record<string, any> {
    return {
      ...super.getInputSchema(),
      properties: {
        ...super.getInputSchema().properties,
        condition: { type: 'string', description: 'JavaScript expression to evaluate' }
      }
    }
  }

  getOutputSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        conditionResult: { type: 'boolean' },
        condition: { type: 'string' },
        evaluatedAt: { type: 'string', format: 'date-time' }
      }
    }
  }
}