import { WorkflowDefinition, BaseWorkflowNode, WorkflowExecutionContext } from '@/lib/types/workflow'

export interface WorkflowExecutor {
  execute(workflow: WorkflowDefinition, context: WorkflowExecutionContext): Promise<any>
  test(workflow: WorkflowDefinition, testData: any): Promise<any>
}

export class DefaultWorkflowExecutor implements WorkflowExecutor {
  async execute(workflow: WorkflowDefinition, context: WorkflowExecutionContext): Promise<any> {
    const executionLog: any[] = []
    const startNodes = workflow.nodes.filter(n => n.type === 'start')
    
    if (startNodes.length === 0) {
      throw new Error('No start nodes found in workflow')
    }

    // Execute from each start node
    const results = await Promise.all(
      startNodes.map(startNode => 
        this.executeFromNode(workflow, startNode, context, executionLog)
      )
    )

    return {
      results,
      executionLog,
      status: 'completed',
      timestamp: new Date()
    }
  }

  async test(workflow: WorkflowDefinition, testData: any): Promise<any> {
    const testContext: WorkflowExecutionContext = {
      executionId: `test_${Date.now()}`,
      workflowId: workflow.id,
      inputData: testData,
      executionState: 'pending',
      startTime: new Date(),
      results: {
        outputData: {},
        nodeResults: {},
        dataSourceResults: {}
      },
      errors: [],
      metrics: {
        totalExecutionTime: 0,
        nodeExecutionTimes: {},
        dataSourceResponseTimes: {},
        memoryUsage: 0,
        cpuUsage: 0
      }
    }

    return this.execute(workflow, testContext)
  }

  private async executeFromNode(
    workflow: WorkflowDefinition, 
    node: BaseWorkflowNode, 
    context: WorkflowExecutionContext,
    executionLog: any[]
  ): Promise<any> {
    executionLog.push({
      nodeId: node.id,
      nodeType: node.type,
      nodeLabel: node.data?.label || `${node.type} Node`,
      timestamp: new Date(),
      status: 'started'
    })

    try {
      // Execute the node
      const nodeResult = await this.executeNode(node, context)
      
      executionLog.push({
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: node.data?.label || `${node.type} Node`,
        timestamp: new Date(),
        status: 'completed',
        result: nodeResult
      })

      // If this is an end node, return the result
      if (node.type === 'end') {
        return nodeResult
      }

      // Find next nodes to execute
      const outgoingConnections = workflow.connections.filter(c => c.source === node.id)
      
      if (outgoingConnections.length === 0) {
        return nodeResult
      }

      // Execute next nodes based on connections
      const nextResults = await Promise.all(
        outgoingConnections.map(async connection => {
          const nextNode = workflow.nodes.find(n => n.id === connection.target)
          if (!nextNode) {
            throw new Error(`Target node ${connection.target} not found`)
          }

          // Check connection conditions
          if (await this.shouldFollowConnection(connection, nodeResult, context)) {
            return this.executeFromNode(workflow, nextNode, context, executionLog)
          }
          
          return null
        })
      )

      return nextResults.filter(result => result !== null)

    } catch (error) {
      executionLog.push({
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: node.data?.label || `${node.type} Node`,
        timestamp: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  private async executeNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    switch (node.type) {
      case 'start':
        return this.executeStartNode(node, context)
      
      case 'end':
        return this.executeEndNode(node, context)
      
      case 'condition':
        return this.executeConditionNode(node, context)
      
      case 'action':
        return this.executeActionNode(node, context)
      
      case 'data_source':
        return this.executeDataSourceNode(node, context)
      
      case 'rule_set':
        return this.executeRuleSetNode(node, context)
      
      case 'decision':
        return this.executeDecisionNode(node, context)
      
      case 'validation':
        return this.executeValidationNode(node, context)
      
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private async executeStartNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    return {
      type: 'start',
      data: context.inputData,
      timestamp: new Date()
    }
  }

  private async executeEndNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    return {
      type: 'end',
      data: context.inputData,
      timestamp: new Date()
    }
  }

  private async executeConditionNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    const conditions = node.data.conditions || []
    const results = conditions.map(condition => {
      return this.evaluateCondition(condition, context)
    })

    const allTrue = results.every(r => r)
    const anyTrue = results.some(r => r)

    return {
      type: 'condition',
      allConditionsTrue: allTrue,
      anyConditionTrue: anyTrue,
      conditionResults: results,
      data: context.inputData
    }
  }

  private async executeActionNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    const businessLogic = node.data.businessLogic
    
    if (!businessLogic) {
      throw new Error('Action node has no business logic defined')
    }

    // In a real implementation, this would execute the actual business logic
    // For now, we'll simulate the execution
    const result = await this.executeBusinessLogic(businessLogic, context)

    return {
      type: 'action',
      result,
      data: context.inputData
    }
  }

  private async executeDataSourceNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    const dataSource = node.data.dataSource
    
    if (!dataSource) {
      throw new Error('Data source node has no data source defined')
    }

    // Simulate data fetching
    const data = await this.fetchData(dataSource, context)

    // Update context with fetched data
    context.results.outputData = { ...context.results.outputData, ...data }

    return {
      type: 'data_source',
      fetchedData: data,
      data: context.results.outputData
    }
  }

