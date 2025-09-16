import { RuleEngine, RuleSet, RuleExecutionContext, RuleSetExecutionResult } from "@/lib/engines/rule-engine"
import { DecisionRequest, DecisionResponse } from "./decision-service"

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  ruleSet: RuleSet
  dataRequirements: {
    required: string[]
    optional: string[]
    external: string[]
  }
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    status: "draft" | "active" | "deprecated"
  }
}

export interface ExternalDataSource {
  id: string
  name: string
  type: "credit_bureau" | "kyc_provider" | "fraud_service" | "income_verification" | "custom"
  endpoint: string
  apiKey?: string
  timeout: number
  retries: number
  enabled: boolean
}

export interface SimulationRequest {
  workflowId: string
  testData: any
  externalDataOverrides?: Record<string, any>
  ruleOverrides?: {
    disabledRules: string[]
    modifiedRules: Array<{
      ruleId: string
      modifications: any
    }>
  }
}

export interface SimulationResult {
  simulationId: string
  workflowId: string
  executionResult: RuleSetExecutionResult
  testData: any
  externalData: Record<string, any>
  timestamp: string
  processingTime: number
}

export class EnhancedDecisionService {
  private static workflows: Map<string, WorkflowDefinition> = new Map()
  private static externalDataSources: Map<string, ExternalDataSource> = new Map()
  
