/**
 * Action Node Executor
 * 
 * Executes action nodes that perform specific operations
 */

import { BaseNodeExecutor } from './base-node-executor'
import {
  WorkflowExecutionContext,
  NodeExecutionResult,
  ValidationResult
} from '../../types/execution-contracts'

/**
 * Executor for action nodes
 */
export class ActionNodeExecutor extends BaseNodeExecutor {
  async execute(context: WorkflowExecutionContext): Promise<NodeExecutionResult> {
    try {
      this.log('info', `Executing action node: ${this.node.id}`, { 
        actionType: this.getConfig('actionType'),
        label: this.node.data.label 
      })

      const actionType = this.getConfig('actionType', 'default')
      const actionConfig = this.getConfig('actionConfig', {})

      // Execute the specific action based on type
      const result = await this.executeAction(actionType, actionConfig, context)

      // Update context with action results
      this.updateContext(context, {
        [`action_${this.node.id}_result`]: result,
        [`action_${this.node.id}_status`]: 'completed',
        [`action_${this.node.id}_timestamp`]: new Date().toISOString()
      })

      return this.createSuccessResult(result, 'default')
    } catch (error) {
      this.log('error', `Action execution failed: ${this.node.id}`, error)
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Action execution failed'
      )
    }
  }

  /**
   * Execute specific action based on type
   */
  private async executeAction(
    actionType: string,
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    switch (actionType) {
      case 'credit_check':
        return this.executeCreditCheck(config, context)
      
      case 'income_verification':
        return this.executeIncomeVerification(config, context)
      
      case 'debt_calculation':
        return this.executeDebtCalculation(config, context)
      
      case 'risk_assessment':
        return this.executeRiskAssessment(config, context)
      
      case 'document_request':
        return this.executeDocumentRequest(config, context)
      
      case 'notification':
        return this.executeNotification(config, context)
      
      case 'data_update':
        return this.executeDataUpdate(config, context)
      
      default:
        return this.executeDefaultAction(config, context)
    }
  }

  /**
   * Execute credit check action
   */
  private async executeCreditCheck(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate credit check
    const applicantId = context.variables.applicantId || 'unknown'
    const creditScore = Math.floor(Math.random() * 400) + 300 // 300-700 range
    
    return {
      creditScore,
      creditHistory: {
        accounts: Math.floor(Math.random() * 10) + 1,
        delinquencies: Math.floor(Math.random() * 3),
        inquiries: Math.floor(Math.random() * 5)
      },
      provider: config.provider || 'default_bureau',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Execute income verification action
   */
  private async executeIncomeVerification(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate income verification
    const baseIncome = context.variables.statedIncome || 50000
    const verificationMethod = config.method || 'document_review'
    
    return {
      verifiedIncome: baseIncome * (0.8 + Math.random() * 0.4), // ±20% variance
      verificationMethod,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      documents: ['pay_stub', 'tax_return'],
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Execute debt calculation action
   */
  private async executeDebtCalculation(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate debt calculation
    const income = context.variables.verifiedIncome || context.variables.statedIncome || 50000
    const existingDebt = Math.random() * income * 0.5 // Up to 50% of income
    
    return {
      totalDebt: existingDebt,
      monthlyDebtPayments: existingDebt * 0.03, // Assume 3% monthly payment
      debtToIncomeRatio: existingDebt / income,
      categories: {
        creditCards: existingDebt * 0.4,
        autoLoans: existingDebt * 0.3,
        studentLoans: existingDebt * 0.2,
        other: existingDebt * 0.1
      },
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Execute risk assessment action
   */
  private async executeRiskAssessment(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate risk assessment
    const creditScore = context.variables.creditScore || 650
    const debtToIncomeRatio = context.variables.debtToIncomeRatio || 0.3
    
    let riskScore = 0.5
    if (creditScore > 700) riskScore -= 0.2
    if (creditScore < 600) riskScore += 0.3
    if (debtToIncomeRatio > 0.4) riskScore += 0.2
    if (debtToIncomeRatio < 0.2) riskScore -= 0.1
    
    riskScore = Math.max(0, Math.min(1, riskScore))
    
    return {
      riskScore,
      riskLevel: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
      factors: {
        creditScore: creditScore,
        debtToIncomeRatio: debtToIncomeRatio,
        employmentStability: Math.random() > 0.3
      },
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Execute document request action
   */
  private async executeDocumentRequest(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    const requestedDocs = config.documents || ['income_verification', 'identity_proof']
    
    return {
      documentsRequested: requestedDocs,
      requestMethod: config.method || 'email',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'sent',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Execute notification action
   */
  private async executeNotification(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    const notificationType = config.type || 'email'
    const message = config.message || 'Application status update'
    
    return {
      notificationType,
      message,
      recipient: context.variables.applicantEmail || 'applicant@example.com',
      status: 'sent',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Execute data update action
   */
  private async executeDataUpdate(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    const updates = config.updates || {}
    
    // Apply updates to context
    Object.entries(updates).forEach(([key, value]) => {
      context.variables[key] = value
    })
    
    return {
      updatedFields: Object.keys(updates),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Execute default action
   */
  private async executeDefaultAction(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    return {
      action: 'completed',
      config,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Validate action node configuration
   */
  protected validateNodeSpecific(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    const actionType = this.getConfig('actionType')
    if (!actionType) {
      errors.push('Action type is required')
    }

    const validActionTypes = [
      'credit_check',
      'income_verification',
      'debt_calculation',
      'risk_assessment',
      'document_request',
      'notification',
      'data_update'
    ]

    if (actionType && !validActionTypes.includes(actionType as string)) {
      warnings.push(`Unknown action type: ${actionType}`)
    }

    return { 
      isValid: errors.length === 0,
      errors, 
      warnings 
    }
  }
}