  private async executeRuleSetNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    const rules = node.data.rules || []
    const ruleResults = rules.map(rule => {
      return this.evaluateRule(rule, context)
    })

    return {
      type: 'rule_set',
      ruleResults,
      data: context.inputData
    }
  }

  private async executeDecisionNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    const businessLogic = node.data.businessLogic
    
    if (!businessLogic) {
      throw new Error('Decision node has no business logic defined')
    }

    const decision = await this.executeBusinessLogic(businessLogic, context)

    return {
      type: 'decision',
      decision,
      data: context.inputData
    }
  }

  private async executeValidationNode(node: BaseWorkflowNode, context: WorkflowExecutionContext): Promise<any> {
    const validation = node.data.validation
    
    if (!validation) {
      throw new Error('Validation node has no validation defined')
    }

    const isValid = await this.validateData(validation, context)

    return {
      type: 'validation',
      isValid,
      data: context.inputData
    }
  }

  private evaluateCondition(condition: any, context: WorkflowExecutionContext): boolean {
    const { field, operator, value } = condition
    const fieldValue = this.getFieldValue(field, context)

    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'not_equals':
        return fieldValue !== value
      case 'greater_than':
        return fieldValue > value
      case 'less_than':
        return fieldValue < value
      case 'contains':
        return String(fieldValue).includes(String(value))
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null
      default:
        return false
    }
  }

  private evaluateRule(rule: any, context: WorkflowExecutionContext): any {
    // Simulate rule evaluation
    return {
      ruleId: rule.id,
      passed: true,
      result: 'Rule passed'
    }
  }

  private async executeBusinessLogic(businessLogic: any, context: WorkflowExecutionContext): Promise<any> {
    // In a real implementation, this would execute the actual business logic
    // This could involve calling external services, running custom code, etc.
    
    switch (businessLogic.type) {
      case 'custom':
        // Execute custom implementation
        return { result: 'Custom logic executed', implementation: businessLogic.implementation }
      
      case 'service_call':
        // Call external service
        return { result: 'Service called', service: businessLogic.service }
      
      default:
        return { result: 'Default logic executed' }
    }
  }

  private async fetchData(dataSource: any, context: WorkflowExecutionContext): Promise<any> {
    // Simulate data fetching based on data source type
    switch (dataSource.type) {
      case 'api':
        // Simulate API call
        return { 
          source: 'api',
          url: dataSource.url,
          data: { fetched: true, timestamp: new Date() }
        }
      
      case 'database':
        // Simulate database query
        return {
          source: 'database',
          query: dataSource.query,
          data: { records: [], count: 0 }
        }
      
      case 'file':
        // Simulate file read
        return {
          source: 'file',
          path: dataSource.path,
          data: { content: 'file content' }
        }
      
      default:
        return { source: 'unknown', data: {} }
    }
  }

  private async validateData(validation: any, context: WorkflowExecutionContext): Promise<boolean> {
    // Simulate data validation
    switch (validation.type) {
      case 'schema':
        // Validate against schema
        return true // Simplified
      
      case 'custom':
        // Custom validation logic
        return true // Simplified
      
      default:
        return true
    }
  }

  private async shouldFollowConnection(connection: any, nodeResult: any, context: WorkflowExecutionContext): Promise<boolean> {
    // Check if connection has conditions
    if (!connection.conditions || connection.conditions.length === 0) {
      return true
    }

    // Evaluate connection conditions
    return connection.conditions.every((condition: any) => {
      return this.evaluateCondition(condition, context)
    })
  }

  private getFieldValue(field: string, context: WorkflowExecutionContext): any {
    // Support nested field access like "data.user.name"
    const parts = field.split('.')
    let value: any = context

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }

    return value
  }
}