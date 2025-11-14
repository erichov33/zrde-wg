"use strict";
/**
 * Workflow Execution Engine
 *
 * Core runtime engine that executes workflows by traversing nodes
 * and following connectors based on execution results.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionEngine = void 0;
const execution_contracts_1 = require("../types/execution-contracts");
const node_executor_factory_1 = require("./node-executor-factory");
const async_operation_registry_1 = require("./async-operation-registry");
/**
 * Main workflow execution engine
 */
class WorkflowExecutionEngine {
    constructor(workflowService) {
        this.activeExecutions = new Map();
        this.workflowService = workflowService;
        this.nodeExecutorFactory = new node_executor_factory_1.NodeExecutorFactory();
        this.asyncRegistry = new async_operation_registry_1.AsyncOperationRegistry();
    }
    /**
     * Execute a complete workflow from start to finish
     */
    async executeWorkflow(workflowId, inputData, options = {}) {
        const startTime = new Date();
        const context = (0, execution_contracts_1.createExecutionContext)(workflowId, inputData, {
            metadata: {
                startTime,
                currentNodeId: '',
                executionPath: [],
                userId: options.variableOverrides?.userId,
                sessionId: options.variableOverrides?.sessionId
            }
        });
        // Apply variable overrides
        if (options.variableOverrides) {
            Object.assign(context.variables, options.variableOverrides);
        }
        this.activeExecutions.set(context.executionId, context);
        try {
            // Load workflow definition
            const workflow = await this.loadWorkflow(workflowId);
            // Find start node
            const startNode = workflow.nodes.find(node => node.type === 'start');
            if (!startNode) {
                throw new Error(`No start node found in workflow ${workflowId}`);
            }
            // Execute workflow loop
            const result = await this.executeWorkflowLoop(workflow, startNode, context, options);
            return {
                executionId: context.executionId,
                success: result.success,
                output: result.output,
                decision: result.decision,
                metadata: {
                    startTime,
                    endTime: new Date(),
                    duration: Date.now() - startTime.getTime(),
                    nodesExecuted: context.metadata.executionPath.length,
                    executionPath: context.metadata.executionPath
                },
                errors: context.errors,
                context
            };
        }
        catch (error) {
            const executionError = {
                code: 'WORKFLOW_EXECUTION_FAILED',
                message: error instanceof Error ? error.message : 'Unknown error',
                nodeId: context.metadata.currentNodeId,
                timestamp: new Date(),
                stack: error instanceof Error ? error.stack : undefined
            };
            context.errors.push(executionError);
            return {
                executionId: context.executionId,
                success: false,
                output: {},
                metadata: {
                    startTime,
                    endTime: new Date(),
                    duration: Date.now() - startTime.getTime(),
                    nodesExecuted: context.metadata.executionPath.length,
                    executionPath: context.metadata.executionPath
                },
                errors: context.errors,
                context
            };
        }
        finally {
            this.activeExecutions.delete(context.executionId);
        }
    }
    /**
     * Main execution loop that traverses the workflow graph
     */
    async executeWorkflowLoop(workflow, currentNode, context, options) {
        const maxIterations = 1000; // Prevent infinite loops
        let iterations = 0;
        let finalOutput = {};
        let finalDecision = undefined;
        while (currentNode && iterations < maxIterations) {
            iterations++;
            // Update current node in context
            context.metadata.currentNodeId = currentNode.id;
            context.metadata.executionPath.push(currentNode.id);
            // Check for timeout
            if (options.timeout && Date.now() - context.metadata.startTime.getTime() > options.timeout) {
                throw new Error(`Workflow execution timeout after ${options.timeout}ms`);
            }
            // Execute current node
            const nodeResult = await this.executeNode(currentNode, context);
            // Handle node execution result
            if (!nodeResult.success && nodeResult.error) {
                context.errors.push(nodeResult.error);
                // Try to find error handler connector
                const errorConnections = this.getNodeConnections(workflow, currentNode.id)
                    .filter(conn => conn.connectorType === 'error' || conn.isErrorHandler);
                if (errorConnections.length > 0) {
                    const nextNodeId = await this.evaluateConnectors(errorConnections, context, nodeResult);
                    if (nextNodeId) {
                        currentNode = this.findNodeById(workflow, nextNodeId);
                        continue;
                    }
                }
                // No error handler found, fail the workflow
                throw new Error(`Node ${currentNode.id} failed: ${nodeResult.error.message}`);
            }
            // Merge node output into final output
            Object.assign(finalOutput, nodeResult.output);
            // Check if this is an end node
            if (currentNode.type === 'end') {
                finalDecision = nodeResult.output.decision || finalDecision;
                break;
            }
            // Find next node to execute
            const connections = this.getNodeConnections(workflow, currentNode.id);
            const nextNodeId = await this.evaluateConnectors(connections, context, nodeResult);
            if (!nextNodeId) {
                // No next node found, workflow ends here
                break;
            }
            currentNode = this.findNodeById(workflow, nextNodeId);
            if (!currentNode) {
                throw new Error(`Next node ${nextNodeId} not found in workflow`);
            }
        }
        if (iterations >= maxIterations) {
            throw new Error('Workflow execution exceeded maximum iterations (possible infinite loop)');
        }
        return {
            success: context.errors.length === 0,
            output: finalOutput,
            decision: finalDecision
        };
    }
    /**
     * Execute a single node
     */
    async executeNode(node, context) {
        const startTime = Date.now();
        try {
            // Get node executor
            const executor = this.nodeExecutorFactory.createExecutor(node);
            // Execute the node
            const result = await executor.execute(context);
            // Update execution time
            result.metadata.executionTime = Date.now() - startTime;
            return result;
        }
        catch (error) {
            const executionError = {
                code: 'NODE_EXECUTION_FAILED',
                message: error instanceof Error ? error.message : 'Unknown error',
                nodeId: node.id,
                timestamp: new Date(),
                stack: error instanceof Error ? error.stack : undefined,
                context: { nodeType: node.type, nodeData: node.data }
            };
            return {
                success: false,
                output: {},
                nextConnector: 'error',
                error: executionError,
                metadata: {
                    executionTime: Date.now() - startTime,
                    nodeId: node.id,
                    timestamp: new Date()
                }
            };
        }
    }
    /**
     * Evaluate connectors to determine next node
     */
    async evaluateConnectors(connections, context, nodeResult) {
        if (connections.length === 0) {
            return null;
        }
        // Sort connections by priority (higher priority first)
        const sortedConnections = connections.sort((a, b) => b.priority - a.priority);
        for (const connection of sortedConnections) {
            const evaluation = await this.evaluateConnection(connection, context, nodeResult);
            if (evaluation.shouldFollow && evaluation.targetNodeId) {
                return evaluation.targetNodeId;
            }
        }
        // If no specific connector matches, try to find a default connector
        const defaultConnection = connections.find(conn => conn.connectorType === 'default');
        return defaultConnection?.target || null;
    }
    /**
     * Evaluate a single connection
     */
    async evaluateConnection(connection, context, nodeResult) {
        // Check connector type match
        if (connection.connectorType !== nodeResult.nextConnector &&
            connection.connectorType !== 'default') {
            return {
                shouldFollow: false,
                reason: `Connector type mismatch: expected ${connection.connectorType}, got ${nodeResult.nextConnector}`
            };
        }
        // Evaluate condition if present
        if (connection.condition) {
            const conditionResult = this.evaluateCondition(connection.condition, context, nodeResult);
            if (!conditionResult) {
                return {
                    shouldFollow: false,
                    reason: `Condition failed: ${connection.condition}`
                };
            }
        }
        return {
            shouldFollow: true,
            targetNodeId: connection.target,
            reason: `Connector ${connection.connectorType} matched`
        };
    }
    /**
     * Evaluate a condition expression
     */
    evaluateCondition(condition, context, nodeResult) {
        try {
            // Simple condition evaluation (can be enhanced with a proper expression parser)
            // For now, support basic comparisons like "output.score > 0.8"
            const variables = {
                ...context.variables,
                ...context.inputData,
                output: nodeResult.output,
                input: context.inputData
            };
            // Replace variables in condition
            let evaluatedCondition = condition;
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                evaluatedCondition = evaluatedCondition.replace(regex, JSON.stringify(value));
            }
            // Use Function constructor for safe evaluation (in production, use a proper expression parser)
            return new Function(`return ${evaluatedCondition}`)();
        }
        catch (error) {
            console.warn(`Failed to evaluate condition: ${condition}`, error);
            return false;
        }
    }
    /**
     * Pause execution for async operations
     */
    async pauseExecution(executionId, reason) {
        const context = this.activeExecutions.get(executionId);
        if (!context) {
            throw new Error(`Execution ${executionId} not found`);
        }
        // Implementation depends on your async operation requirements
        // This is a placeholder for the async operation registry
    }
    /**
     * Resume paused execution
     */
    async resumeExecution(executionId, resumeData) {
        const context = this.activeExecutions.get(executionId);
        if (!context) {
            throw new Error(`Execution ${executionId} not found`);
        }
        if (resumeData) {
            Object.assign(context.variables, resumeData);
        }
        // Resume execution logic would go here
    }
    // Helper methods
    async loadWorkflow(workflowId) {
        return await this.workflowService.getWorkflow(workflowId);
    }
    getNodeConnections(workflow, nodeId) {
        return workflow.connections
            .filter(conn => conn.source === nodeId)
            .map(conn => ({
            ...conn,
            connectorType: conn.connectorType || 'default',
            priority: conn.priority || 0,
            isErrorHandler: conn.isErrorHandler || false
        }));
    }
    findNodeById(workflow, nodeId) {
        return workflow.nodes.find(node => node.id === nodeId) || null;
    }
}
exports.WorkflowExecutionEngine = WorkflowExecutionEngine;
