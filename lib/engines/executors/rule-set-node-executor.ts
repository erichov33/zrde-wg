/**
 * Rule Set Node Executor
 * 
 * Executes rule set nodes that evaluate business rules
 */

import { BaseNodeExecutor } from './base-node-executor'
import {
  WorkflowExecutionContext,
  NodeExecutionResult,
  ValidationResult
} from '../../types/execution-contracts'
import { RuleEngine } from '../rule-engine'
import type { RuleSet, Rule, ApplicationData, ExternalData } from '../rule-engine'

/**
 * Executor for rule set nodes
 */
export class RuleSetNodeExecutor extends BaseNodeExecutor {
  async execute(context: WorkflowExecutionContext): Promise<NodeExecutionResult> {
    try {
      this.log('info', `Executing rule set node: ${this.node.id}`, { 
        ruleSetId: this.getConfig('ruleSetId'),
        label: this.node.data.label 
      })

      const ruleSetId = this.getConfig<string | undefined>('ruleSetId', undefined)
      const ruleSet = this.getConfig<RuleSet | undefined>('ruleSet', undefined)
      const rules = this.getConfig<Rule[]>('rules', [])

      // Validate that we have either a rule set or individual rules
      if (!ruleSetId && !ruleSet && rules.length === 0) {
        throw new Error('No rules or rule set configured')
      }

      // Extract application and external data from context
      const applicationData = this.extractApplicationData(context)
      const externalData = this.extractExternalData(context)

      // Create rule execution context
      const ruleContext = {
        applicationData,
        externalData,
        userContext: context.metadata.userId
          ? { userId: context.metadata.userId, roles: [], permissions: [] }
          : undefined,
        metadata: context.metadata
      }

      let result
      if (ruleSet) {
        // Execute a complete rule set
        result = RuleEngine.executeRuleSet(ruleSet, ruleContext)
      } else if (rules.length > 0) {
        // Execute individual rules
        const ruleResults = []
        for (const rule of rules) {
          const ruleResult = RuleEngine.executeRule(rule, ruleContext)
          ruleResults.push(ruleResult)
        }
        
        // Aggregate results
        result = this.aggregateRuleResults(ruleResults)
      } else {
        throw new Error('No valid rule configuration found')
      }

      // Determine next connector based on result
      const nextConnector = this.determineNextConnector(result)

      // Update context with rule execution results
      this.updateContext(context, {
        [`ruleset_${this.node.id}_result`]: result,
        [`ruleset_${this.node.id}_decision`]: result.decision,
        [`ruleset_${this.node.id}_score`]: result.score,
        [`ruleset_${this.node.id}_timestamp`]: new Date().toISOString()
      })

      return this.createSuccessResult(result, nextConnector)
    } catch (error) {
      this.log('error', `Rule set execution failed: ${this.node.id}`, error)
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Rule set execution failed'
      )
    }
  }

  /**
   * Extract application data from workflow context
   */
  private extractApplicationData(context: WorkflowExecutionContext): ApplicationData {
    const v = context.variables as Record<string, any>

    const personalInfo = {
      firstName: String(v.firstName ?? ''),
      lastName: String(v.lastName ?? ''),
      email: String(v.email ?? ''),
      phone: String(v.phone ?? ''),
      dateOfBirth: String(v.dateOfBirth ?? ''),
      ssn: v.ssn as string | undefined
    }

    const financialInfo = {
      annualIncome: Number(v.annualIncome ?? v.statedIncome ?? 0),
      employmentStatus: String(v.employmentStatus ?? ''),
      monthlyDebt: Number(v.monthlyDebt ?? v.totalDebt ?? 0),
      requestedAmount: Number(v.requestedAmount ?? 0)
    }

    const addr = v.address ?? {}
    const address = {
      street: String(addr.street ?? ''),
      city: String(addr.city ?? ''),
      state: String(addr.state ?? ''),
      zipCode: String(addr.zipCode ?? ''),
      country: String(addr.country ?? '')
    }

    // Include all other variables to allow rules referencing additional fields
    return {
      personalInfo,
      financialInfo,
      address,
      ...v
    }
  }

  /**
   * Extract external data from workflow context
   */
  private extractExternalData(context: WorkflowExecutionContext): ExternalData {
    const v = context.variables as Record<string, any>
    const externalData: ExternalData = {}

    // Credit data
    if (v.creditScore !== undefined) {
      externalData.creditScore = Number(v.creditScore)
    }
    if (v.creditHistory) {
      externalData.creditHistory = v.creditHistory
    }

    // Income verification data
    if (v.verifiedIncome !== undefined) {
      externalData.incomeVerification = {
        verified: Boolean(v.verifiedIncome),
        monthlyIncome: Number(v.monthlyIncome ?? v.annualIncome ? Number(v.annualIncome) / 12 : 0),
        employmentVerified: Boolean(v.employmentVerified ?? false),
        employer: String(v.employerName ?? '')
      }
    }

    // KYC data
    if (v.identityVerification) {
      externalData.kycStatus = {
        status: v.identityVerification.status ?? 'pending',
        documentType: v.identityVerification.documentType ?? '',
        verificationLevel: v.identityVerification.verificationLevel ?? ''
      }
    }

    // Fraud/risk data
    if (v.fraudScore !== undefined) {
      externalData.fraudScore = Number(v.fraudScore)
    }

    // Allow any additional fields
    for (const [key, value] of Object.entries(v)) {
      if (!(key in externalData)) {
        (externalData as any)[key] = value
      }
    }

    return externalData
  }

  /**
   * Aggregate results from multiple rule executions
   */
  private aggregateRuleResults(ruleResults: any[]): any {
    let approvedCount = 0
    let declinedCount = 0
    let reviewCount = 0
    let totalScore = 0

    const executedRules = ruleResults.map(result => {
      totalScore += result.score || 0
      
      switch (result.decision) {
        case 'approved':
          approvedCount++
          break
        case 'declined':
          declinedCount++
          break
        case 'review':
          reviewCount++
          break
      }

      return {
        ruleId: result.ruleId,
        decision: result.decision,
        score: result.score,
        reason: result.reason,
        conditions: result.conditions
      }
    })

    // Determine overall decision
    let overallDecision = 'approved'
    if (declinedCount > 0) {
      overallDecision = 'declined'
    } else if (reviewCount > 0) {
      overallDecision = 'review'
    }

    const averageScore = ruleResults.length > 0 ? totalScore / ruleResults.length : 0

    return {
      decision: overallDecision,
      score: averageScore,
      executedRules,
      summary: {
        totalRules: ruleResults.length,
        approved: approvedCount,
        declined: declinedCount,
        review: reviewCount
      },
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Determine next connector based on rule execution result
   */
  private determineNextConnector(result: any): string {
    const decision = result.decision || 'approved'
    
    switch (decision) {
      case 'approved':
        return 'approved'
      case 'declined':
        return 'declined'
      case 'review':
        return 'review'
      default:
        return 'default'
    }
  }

  /**
   * Validate rule set node configuration
   */
  protected validateNodeSpecific(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    const ruleSetId = this.getConfig('ruleSetId')
    const ruleSet = this.getConfig('ruleSet')
    const rules = this.getConfig('rules', [])

    if (!ruleSetId && !ruleSet && rules.length === 0) {
      errors.push('Rule set ID, rule set configuration, or individual rules are required')
    }

    if (ruleSet) {
      const ruleSetAny = ruleSet as any
      if (!ruleSetAny.id) {
        errors.push('Rule set must have an ID')
      }
      if (!ruleSetAny.rules || !Array.isArray(ruleSetAny.rules)) {
        errors.push('Rule set must contain an array of rules')
      }
    }

    if (rules.length > 0) {
      rules.forEach((rule: any, index: number) => {
        if (!rule.id) {
          errors.push(`Rule at index ${index} must have an ID`)
        }
        if (!rule.conditions || !Array.isArray(rule.conditions)) {
          errors.push(`Rule at index ${index} must have conditions`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}