/**
 * Data Source Node Executor
 * 
 * Executes data source nodes that fetch external data
 */

import { BaseNodeExecutor } from './base-node-executor'
import {
  WorkflowExecutionContext,
  NodeExecutionResult,
  ValidationResult
} from '../../types/execution-contracts'

/**
 * Executor for data source nodes
 */
export class DataSourceNodeExecutor extends BaseNodeExecutor {
  async execute(context: WorkflowExecutionContext): Promise<NodeExecutionResult> {
    try {
      this.log('info', `Executing data source node: ${this.node.id}`, { 
        sourceType: this.getConfig('sourceType'),
        label: this.node.data.label 
      })

      const sourceType = this.getConfig('sourceType', 'database')
      const sourceConfig = this.getConfig('sourceConfig', {})

      // Fetch data from the specified source
      const data = await this.fetchData(sourceType, sourceConfig, context)

      // Update context with fetched data
      this.updateContext(context, {
        [`datasource_${this.node.id}_data`]: data,
        [`datasource_${this.node.id}_status`]: 'completed',
        [`datasource_${this.node.id}_timestamp`]: new Date().toISOString()
      })

      return this.createSuccessResult(data, 'default')
    } catch (error) {
      this.log('error', `Data source execution failed: ${this.node.id}`, error)
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Data source execution failed'
      )
    }
  }

  /**
   * Fetch data from specific source based on type
   */
  private async fetchData(
    sourceType: string,
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    switch (sourceType) {
      case 'credit_bureau':
        return this.fetchCreditBureauData(config, context)
      
      case 'income_verification':
        return this.fetchIncomeVerificationData(config, context)
      
      case 'fraud_detection':
        return this.fetchFraudDetectionData(config, context)
      
      case 'kyc_service':
        return this.fetchKYCData(config, context)
      
      case 'database':
        return this.fetchDatabaseData(config, context)
      
      case 'api':
        return this.fetchAPIData(config, context)
      
      case 'file':
        return this.fetchFileData(config, context)
      
      default:
        return this.fetchDefaultData(config, context)
    }
  }

  /**
   * Fetch credit bureau data
   */
  private async fetchCreditBureauData(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate credit bureau API call
    const applicantId = context.variables.applicantId || 'unknown'
    const ssn = context.variables.ssn || '***-**-****'
    
    return {
      creditScore: Math.floor(Math.random() * 400) + 300, // 300-700 range
      creditHistory: {
        accounts: Math.floor(Math.random() * 10) + 1,
        delinquencies: Math.floor(Math.random() * 3),
        inquiries: Math.floor(Math.random() * 5),
        oldestAccount: new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      tradelines: [
        {
          creditor: 'Credit Card Company',
          balance: Math.floor(Math.random() * 10000),
          limit: Math.floor(Math.random() * 20000) + 5000,
          status: 'current'
        }
      ],
      bureau: config.bureau || 'Experian',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Fetch income verification data
   */
  private async fetchIncomeVerificationData(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate income verification service
    const employerName = context.variables.employerName || 'Unknown Employer'
    const baseIncome = context.variables.statedIncome || 50000
    
    return {
      employmentStatus: 'active',
      employer: employerName,
      position: 'Software Engineer',
      annualIncome: baseIncome * (0.9 + Math.random() * 0.2), // ±10% variance
      monthlyIncome: (baseIncome * (0.9 + Math.random() * 0.2)) / 12,
      employmentStartDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      verificationMethod: config.method || 'payroll_verification',
      confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Fetch fraud detection data
   */
  private async fetchFraudDetectionData(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate fraud detection service
    const ipAddress = context.variables.ipAddress || '192.168.1.1'
    const deviceId = context.variables.deviceId || 'unknown_device'
    
    const riskScore = Math.random()
    
    return {
      riskScore,
      riskLevel: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
      flags: riskScore > 0.5 ? ['suspicious_ip', 'velocity_check'] : [],
      deviceFingerprint: {
        deviceId,
        ipAddress,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'New York, NY'
      },
      velocityChecks: {
        applicationsLast24h: Math.floor(Math.random() * 3),
        applicationsLast7d: Math.floor(Math.random() * 10)
      },
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Fetch KYC (Know Your Customer) data
   */
  private async fetchKYCData(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate KYC service
    const firstName = context.variables.firstName || 'John'
    const lastName = context.variables.lastName || 'Doe'
    const dateOfBirth = context.variables.dateOfBirth || '1990-01-01'
    
    return {
      identityVerification: {
        status: Math.random() > 0.1 ? 'verified' : 'pending',
        confidence: Math.random() * 0.2 + 0.8, // 80-100%
        documents: ['drivers_license', 'passport']
      },
      addressVerification: {
        status: Math.random() > 0.2 ? 'verified' : 'pending',
        confidence: Math.random() * 0.3 + 0.7, // 70-100%
        sources: ['utility_bill', 'bank_statement']
      },
      watchlistCheck: {
        status: 'clear',
        lists: ['OFAC', 'PEP', 'sanctions']
      },
      riskRating: Math.random() > 0.8 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Fetch database data
   */
  private async fetchDatabaseData(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate database query
    const query = config.query || 'SELECT * FROM applications'
    const table = config.table || 'applications'
    
    return {
      query,
      table,
      results: [
        {
          id: context.variables.applicantId || 'app_123',
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ],
      rowCount: 1,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Fetch API data
   */
  private async fetchAPIData(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate API call
    const endpoint = config.endpoint || '/api/data'
    const method = config.method || 'GET'
    
    return {
      endpoint,
      method,
      status: 200,
      data: {
        message: 'API call successful',
        timestamp: new Date().toISOString()
      },
      headers: {
        'content-type': 'application/json'
      },
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Fetch file data
   */
  private async fetchFileData(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    // Simulate file read
    const filePath = config.filePath || '/data/applications.json'
    const format = config.format || 'json'
    
    return {
      filePath,
      format,
      data: {
        records: [
          {
            id: context.variables.applicantId || 'app_123',
            data: 'sample file data'
          }
        ]
      },
      size: Math.floor(Math.random() * 10000) + 1000,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Fetch default data
   */
  private async fetchDefaultData(
    config: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    return {
      source: 'default',
      data: config.defaultData || {},
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Validate data source node configuration
   */
  protected validateNodeSpecific(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    const sourceType = this.getConfig('sourceType')
    if (!sourceType) {
      errors.push('Source type is required')
    }

    const validSourceTypes = [
      'credit_bureau',
      'income_verification',
      'fraud_detection',
      'kyc_service',
      'database',
      'api',
      'file'
    ]

    if (sourceType && !validSourceTypes.includes(sourceType as string)) {
      warnings.push(`Unknown source type: ${sourceType}`)
    }

    // Validate source-specific configuration
    if (sourceType === 'database') {
      const query = this.getConfig('sourceConfig.query')
      if (!query) {
        warnings.push('Database query is recommended')
      }
    }

    if (sourceType === 'api') {
      const endpoint = this.getConfig('sourceConfig.endpoint')
      if (!endpoint) {
        warnings.push('API endpoint is recommended')
      }
    }

    return { 
      isValid: errors.length === 0,
      errors, 
      warnings 
    }
  }
}