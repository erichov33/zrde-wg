/**
 * Async Operation Registry
 * 
 * Manages long-running async operations in workflows
 */

import {
  IAsyncOperationRegistry,
  AsyncOperationHandle,
  ExecutionError
} from '../types/execution-contracts'

/**
 * In-memory async operation registry
 */
export class AsyncOperationRegistry implements IAsyncOperationRegistry {
  private operations = new Map<string, AsyncOperationHandle>()

  async register(operation: AsyncOperationHandle): Promise<void> {
    this.operations.set(operation.operationId, operation)
  }

  async complete(operationId: string, result: any): Promise<void> {
    const operation = this.operations.get(operationId)
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    operation.status = 'completed'
    operation.result = result

    // Resume execution
    await operation.resumeCallback(result)
  }

  async fail(operationId: string, error: ExecutionError): Promise<void> {
    const operation = this.operations.get(operationId)
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    operation.status = 'failed'
    operation.error = error

    // Resume execution with error
    await operation.resumeCallback(null)
  }

  async getStatus(operationId: string): Promise<AsyncOperationHandle | null> {
    return this.operations.get(operationId) || null
  }

  async cleanup(olderThan: Date): Promise<void> {
    for (const [id, operation] of this.operations.entries()) {
      if (operation.status === 'completed' || operation.status === 'failed') {
        // In a real implementation, you'd check the operation timestamp
        this.operations.delete(id)
      }
    }
  }
}