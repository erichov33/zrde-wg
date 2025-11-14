"use strict";
/**
 * Async Operation Registry
 *
 * Manages long-running async operations in workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncOperationRegistry = void 0;
/**
 * In-memory async operation registry
 */
class AsyncOperationRegistry {
    constructor() {
        this.operations = new Map();
    }
    async register(operation) {
        this.operations.set(operation.operationId, operation);
    }
    async complete(operationId, result) {
        const operation = this.operations.get(operationId);
        if (!operation) {
            throw new Error(`Operation ${operationId} not found`);
        }
        operation.status = 'completed';
        operation.result = result;
        // Resume execution
        await operation.resumeCallback(result);
    }
    async fail(operationId, error) {
        const operation = this.operations.get(operationId);
        if (!operation) {
            throw new Error(`Operation ${operationId} not found`);
        }
        operation.status = 'failed';
        operation.error = error;
        // Resume execution with error
        await operation.resumeCallback(null);
    }
    async getStatus(operationId) {
        return this.operations.get(operationId) || null;
    }
    async cleanup(olderThan) {
        for (const [id, operation] of this.operations.entries()) {
            if (operation.status === 'completed' || operation.status === 'failed') {
                // In a real implementation, you'd check the operation timestamp
                this.operations.delete(id);
            }
        }
    }
}
exports.AsyncOperationRegistry = AsyncOperationRegistry;
