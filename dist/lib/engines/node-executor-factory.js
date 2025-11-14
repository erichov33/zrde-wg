"use strict";
/**
 * Node Executor Factory
 *
 * Creates appropriate executors for different node types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeExecutorFactory = void 0;
const start_node_executor_1 = require("./executors/start-node-executor");
const condition_node_executor_1 = require("./executors/condition-node-executor");
const action_node_executor_1 = require("./executors/action-node-executor");
const end_node_executor_1 = require("./executors/end-node-executor");
const data_source_node_executor_1 = require("./executors/data-source-node-executor");
const rule_set_node_executor_1 = require("./executors/rule-set-node-executor");
const decision_node_executor_1 = require("./executors/decision-node-executor");
/**
 * Factory for creating node executors
 */
class NodeExecutorFactory {
    constructor() {
        this.executors = new Map();
        this.registerDefaultExecutors();
    }
    /**
     * Register default node executors
     */
    registerDefaultExecutors() {
        this.executors.set('start', start_node_executor_1.StartNodeExecutor);
        this.executors.set('condition', condition_node_executor_1.ConditionNodeExecutor);
        this.executors.set('action', action_node_executor_1.ActionNodeExecutor);
        this.executors.set('end', end_node_executor_1.EndNodeExecutor);
        this.executors.set('data_source', data_source_node_executor_1.DataSourceNodeExecutor);
        this.executors.set('rule_set', rule_set_node_executor_1.RuleSetNodeExecutor);
        this.executors.set('decision', decision_node_executor_1.DecisionNodeExecutor);
    }
    /**
     * Register a custom node executor
     */
    registerExecutor(nodeType, executorClass) {
        this.executors.set(nodeType, executorClass);
    }
    /**
     * Create an executor for a given node
     */
    createExecutor(node) {
        const ExecutorClass = this.executors.get(node.type);
        if (!ExecutorClass) {
            throw new Error(`No executor found for node type: ${node.type}`);
        }
        return new ExecutorClass(node);
    }
    /**
     * Get all registered node types
     */
    getRegisteredNodeTypes() {
        return Array.from(this.executors.keys());
    }
}
exports.NodeExecutorFactory = NodeExecutorFactory;
