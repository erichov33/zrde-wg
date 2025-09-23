import { z } from "zod"

// Enhanced type definitions to replace 'any' types
export interface ApplicationData {
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: string
    ssn?: string
  }
  financialInfo: {
    annualIncome: number
    employmentStatus: string
    monthlyDebt: number
    requestedAmount: number
  }
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  [key: string]: unknown // Allow additional fields
}

export interface ExternalData {
  creditScore?: number
  creditHistory?: CreditHistoryData
  fraudScore?: number
  incomeVerification?: IncomeVerificationData
  kycStatus?: KYCData
  [key: string]: unknown
}

export interface CreditHistoryData {
  score: number
  paymentHistory: string
  creditUtilization: number
  lengthOfHistory: number
  newCredit: number
  creditMix: number
}

export interface IncomeVerificationData {
  verified: boolean
  monthlyIncome: number
  employmentVerified: boolean
  employer: string
}

export interface KYCData {
  status: "verified" | "pending" | "failed"
  documentType: string
  verificationLevel: string
}

export interface UserContext {
  userId: string
  roles: string[]
  permissions: string[]
}

export interface RuleActionValue {
  score?: number
  flag?: string
  document?: string
  message?: string
  [key: string]: unknown
}

// Rule Types and Schemas
export const OperatorSchema = z.enum([
  "equals", "not_equals", "greater_than", "less_than", 
  "greater_than_or_equal", "less_than_or_equal", 
  "contains", "not_contains", "starts_with", "ends_with",
  "in", "not_in", "between", "is_null", "is_not_null"
])

export const DataTypeSchema = z.enum([
  "string", "number", "boolean", "date", "array", "object"
])

export const ConditionSchema = z.object({
  id: z.string(),
  field: z.string(),
  operator: OperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.unknown()), z.null()]),
  dataType: DataTypeSchema,
  description: z.string().optional()
})

export const RuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priority: z.number().default(0),
  enabled: z.boolean().default(true),
  conditions: z.array(ConditionSchema),
  logicalOperator: z.enum(["AND", "OR"]).default("AND"),
  actions: z.array(z.object({
    type: z.enum(["approve", "decline", "review", "set_score", "add_flag", "require_document"]),
    value: z.union([z.string(), z.number(), z.object({}).passthrough()]).optional(),
    message: z.string().optional()
  })),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
    version: z.string()
  }).optional()
})

export const RuleSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  rules: z.array(RuleSchema),
  executionOrder: z.enum(["priority", "sequential", "parallel"]).default("priority"),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
    version: z.string()
  }).optional()
})

export type Operator = z.infer<typeof OperatorSchema>
export type DataType = z.infer<typeof DataTypeSchema>
export type Condition = z.infer<typeof ConditionSchema>
export type Rule = z.infer<typeof RuleSchema>
export type RuleSet = z.infer<typeof RuleSetSchema>

// Updated interfaces with proper typing
export interface RuleExecutionContext {
  applicationData: ApplicationData
  externalData?: ExternalData
  userContext?: UserContext
  metadata?: Record<string, unknown>
}

export interface RuleExecutionResult {
  ruleId: string
  ruleName: string
  matched: boolean
  actions: Array<{
    type: string
    value?: RuleActionValue
    message?: string
  }>
  executionTime: number
  conditions: Array<{
    conditionId: string
    field: string
    operator: string
    expectedValue: unknown
    actualValue: unknown
    matched: boolean
  }>
}

export interface RuleSetExecutionResult {
  ruleSetId: string
  ruleSetName: string
  totalExecutionTime: number
  rulesExecuted: number
  rulesMatched: number
  results: RuleExecutionResult[]
  finalDecision: {
    outcome: "approved" | "declined" | "review"
    score?: number
    flags: string[]
    requiredDocuments: string[]
    messages: string[]
  }
}

