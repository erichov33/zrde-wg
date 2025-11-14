/**
 * Node Executor Factory
 * 
 * Creates appropriate executors for different node types
 */

import { WorkflowNode } from '../types/unified-workflow'
import { ExecutableNode } from '../types/execution-contracts'
import { StartNodeExecutor } from './executors/start-node-executor'
import { ConditionNodeExecutor } from './executors/condition-node-executor'
import { ActionNodeExecutor } from './executors/action-node-executor'
import { EndNodeExecutor } from './executors/end-node-executor'
import { DataSourceNodeExecutor } from './executors/data-source-node-executor'
import { RuleSetNodeExecutor } from './executors/rule-set-node-executor'
import { DecisionNodeExecutor } from './executors/decision-node-executor'

/**
 * Factory for creating node executors
 */
export class NodeExecutorFactory {
  private executors = new Map<string, new (node: WorkflowNode) => ExecutableNode>()

  constructor() {
    this.registerDefaultExecutors()
  }

  /**
   * Register default node executors
   */
  private registerDefaultExecutors(): void {
    this.executors.set('start', StartNodeExecutor)
    this.executors.set('condition', ConditionNodeExecutor)
    this.executors.set('action', ActionNodeExecutor)
    this.executors.set('end', EndNodeExecutor)
    this.executors.set('data_source', DataSourceNodeExecutor)
    this.executors.set('rule_set', RuleSetNodeExecutor)
    this.executors.set('decision', DecisionNodeExecutor)
  }

  /**
   * Register a custom node executor
   */
  registerExecutor(nodeType: string, executorClass: new (node: WorkflowNode) => ExecutableNode): void {
    this.executors.set(nodeType, executorClass)
  }

  /**
   * Create an executor for a given node
   */
  createExecutor(node: WorkflowNode): ExecutableNode {
    const ExecutorClass = this.executors.get(node.type)
    
    if (!ExecutorClass) {
      throw new Error(`No executor found for node type: ${node.type}`)
    }

    return new ExecutorClass(node)
  }

  /**
   * Get all registered node types
   */
  getRegisteredNodeTypes(): string[] {
    return Array.from(this.executors.keys())
  }
}