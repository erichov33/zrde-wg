import { WorkflowDefinition, BaseWorkflowNode, WorkflowValidationResult } from '@/lib/types/workflow'

export interface WorkflowValidator {
  validateStructure(workflow: WorkflowDefinition): Promise<WorkflowValidationResult[]>
  validateNode(workflow: WorkflowDefinition, node: BaseWorkflowNode): Promise<WorkflowValidationResult[]>
}

export class DefaultWorkflowValidator implements WorkflowValidator {
  async validateStructure(workflow: WorkflowDefinition): Promise<WorkflowValidationResult[]> {
    const results: WorkflowValidationResult[] = []

    // Check for required fields
    if (!workflow.name || workflow.name.trim() === '') {
      results.push({
        isValid: false,
        errors: [{
          code: 'workflow-name-required',
          message: 'Workflow name is required',
          severity: 'error' as const
        }],
        warnings: []
      })
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      results.push({
        isValid: false,
        errors: [{
          code: 'workflow-no-nodes',
          message: 'Workflow must have at least one node',
          severity: 'error' as const
        }],
        warnings: []
      })
    }

    // Check for start and end nodes
    const startNodes = workflow.nodes.filter(n => n.type === 'start')
    const endNodes = workflow.nodes.filter(n => n.type === 'end')

    if (startNodes.length === 0) {
      results.push({
        isValid: false,
        errors: [{
          code: 'workflow-no-start',
          message: 'Workflow must have at least one start node',
          severity: 'error' as const
        }],
        warnings: []
      })
    }

    if (endNodes.length === 0) {
      results.push({
        isValid: false,
        errors: [{
          code: 'workflow-no-end',
          message: 'Workflow must have at least one end node',
          severity: 'error' as const
        }],
        warnings: []
      })
    }

    // Check for orphaned nodes
    const connectedNodeIds = new Set<string>()
    workflow.connections.forEach(conn => {
      connectedNodeIds.add(conn.source)
      connectedNodeIds.add(conn.target)
    })

    workflow.nodes.forEach(node => {
      if (node.type !== 'start' && node.type !== 'end' && !connectedNodeIds.has(node.id)) {
        results.push({
          isValid: true,
          errors: [],
          warnings: [{
            code: 'node-orphaned',
            message: `Node "${node.data.label}" is not connected to the workflow`,
            nodeId: node.id
          }]
        })
      }
    })

    // Check for circular dependencies
    const circularPaths = this.detectCircularDependencies(workflow)
    circularPaths.forEach(path => {
      results.push({
        isValid: false,
        errors: [{
          code: 'circular-dependency',
          message: `Circular dependency detected: ${path.join(' → ')}`,
          nodeId: path[0],
          severity: 'error' as const
        }],
        warnings: [],
        nodeId: path[0]
      })
    })

    // Check for unreachable end nodes
    const reachableNodes = this.findReachableNodes(workflow)
    endNodes.forEach(endNode => {
      if (!reachableNodes.has(endNode.id)) {
        results.push({
          isValid: true,
          errors: [],
          warnings: [{
            code: 'unreachable-end-node',
            message: `End node "${endNode.data.label}" is not reachable from any start node`,
            nodeId: endNode.id
          }],
          nodeId: endNode.id
        })
      }
    })

    return results
  }