// Core Rule Engine
export class RuleEngine {
  private static evaluateCondition(
    condition: Condition, 
    context: RuleExecutionContext
  ): { matched: boolean; actualValue: any } {
    const actualValue = this.getFieldValue(condition.field, context)
    const expectedValue = condition.value
    
    let matched = false
    
    switch (condition.operator) {
      case "equals":
        matched = actualValue === expectedValue
        break
      case "not_equals":
        matched = actualValue !== expectedValue
        break
      case "greater_than":
        matched = Number(actualValue) > Number(expectedValue)
        break
      case "less_than":
        matched = Number(actualValue) < Number(expectedValue)
        break
      case "greater_than_or_equal":
        matched = Number(actualValue) >= Number(expectedValue)
        break
      case "less_than_or_equal":
        matched = Number(actualValue) <= Number(expectedValue)
        break
      case "contains":
        matched = String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase())
        break
      case "not_contains":
        matched = !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase())
        break
      case "starts_with":
        matched = String(actualValue).toLowerCase().startsWith(String(expectedValue).toLowerCase())
        break
      case "ends_with":
        matched = String(actualValue).toLowerCase().endsWith(String(expectedValue).toLowerCase())
        break
      case "in":
        matched = Array.isArray(expectedValue) && expectedValue.includes(actualValue)
        break
      case "not_in":
        matched = Array.isArray(expectedValue) && !expectedValue.includes(actualValue)
        break
      case "between":
        if (Array.isArray(expectedValue) && expectedValue.length === 2) {
          const [min, max] = expectedValue
          matched = Number(actualValue) >= Number(min) && Number(actualValue) <= Number(max)
        }
        break
      case "is_null":
        matched = actualValue === null || actualValue === undefined
        break
      case "is_not_null":
        matched = actualValue !== null && actualValue !== undefined
        break
      default:
        matched = false
    }
    
    return { matched, actualValue }
  }
  
  private static getFieldValue(fieldPath: string, context: RuleExecutionContext): any {
    const paths = fieldPath.split('.')
    let value: any = context.applicationData
    
    for (const path of paths) {
      if (value && typeof value === 'object' && path in value) {
        value = (value as any)[path]
      } else {
        // Check external data if not found in application data
        if (context.externalData && path in context.externalData) {
          value = (context.externalData as any)[path]
        } else {
          return undefined
        }
      }
    }
    
    return value
  }
  
  static executeRule(rule: Rule, context: RuleExecutionContext): RuleExecutionResult {
    const startTime = Date.now()
    const conditionResults: RuleExecutionResult['conditions'] = []
    
    // Evaluate all conditions
    for (const condition of rule.conditions) {
      const { matched, actualValue } = this.evaluateCondition(condition, context)
      conditionResults.push({
        conditionId: condition.id,
        field: condition.field,
        operator: condition.operator,
        expectedValue: condition.value,
        actualValue,
        matched
      })
    }
    
    // Apply logical operator
    let ruleMatched: boolean
    if (rule.logicalOperator === "AND") {
      ruleMatched = conditionResults.every(c => c.matched)
    } else { // OR
      ruleMatched = conditionResults.some(c => c.matched)
    }
    
    const executionTime = Date.now() - startTime
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: ruleMatched,
      actions: ruleMatched ? rule.actions.map(action => ({
        type: action.type,
        value: typeof action.value === 'object' ? action.value as RuleActionValue : 
               action.value !== undefined ? { value: action.value } as RuleActionValue : 
               undefined,
        message: action.message
      })) : [],
      executionTime,
      conditions: conditionResults
    }
  }
  
  static executeRuleSet(ruleSet: RuleSet, context: RuleExecutionContext): RuleSetExecutionResult {
    const startTime = Date.now()
    const results: RuleExecutionResult[] = []
    
    // Sort rules by priority if needed
    const rulesToExecute = ruleSet.executionOrder === "priority" 
      ? [...ruleSet.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0))
      : [...ruleSet.rules]
    
    // Execute rules
    for (const rule of rulesToExecute) {
      if (rule.enabled) {
        const result = this.executeRule(rule, context)
        results.push(result)
      }
    }
    
    // Aggregate results into final decision
    const finalDecision = this.aggregateDecision(results)
    const totalExecutionTime = Date.now() - startTime
    
    return {
      ruleSetId: ruleSet.id,
      ruleSetName: ruleSet.name,
      totalExecutionTime,
      rulesExecuted: results.length,
      rulesMatched: results.filter(r => r.matched).length,
      results,
      finalDecision
    }
  }
  
  private static aggregateDecision(results: RuleExecutionResult[]): RuleSetExecutionResult['finalDecision'] {
    const decision: RuleSetExecutionResult['finalDecision'] = {
      outcome: "review",
      score: 0,
      flags: [],
      requiredDocuments: [],
      messages: []
    }
    
    let approveCount = 0
    let declineCount = 0
    let reviewCount = 0
    
    for (const result of results) {
      if (result.matched) {
        for (const action of result.actions) {
          switch (action.type) {
            case "approve":
              approveCount++
              if (action.message) decision.messages.push(action.message)
              break
            case "decline":
              declineCount++
              if (action.message) decision.messages.push(action.message)
              break
            case "review":
              reviewCount++
              if (action.message) decision.messages.push(action.message)
              break
            case "set_score":
              if (typeof action.value === 'number') {
                decision.score = Math.max(decision.score || 0, action.value)
              }
              break
            case "add_flag":
              if (action.value) {
                let flagValue: string | undefined
                if (typeof action.value === 'object') {
                  flagValue = (action.value as any).flag || (action.value as any).value
                } else {
                  flagValue = String(action.value)
                }
                if (flagValue && !decision.flags.includes(flagValue)) {
                  decision.flags.push(flagValue)
                }
              }
              break
            case "require_document":
              if (action.value) {
                let docValue: string | undefined
                if (typeof action.value === 'object') {
                  docValue = (action.value as any).document || (action.value as any).value
                } else {
                  docValue = String(action.value)
                }
                if (docValue && !decision.requiredDocuments.includes(docValue)) {
                  decision.requiredDocuments.push(docValue)
                }
              }
              break
          }
        }
      }
    }
    
    // Determine final outcome
    if (declineCount > 0) {
      decision.outcome = "declined"
    } else if (approveCount > 0 && reviewCount === 0) {
      decision.outcome = "approved"
    } else {
      decision.outcome = "review"
    }
    
    return decision
  }
  
  // Utility methods for rule validation
  static validateRule(rule: any): { valid: boolean; errors: string[] } {
    try {
      RuleSchema.parse(rule)
      return { valid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          valid: false, 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }
      }
      return { valid: false, errors: ['Unknown validation error'] }
    }
  }
  
  static validateRuleSet(ruleSet: any): { valid: boolean; errors: string[] } {
    try {
      RuleSetSchema.parse(ruleSet)
      return { valid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          valid: false, 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }
      }
      return { valid: false, errors: ['Unknown validation error'] }
    }
  }
}

