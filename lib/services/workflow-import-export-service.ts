import { Workflow, WorkflowNode, WorkflowConnection } from './workflow-execution-service'
import { RuleSet, Rule } from '@/lib/engines/rule-engine'
import { TestSuite, TestCase } from '@/lib/utils/workflow-testing'

export interface WorkflowExportData {
  workflow: Workflow
  testSuites?: TestSuite[]
  metadata: {
    exportedAt: Date
    exportedBy: string
    version: string
    format: 'json' | 'yaml'
    checksum: string
  }
}

export interface ImportResult {
  success: boolean
  workflow?: Workflow
  testSuites?: TestSuite[]
  errors: string[]
  warnings: string[]
  conflicts?: ImportConflict[]
}

export interface ImportConflict {
  type: 'workflow_exists' | 'rule_exists' | 'test_suite_exists'
  resourceId: string
  resourceName: string
  action: 'skip' | 'overwrite' | 'rename'
}

export interface ExportOptions {
  includeTestSuites: boolean
  includeExecutionHistory: boolean
  format: 'json' | 'yaml'
  compression: boolean
  encryption?: {
    enabled: boolean
    algorithm: string
    key?: string
  }
}

export interface ImportOptions {
  overwriteExisting: boolean
  validateBeforeImport: boolean
  createBackup: boolean
  conflictResolution: 'skip' | 'overwrite' | 'prompt'
}

export class WorkflowImportExportService {
  private readonly EXPORT_VERSION = '1.0.0'
  private readonly SUPPORTED_FORMATS = ['json', 'yaml']