  async validateNode(workflow: WorkflowDefinition, node: BaseWorkflowNode): Promise<WorkflowValidationResult[]> {
    const results: WorkflowValidationResult[] = []

    // Check required fields
    if (!node.data.label || node.data.label.trim() === '') {
      results.push({
        isValid: false,
        errors: [{
          code: 'node-label-required',
          message: 'Node label is required',
          severity: 'error' as const
        }],
        warnings: [],
        nodeId: node.id
      })
    }

    if (!node.position) {
      results.push({
        isValid: false,
        errors: [{
          code: 'node-position-required',
          message: 'Node position is required',
          severity: 'error' as const
        }],
        warnings: [],
        nodeId: node.id
      })
    }

    // Type-specific validations
    switch (node.type) {
      case 'condition':
        if (!node.data.conditions || node.data.conditions.length === 0) {
          results.push({
            isValid: false,
            errors: [{
              code: 'condition-node-no-conditions',
              message: 'Condition node must have at least one condition',
              severity: 'error' as const
            }],
            warnings: [],
            nodeId: node.id
          })
        } else {
          // Validate each condition
          node.data.conditions.forEach((condition, index) => {
            if (!condition.id || !condition.expression) {
              results.push({
                isValid: false,
                errors: [{
                  code: 'condition-incomplete',
                  message: `Condition ${index + 1} is incomplete - missing id or expression`,
                  severity: 'error' as const
                }],
                warnings: [],
                nodeId: node.id
              })
            }
            
            if (!condition.description) {
              results.push({
                isValid: true,
                errors: [],
                warnings: [{
                  code: 'condition-no-description',
                  message: `Condition ${index + 1} has no description`,
                  nodeId: node.id
                }],
                nodeId: node.id
              })
            }
          })
        }
        break

      case 'data_source':
        if (!node.data.dataSource) {
          results.push({
            isValid: false,
            errors: [{
              code: 'data-source-node-no-source',
              message: 'Data source node must have a data source configured',
              severity: 'error' as const
            }],
            warnings: [],
            nodeId: node.id
          })
        } else {
          if (!node.data.dataSource.type) {
            results.push({
              isValid: false,
              errors: [{
                code: 'data-source-no-type',
                message: 'Data source type is required',
                severity: 'error' as const
              }],
              warnings: [],
              nodeId: node.id
            })
          }

          if (node.data.dataSource.type === 'custom_api' && !node.data.dataSource.endpoint) {
            results.push({
              isValid: false,
              errors: [{
                code: 'api-data-source-no-endpoint',
                message: 'API data source must have an endpoint',
                severity: 'error' as const
              }],
              warnings: [],
              nodeId: node.id
            })
          }
        }
        break

      case 'rule_set':
        if (!node.data.rules || node.data.rules.length === 0) {
          results.push({
            isValid: false,
            errors: [{
              code: 'rule-set-node-no-rules',
              message: 'Rule set node must have at least one rule',
              severity: 'error' as const
            }],
            warnings: [],
            nodeId: node.id
          })
        }
        break

      case 'action':
      case 'decision':
        if (!node.data.businessLogic) {
          results.push({
            isValid: false,
            errors: [{
              code: 'action-node-no-logic',
              message: 'Action node must have business logic defined',
              severity: 'error' as const
            }],
            warnings: [],
            nodeId: node.id
          })
        }
        break

      case 'validation':
        if (!node.data.validation) {
          results.push({
            isValid: false,
            errors: [{
              code: 'validation-node-no-validation',
              message: 'Validation node must have validation rules defined',
              severity: 'error' as const
            }],
            warnings: [],
            nodeId: node.id
          })
        }
        break
    }

    // Check connections
    const incomingConnections = workflow.connections.filter(c => c.target === node.id)
    const outgoingConnections = workflow.connections.filter(c => c.source === node.id)

    if (node.type === 'start' && incomingConnections.length > 0) {
      results.push({
        isValid: false,
        errors: [{
          code: 'start-node-incoming-connections',
          message: 'Start nodes cannot have incoming connections',
          severity: 'error' as const
        }],
        warnings: [],
        nodeId: node.id
      })
    }

    if (node.type === 'end' && outgoingConnections.length > 0) {
      results.push({
        isValid: false,
        errors: [{
          code: 'end-node-outgoing-connections',
          message: 'End nodes cannot have outgoing connections',
          severity: 'error' as const
        }],
        warnings: [],
        nodeId: node.id
      })
    }

    if (node.type !== 'start' && incomingConnections.length === 0) {
      results.push({
        isValid: true,
        errors: [],
        warnings: [{
          code: 'node-no-incoming-connections',
          message: 'Node has no incoming connections',
          nodeId: node.id
        }],
        nodeId: node.id
      })
    }

    if (node.type !== 'end' && outgoingConnections.length === 0) {
      results.push({
        isValid: true,
        errors: [],
        warnings: [{
          code: 'node-no-outgoing-connections',
          message: 'Node has no outgoing connections',
          nodeId: node.id
        }],
        nodeId: node.id
      })
    }

    return results
  }

  private detectCircularDependencies(workflow: WorkflowDefinition): string[][] {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const circularPaths: string[][] = []

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const outgoingConnections = workflow.connections.filter(c => c.source === nodeId)
      
      for (const connection of outgoingConnections) {
        const targetId = connection.target
        
        if (!visited.has(targetId)) {
          dfs(targetId, [...path])
        } else if (recursionStack.has(targetId)) {
          // Found a cycle
          const cycleStart = path.indexOf(targetId)
          if (cycleStart !== -1) {
            circularPaths.push([...path.slice(cycleStart), targetId])
          }
        }
      }

      recursionStack.delete(nodeId)
    }

    workflow.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, [])
      }
    })

    return circularPaths
  }

  private findReachableNodes(workflow: WorkflowDefinition): Set<string> {
    const reachable = new Set<string>()
    const startNodes = workflow.nodes.filter(n => n.type === 'start')

    const dfs = (nodeId: string): void => {
      if (reachable.has(nodeId)) return
      
      reachable.add(nodeId)
      
      const outgoingConnections = workflow.connections.filter(c => c.source === nodeId)
      outgoingConnections.forEach(connection => {
        dfs(connection.target)
      })
    }

    startNodes.forEach(startNode => {
      dfs(startNode.id)
    })

    return reachable
  }
}