// Predefined rule templates for common underwriting scenarios
export const RuleTemplates = {
  creditScore: {
    highCredit: {
      id: "high-credit-score",
      name: "High Credit Score Auto-Approval",
      description: "Automatically approve applications with credit scores above 750",
      priority: 100,
      enabled: true,
      conditions: [
        {
          id: "credit-score-check",
          field: "externalData.creditScore",
          operator: "greater_than_or_equal" as Operator,
          value: 750,
          dataType: "number" as DataType,
          description: "Credit score must be 750 or higher"
        }
      ],
      logicalOperator: "AND" as const,
      actions: [
        {
          type: "approve",
          message: "Auto-approved due to excellent credit score"
        },
        {
          type: "set_score",
          value: 95
        }
      ]
    },
    lowCredit: {
      id: "low-credit-score",
      name: "Low Credit Score Decline",
      description: "Decline applications with credit scores below 500",
      priority: 90,
      enabled: true,
      conditions: [
        {
          id: "low-credit-check",
          field: "externalData.creditScore",
          operator: "less_than" as Operator,
          value: 500,
          dataType: "number" as DataType,
          description: "Credit score below minimum threshold"
        }
      ],
      logicalOperator: "AND" as const,
      actions: [
        {
          type: "decline",
          message: "Credit score below minimum requirements"
        },
        {
          type: "add_flag",
          value: "low_credit_score"
        }
      ]
    }
  },
  
  income: {
    debtToIncomeRatio: {
      id: "debt-to-income-ratio",
      name: "Debt-to-Income Ratio Check",
      description: "Review applications with high debt-to-income ratios",
      priority: 80,
      enabled: true,
      conditions: [
        {
          id: "dti-ratio-check",
          field: "calculatedFields.debtToIncomeRatio",
          operator: "greater_than" as Operator,
          value: 0.4,
          dataType: "number" as DataType,
          description: "Debt-to-income ratio above 40%"
        }
      ],
      logicalOperator: "AND" as const,
      actions: [
        {
          type: "review",
          message: "High debt-to-income ratio requires manual review"
        },
        {
          type: "require_document",
          value: "income_verification"
        },
        {
          type: "add_flag",
          value: "high_dti"
        }
      ]
    }
  },
  
  fraud: {
    velocityCheck: {
      id: "application-velocity",
      name: "Application Velocity Check",
      description: "Flag multiple applications from same user in short timeframe",
      priority: 95,
      enabled: true,
      conditions: [
        {
          id: "velocity-check",
          field: "externalData.applicationCount24h",
          operator: "greater_than" as Operator,
          value: 3,
          dataType: "number" as DataType,
          description: "More than 3 applications in 24 hours"
        }
      ],
      logicalOperator: "AND" as const,
      actions: [
        {
          type: "review",
          message: "Multiple applications detected - potential fraud"
        },
        {
          type: "add_flag",
          value: "velocity_fraud"
        },
        {
          type: "require_document",
          value: "identity_verification"
        }
      ]
    }
  }
}