  // Export functionality
  async exportWorkflow(
    workflowId: string, 
    options: ExportOptions,
    workflowService: any,
    testingService?: any
  ): Promise<string> {
    try {
      const workflow = workflowService.getWorkflow(workflowId)
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
      }

      // Prepare export data
      const exportData: WorkflowExportData = {
        workflow: this.sanitizeWorkflowForExport(workflow),
        metadata: {
          exportedAt: new Date(),
          exportedBy: 'current_user', // Should come from auth context
          version: this.EXPORT_VERSION,
          format: options.format,
          checksum: ''
        }
      }

      // Include test suites if requested
      if (options.includeTestSuites && testingService) {
        exportData.testSuites = testingService.getTestSuitesForWorkflow(workflowId)
      }

      // Generate checksum
      exportData.metadata.checksum = this.generateChecksum(exportData)

      // Convert to requested format
      let exportString: string
      if (options.format === 'yaml') {
        exportString = this.convertToYaml(exportData)
      } else {
        exportString = JSON.stringify(exportData, null, 2)
      }

      // Apply compression if requested
      if (options.compression) {
        exportString = await this.compressData(exportString)
      }

      // Apply encryption if requested
      if (options.encryption?.enabled) {
        exportString = await this.encryptData(exportString, options.encryption)
      }

      return exportString

    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async exportMultipleWorkflows(
    workflowIds: string[],
    options: ExportOptions,
    workflowService: any,
    testingService?: any
  ): Promise<string> {
    const exportData = {
      workflows: [] as Workflow[],
      testSuites: [] as TestSuite[],
      metadata: {
        exportedAt: new Date(),
        exportedBy: 'current_user',
        version: this.EXPORT_VERSION,
        format: options.format,
        workflowCount: workflowIds.length,
        checksum: ''
      }
    }

    for (const workflowId of workflowIds) {
      const workflow = workflowService.getWorkflow(workflowId)
      if (workflow) {
        exportData.workflows.push(this.sanitizeWorkflowForExport(workflow))
        
        if (options.includeTestSuites && testingService) {
          const testSuites = testingService.getTestSuitesForWorkflow(workflowId)
          exportData.testSuites.push(...testSuites)
        }
      }
    }

    exportData.metadata.checksum = this.generateChecksum(exportData)

    let exportString = options.format === 'yaml' 
      ? this.convertToYaml(exportData)
      : JSON.stringify(exportData, null, 2)

    if (options.compression) {
      exportString = await this.compressData(exportString)
    }

    if (options.encryption?.enabled) {
      exportString = await this.encryptData(exportString, options.encryption)
    }

    return exportString
  }

  // Import functionality
  async importWorkflow(
    importData: string,
    options: ImportOptions,
    workflowService: any,
    testingService?: any
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      errors: [],
      warnings: [],
      conflicts: []
    }

    try {
      // Decrypt if needed
      let processedData = importData
      if (this.isEncrypted(importData)) {
        processedData = await this.decryptData(importData)
      }

      // Decompress if needed
      if (this.isCompressed(processedData)) {
        processedData = await this.decompressData(processedData)
      }

      // Parse the data
      let parsedData: any
      try {
        if (this.isYamlFormat(processedData)) {
          parsedData = this.parseYaml(processedData)
        } else {
          parsedData = JSON.parse(processedData)
        }
      } catch (parseError) {
        result.errors.push('Invalid file format or corrupted data')
        return result
      }

      // Validate the import data
      const validation = this.validateImportData(parsedData)
      if (!validation.isValid) {
        result.errors.push(...validation.errors)
        if (options.validateBeforeImport) {
          return result
        }
      }
      result.warnings.push(...validation.warnings)

      // Check for conflicts
      const conflicts = await this.detectConflicts(parsedData, workflowService, testingService)
      result.conflicts = conflicts

      if (conflicts.length > 0 && options.conflictResolution === 'prompt') {
        // In a real implementation, this would trigger a UI prompt
        result.warnings.push('Conflicts detected. Please resolve before proceeding.')
        return result
      }

      // Create backup if requested
      if (options.createBackup) {
        await this.createBackup(workflowService)
      }

      // Import workflow(s)
      if (parsedData.workflow) {
        // Single workflow import
        const importedWorkflow = await this.importSingleWorkflow(
          parsedData.workflow,
          conflicts,
          options,
          workflowService
        )
        result.workflow = importedWorkflow
      } else if (parsedData.workflows) {
        // Multiple workflows import
        for (const workflowData of parsedData.workflows) {
          await this.importSingleWorkflow(workflowData, conflicts, options, workflowService)
        }
      }

      // Import test suites if present
      if (parsedData.testSuites && testingService) {
        for (const testSuiteData of parsedData.testSuites) {
          await this.importTestSuite(testSuiteData, conflicts, options, testingService)
        }
        result.testSuites = parsedData.testSuites
      }

      result.success = true

    } catch (error) {
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  // Validation methods
  private validateImportData(data: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check metadata
    if (!data.metadata) {
      errors.push('Missing metadata in import file')
    } else {
      if (!data.metadata.version) {
        warnings.push('Missing version information')
      } else if (data.metadata.version !== this.EXPORT_VERSION) {
        warnings.push(`Version mismatch: expected ${this.EXPORT_VERSION}, got ${data.metadata.version}`)
      }

      // Verify checksum if present
      if (data.metadata.checksum) {
        const calculatedChecksum = this.generateChecksum(data)
        if (calculatedChecksum !== data.metadata.checksum) {
          warnings.push('Checksum mismatch - data may be corrupted')
        }
      }
    }

    // Validate workflow structure
    if (data.workflow) {
      const workflowValidation = this.validateWorkflowStructure(data.workflow)
      errors.push(...workflowValidation.errors)
      warnings.push(...workflowValidation.warnings)
    } else if (data.workflows) {
      for (const workflow of data.workflows) {
        const workflowValidation = this.validateWorkflowStructure(workflow)
        errors.push(...workflowValidation.errors)
        warnings.push(...workflowValidation.warnings)
      }
    } else {
      errors.push('No workflow data found in import file')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private validateWorkflowStructure(workflow: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!workflow.id) errors.push('Workflow missing ID')
    if (!workflow.name) errors.push('Workflow missing name')
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Workflow missing or invalid nodes array')
    }
    if (!workflow.connections || !Array.isArray(workflow.connections)) {
      errors.push('Workflow missing or invalid connections array')
    }

    // Validate nodes
    if (workflow.nodes) {
      const nodeIds = new Set()
      let hasStartNode = false
      let hasEndNode = false

      for (const node of workflow.nodes) {
        if (!node.id) {
          errors.push('Node missing ID')
          continue
        }
        
        if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: ${node.id}`)
        }
        nodeIds.add(node.id)

        if (!node.type) {
          errors.push(`Node ${node.id} missing type`)
        }

        if (node.type === 'start') hasStartNode = true
        if (node.type === 'end') hasEndNode = true
      }

      if (!hasStartNode) errors.push('Workflow missing start node')
      if (!hasEndNode) warnings.push('Workflow missing end node')
    }

    // Validate connections
    if (workflow.connections && workflow.nodes) {
      const nodeIds = new Set(workflow.nodes.map((n: any) => n.id))
      
      for (const connection of workflow.connections) {
        if (!connection.sourceId || !nodeIds.has(connection.sourceId)) {
          errors.push(`Invalid source node in connection: ${connection.sourceId}`)
        }
        if (!connection.targetId || !nodeIds.has(connection.targetId)) {
          errors.push(`Invalid target node in connection: ${connection.targetId}`)
        }
      }
    }

    return { errors, warnings }
  }

  private async detectConflicts(
    data: any,
    workflowService: any,
    testingService?: any
  ): Promise<ImportConflict[]> {
    const conflicts: ImportConflict[] = []

    // Check workflow conflicts
    if (data.workflow) {
      const existing = workflowService.getWorkflow(data.workflow.id)
      if (existing) {
        conflicts.push({
          type: 'workflow_exists',
          resourceId: data.workflow.id,
          resourceName: data.workflow.name,
          action: 'skip'
        })
      }
    } else if (data.workflows) {
      for (const workflow of data.workflows) {
        const existing = workflowService.getWorkflow(workflow.id)
        if (existing) {
          conflicts.push({
            type: 'workflow_exists',
            resourceId: workflow.id,
            resourceName: workflow.name,
            action: 'skip'
          })
        }
      }
    }

    // Check test suite conflicts
    if (data.testSuites && testingService) {
      for (const testSuite of data.testSuites) {
        const existing = testingService.getTestSuite(testSuite.id)
        if (existing) {
          conflicts.push({
            type: 'test_suite_exists',
            resourceId: testSuite.id,
            resourceName: testSuite.name,
            action: 'skip'
          })
        }
      }
    }

    return conflicts
  }

  private async importSingleWorkflow(
    workflowData: any,
    conflicts: ImportConflict[],
    options: ImportOptions,
    workflowService: any
  ): Promise<Workflow> {
    const conflict = conflicts.find(c => c.resourceId === workflowData.id)
    
    if (conflict) {
      if (conflict.action === 'skip' && !options.overwriteExisting) {
        throw new Error(`Workflow ${workflowData.id} already exists and overwrite is disabled`)
      }
      if (conflict.action === 'rename') {
        workflowData.id = `${workflowData.id}_imported_${Date.now()}`
        workflowData.name = `${workflowData.name} (Imported)`
      }
    }

    // Clean and prepare workflow data
    const workflow: Workflow = {
      ...workflowData,
      createdAt: workflowData.createdAt ? new Date(workflowData.createdAt) : new Date(),
      updatedAt: new Date()
    }

    // Save the workflow
    workflowService.saveWorkflow(workflow)
    
    return workflow
  }

  private async importTestSuite(
    testSuiteData: any,
    conflicts: ImportConflict[],
    options: ImportOptions,
    testingService: any
  ): Promise<void> {
    const conflict = conflicts.find(c => c.resourceId === testSuiteData.id)
    
    if (conflict) {
      if (conflict.action === 'skip' && !options.overwriteExisting) {
        return // Skip this test suite
      }
      if (conflict.action === 'rename') {
        testSuiteData.id = `${testSuiteData.id}_imported_${Date.now()}`
        testSuiteData.name = `${testSuiteData.name} (Imported)`
      }
    }

    // Convert date strings back to Date objects
    testSuiteData.createdAt = new Date(testSuiteData.createdAt)
    testSuiteData.updatedAt = new Date()
    
    if (testSuiteData.testCases) {
      testSuiteData.testCases.forEach((testCase: any) => {
        testCase.createdAt = new Date(testCase.createdAt)
      })
    }

    // Save the test suite (assuming testingService has a method to save)
    if (testingService.saveTestSuite) {
      testingService.saveTestSuite(testSuiteData)
    }
  }

  // Utility methods
  private sanitizeWorkflowForExport(workflow: Workflow): Workflow {
    // Remove any sensitive or runtime-specific data
    const sanitized = { ...workflow }
    
    // Remove any temporary IDs or runtime state
    delete (sanitized as any).executionState
    delete (sanitized as any).tempData
    
    return sanitized
  }

  private generateChecksum(data: any): string {
    // Simple checksum implementation - in production, use a proper hash function
    const str = JSON.stringify(data, Object.keys(data).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  private convertToYaml(data: any): string {
    // Simplified YAML conversion - in production, use a proper YAML library
    return JSON.stringify(data, null, 2)
      .replace(/"/g, '')
      .replace(/,$/gm, '')
      .replace(/^\s*{/gm, '')
      .replace(/^\s*}/gm, '')
  }

  private parseYaml(yamlString: string): any {
    // Simplified YAML parsing - in production, use a proper YAML library
    try {
      return JSON.parse(yamlString)
    } catch {
      throw new Error('Invalid YAML format')
    }
  }

  private async compressData(data: string): Promise<string> {
    // Placeholder for compression - in production, use a compression library
    return btoa(data) // Simple base64 encoding as placeholder
  }

  private async decompressData(data: string): Promise<string> {
    // Placeholder for decompression
    try {
      return atob(data) // Simple base64 decoding as placeholder
    } catch {
      throw new Error('Failed to decompress data')
    }
  }

  private async encryptData(data: string, encryption: any): Promise<string> {
    // Placeholder for encryption - in production, use proper encryption
    return btoa(data) // Simple base64 encoding as placeholder
  }

  private async decryptData(data: string): Promise<string> {
    // Placeholder for decryption
    try {
      return atob(data)
    } catch {
      throw new Error('Failed to decrypt data')
    }
  }

  private isEncrypted(data: string): boolean {
    // Simple check - in production, use proper detection
    return data.startsWith('ENCRYPTED:')
  }

  private isCompressed(data: string): boolean {
    // Simple check - in production, use proper detection
    return data.startsWith('COMPRESSED:')
  }

  private isYamlFormat(data: string): boolean {
    // Simple check for YAML format
    return !data.trim().startsWith('{') && data.includes(':')
  }

  private async createBackup(workflowService: any): Promise<void> {
    // Create backup of existing workflows
    const allWorkflows = workflowService.getAllWorkflows()
    const backupData = {
      workflows: allWorkflows,
      createdAt: new Date(),
      type: 'pre_import_backup'
    }
    
    // In production, save to backup storage
    console.log('Backup created:', backupData)
  }

  // Template and example workflows
  getWorkflowTemplates(): Array<{ id: string; name: string; description: string; category: string }> {
    return [
      {
        id: 'loan-approval-template',
        name: 'Loan Approval Workflow',
        description: 'Standard loan approval process with risk assessment',
        category: 'Financial Services'
      },
      {
        id: 'insurance-underwriting-template',
        name: 'Insurance Underwriting',
        description: 'Automated insurance policy underwriting workflow',
        category: 'Insurance'
      },
      {
        id: 'fraud-detection-template',
        name: 'Fraud Detection',
        description: 'Real-time fraud detection and prevention workflow',
        category: 'Security'
      },
      {
        id: 'customer-onboarding-template',
        name: 'Customer Onboarding',
        description: 'Automated customer verification and onboarding process',
        category: 'Customer Management'
      }
    ]
  }

  async generateWorkflowFromTemplate(templateId: string): Promise<Workflow> {
    // Generate a workflow from a predefined template
    const templates: Record<string, Partial<Workflow>> = {
      'loan-approval-template': {
        name: 'Loan Approval Workflow',
        description: 'Automated loan approval process',
        nodes: [
          {
            id: 'start',
            type: 'start',
            name: 'Application Received',
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            id: 'credit-check',
            type: 'data-source',
            name: 'Credit Bureau Check',
            config: { dataSource: 'credit-bureau' },
            position: { x: 300, y: 100 }
          },
          {
            id: 'risk-assessment',
            type: 'decision',
            name: 'Risk Assessment',
            config: { ruleSet: 'loan-risk-rules' },
            position: { x: 500, y: 100 }
          },
          {
            id: 'approve',
            type: 'action',
            name: 'Approve Loan',
            config: { action: 'approve' },
            position: { x: 700, y: 50 }
          },
          {
            id: 'reject',
            type: 'action',
            name: 'Reject Loan',
            config: { action: 'reject' },
            position: { x: 700, y: 150 }
          },
          {
            id: 'end',
            type: 'end',
            name: 'Process Complete',
            config: {},
            position: { x: 900, y: 100 }
          }
        ],
        connections: [
          { id: 'c1', sourceId: 'start', targetId: 'credit-check' },
          { id: 'c2', sourceId: 'credit-check', targetId: 'risk-assessment' },
          { id: 'c3', sourceId: 'risk-assessment', targetId: 'approve', condition: 'risk_score < 0.5' },
          { id: 'c4', sourceId: 'risk-assessment', targetId: 'reject', condition: 'risk_score >= 0.5' },
          { id: 'c5', sourceId: 'approve', targetId: 'end' },
          { id: 'c6', sourceId: 'reject', targetId: 'end' }
        ],
        ruleSets: []
      }
    }

    const template = templates[templateId]
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const workflow: Workflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0.0',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...template
    } as Workflow

    return workflow
  }
}

// Export singleton instance
export const workflowImportExportService = new WorkflowImportExportService()