  // Workflow Management
  static registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow)
  }
  
  static getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId)
  }
  
  static listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }
  
  static updateWorkflow(workflowId: string, updates: Partial<WorkflowDefinition>): boolean {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return false
    
    const updatedWorkflow = {
      ...workflow,
      ...updates,
      metadata: {
        ...workflow.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    }
    
    this.workflows.set(workflowId, updatedWorkflow)
    return true
  }
  
  // External Data Source Management
  static registerDataSource(dataSource: ExternalDataSource): void {
    this.externalDataSources.set(dataSource.id, dataSource)
  }
  
  static async fetchExternalData(
    dataSourceIds: string[], 
    applicationData: any
  ): Promise<Record<string, any>> {
    const externalData: Record<string, any> = {}
    
    for (const sourceId of dataSourceIds) {
      const source = this.externalDataSources.get(sourceId)
      if (!source || !source.enabled) continue
      
      try {
        const data = await this.callExternalService(source, applicationData)
        externalData[sourceId] = data
      } catch (error) {
        console.error(`Failed to fetch data from ${sourceId}:`, error)
        externalData[sourceId] = { error: error.message }
      }
    }
    
    return externalData
  }
  
  private static async callExternalService(
    source: ExternalDataSource, 
    applicationData: any
  ): Promise<any> {
    // Mock implementation - in real world, this would make actual API calls
    switch (source.type) {
      case "credit_bureau":
        return this.mockCreditBureauData(applicationData)
      case "kyc_provider":
        return this.mockKYCData(applicationData)
      case "fraud_service":
        return this.mockFraudData(applicationData)
      case "income_verification":
        return this.mockIncomeData(applicationData)
      default:
        return {}
    }
  }
  
  // Mock external data providers
  private static mockCreditBureauData(applicationData: any): any {
    const baseScore = 600 + Math.random() * 200
    return {
      creditScore: Math.round(baseScore),
      creditHistory: {
        accountsOpen: Math.floor(Math.random() * 10) + 1,
        totalDebt: Math.round(Math.random() * 50000),
        paymentHistory: Math.random() > 0.3 ? "good" : "poor",
        bankruptcies: Math.random() > 0.9 ? 1 : 0
      },
      inquiries: {
        hard: Math.floor(Math.random() * 5),
        soft: Math.floor(Math.random() * 10)
      }
    }
  }
  
  private static mockKYCData(applicationData: any): any {
    return {
      identityVerified: Math.random() > 0.1,
      documentVerification: {
        idDocument: Math.random() > 0.05,
        addressProof: Math.random() > 0.1,
        faceMatch: Math.random() > 0.02
      },
      watchlistCheck: {
        pep: Math.random() > 0.98,
        sanctions: Math.random() > 0.99,
        adverseMedia: Math.random() > 0.95
      }
    }
  }
  
  private static mockFraudData(applicationData: any): any {
    return {
      riskScore: Math.round(Math.random() * 100),
      deviceFingerprint: {
        trusted: Math.random() > 0.2,
        vpnDetected: Math.random() > 0.9,
        emulatorDetected: Math.random() > 0.95
      },
      behavioralAnalysis: {
        typingPattern: Math.random() > 0.1 ? "normal" : "suspicious",
        sessionDuration: Math.round(Math.random() * 1800), // seconds
        pageViews: Math.floor(Math.random() * 20) + 1
      },
      applicationCount24h: Math.floor(Math.random() * 5)
    }
  }
  
  private static mockIncomeData(applicationData: any): any {
    const monthlyIncome = applicationData.financialInfo?.monthlyIncome || 5000
    return {
      verifiedIncome: monthlyIncome * (0.8 + Math.random() * 0.4),
      employmentVerified: Math.random() > 0.2,
      bankStatements: {
        averageBalance: monthlyIncome * (1 + Math.random() * 2),
        regularDeposits: Math.random() > 0.3,
        overdrafts: Math.floor(Math.random() * 3)
      }
    }
  }
  
  // Enhanced Decision Processing
  static async processDecision(request: DecisionRequest): Promise<DecisionResponse & {
    ruleExecutionResult: RuleSetExecutionResult
    externalData: Record<string, any>
  }> {
    const startTime = Date.now()
    
    // Get workflow
    const workflow = this.getWorkflow(request.workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${request.workflowId} not found`)
    }
    
    // Fetch external data
    const externalDataSources = workflow.dataRequirements.external
    const externalData = await this.fetchExternalData(externalDataSources, request.applicationData)
    
    // Prepare execution context
    const context: RuleExecutionContext = {
      applicationData: request.applicationData,
      externalData,
      userContext: {
        userId: request.applicantId,
        roles: [],
        permissions: []
      },
      metadata: request.metadata
    }
    
    // Execute rule set
    const ruleExecutionResult = RuleEngine.executeRuleSet(workflow.ruleSet, context)
    
    // Convert to legacy decision response format
    const processingTime = Date.now() - startTime
    const decisionResponse: DecisionResponse = {
      decisionId: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      outcome: ruleExecutionResult.finalDecision.outcome,
      riskScore: ruleExecutionResult.finalDecision.score || 0,
      confidence: this.calculateConfidence(ruleExecutionResult),
      reasons: ruleExecutionResult.finalDecision.messages,
      recommendations: this.generateRecommendations(ruleExecutionResult),
      fraudDetection: {
        isFraud: ruleExecutionResult.finalDecision.flags.some(flag => 
          flag.includes('fraud') || flag.includes('suspicious')
        ),
        confidence: externalData.fraud_service?.riskScore || 0,
        reasons: ruleExecutionResult.finalDecision.flags.filter(flag => 
          flag.includes('fraud') || flag.includes('suspicious')
        )
      },
      processingTime,
      timestamp: new Date().toISOString()
    }
    
    return {
      ...decisionResponse,
      ruleExecutionResult,
      externalData
    }
  }
  
  // Simulation Mode
  static async simulateDecision(request: SimulationRequest): Promise<SimulationResult> {
    const startTime = Date.now()
    
    // Get workflow
    const workflow = this.getWorkflow(request.workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${request.workflowId} not found`)
    }
    
    // Use provided external data or fetch mock data
    let externalData = request.externalDataOverrides || {}
    if (Object.keys(externalData).length === 0) {
      externalData = await this.fetchExternalData(
        workflow.dataRequirements.external, 
        request.testData
      )
    }
    
    // Apply rule overrides if provided
    let ruleSet = workflow.ruleSet
    if (request.ruleOverrides) {
      ruleSet = this.applyRuleOverrides(ruleSet, request.ruleOverrides)
    }
    
    // Prepare execution context
    const context: RuleExecutionContext = {
      applicationData: request.testData,
      externalData,
      userContext: {
        userId: "simulation_user",
        roles: [],
        permissions: []
      },
      metadata: { simulation: true }
    }
    
    // Execute rule set
    const executionResult = RuleEngine.executeRuleSet(ruleSet, context)
    
    const processingTime = Date.now() - startTime
    
    return {
      simulationId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: request.workflowId,
      executionResult,
      testData: request.testData,
      externalData,
      timestamp: new Date().toISOString(),
      processingTime
    }
  }
  
  private static applyRuleOverrides(
    ruleSet: RuleSet, 
    overrides: NonNullable<SimulationRequest['ruleOverrides']>
  ): RuleSet {
    const modifiedRuleSet = JSON.parse(JSON.stringify(ruleSet)) // Deep clone
    
    // Disable specified rules
    for (const ruleId of overrides.disabledRules) {
      const rule = modifiedRuleSet.rules.find(r => r.id === ruleId)
      if (rule) {
        rule.enabled = false
      }
    }
    
    // Apply rule modifications
    for (const modification of overrides.modifiedRules) {
      const rule = modifiedRuleSet.rules.find(r => r.id === modification.ruleId)
      if (rule) {
        Object.assign(rule, modification.modifications)
      }
    }
    
    return modifiedRuleSet
  }
  
  private static calculateConfidence(result: RuleSetExecutionResult): number {
    const totalRules = result.rulesExecuted
    const matchedRules = result.rulesMatched
    
    if (totalRules === 0) return 0
    
    // Base confidence on rule match ratio and decision consistency
    const matchRatio = matchedRules / totalRules
    const baseConfidence = matchRatio * 100
    
    // Adjust based on decision type
    switch (result.finalDecision.outcome) {
      case "approved":
        return Math.min(95, baseConfidence + 10)
      case "declined":
        return Math.min(90, baseConfidence + 5)
      case "review":
        return Math.max(50, baseConfidence - 10)
      default:
        return baseConfidence
    }
  }
  
  private static generateRecommendations(result: RuleSetExecutionResult): string[] {
    const recommendations: string[] = []
    
    if (result.finalDecision.requiredDocuments.length > 0) {
      recommendations.push(
        `Required documents: ${result.finalDecision.requiredDocuments.join(', ')}`
      )
    }
    
    if (result.finalDecision.flags.includes('high_dti')) {
      recommendations.push('Consider debt consolidation options')
    }
    
    if (result.finalDecision.flags.includes('low_credit_score')) {
      recommendations.push('Recommend credit improvement program')
    }
    
    if (result.finalDecision.outcome === 'review') {
      recommendations.push('Schedule manual underwriter review within 24 hours')
    }
    
    return recommendations
  }
}

// Initialize with default data sources
EnhancedDecisionService.registerDataSource({
  id: "credit_bureau",
  name: "Credit Bureau API",
  type: "credit_bureau",
  endpoint: "https://api.creditbureau.com/v1/report",
  timeout: 5000,
  retries: 2,
  enabled: true
})

EnhancedDecisionService.registerDataSource({
  id: "kyc_provider",
  name: "KYC Verification Service",
  type: "kyc_provider",
  endpoint: "https://api.kycprovider.com/v2/verify",
  timeout: 10000,
  retries: 1,
  enabled: true
})

EnhancedDecisionService.registerDataSource({
  id: "fraud_service",
  name: "Fraud Detection API",
  type: "fraud_service",
  endpoint: "https://api.frauddetection.com/v1/analyze",
  timeout: 3000,
  retries: 2,
  enabled: true
})

EnhancedDecisionService.registerDataSource({
  id: "income_verification",
  name: "Income Verification Service",
  type: "income_verification",
  endpoint: "https://api.incomeverify.com/v1/verify",
  timeout: 8000,
  retries: 1,
  enabled: true
})