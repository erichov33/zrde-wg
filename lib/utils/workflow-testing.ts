import { Workflow, WorkflowNode, WorkflowConnection, ExecutionRequest } from '@/lib/services/workflow-execution-service'
import { RuleSet, Rule } from '@/lib/engines/rule-engine'

export interface TestCase {
  id: string
  name: string
  description: string
  input: Record<string, any>
  expectedOutput: Record<string, any>
  expectedPath: string[]
  tags: string[]
  priority: 'high' | 'medium' | 'low'
  createdAt: Date
}

export interface TestSuite {
  id: string
  name: string
  description: string
  workflowId: string
  testCases: TestCase[]
  createdAt: Date
  updatedAt: Date
}

export interface TestResult {
  testCaseId: string
  executionId: string
  status: 'passed' | 'failed' | 'error'
  actualOutput: Record<string, any>
  actualPath: string[]
  executionTime: number
  errors?: string[]
  differences?: TestDifference[]
}

export interface TestDifference {
  field: string
  expected: any
  actual: any
  type: 'missing' | 'extra' | 'different'
}

export class WorkflowTestingUtility {
  private testSuites: Map<string, TestSuite> = new Map()
  private testResults: Map<string, TestResult[]> = new Map()

  constructor() {
    this.initializeMockTestSuites()
  }

  private initializeMockTestSuites() {
    // Loan Approval Test Suite
    const loanApprovalTestSuite: TestSuite = {
      id: 'loan-approval-tests',
      name: 'Loan Approval Workflow Tests',
      description: 'Comprehensive test suite for loan approval workflow',
      workflowId: 'loan-approval-v1',
      testCases: [
        {
          id: 'test-high-credit-auto-approve',
          name: 'High Credit Score Auto Approval',
          description: 'Test auto approval for high credit score applicants',
          input: {
            credit_score: 780,
            annual_income: 75000,
            employment_years: 5,
            loan_amount: 25000,
            debt_to_income: 0.25
          },
          expectedOutput: {
            decision: 'approved',
            risk_score: 0.15,
            approval_type: 'automatic'
          },
          expectedPath: ['start', 'data-collection', 'risk-assessment', 'auto-approve', 'end'],
          tags: ['auto-approval', 'high-credit', 'positive'],
          priority: 'high',
          createdAt: new Date('2024-01-15')
        },
        {
          id: 'test-medium-risk-manual-review',
          name: 'Medium Risk Manual Review',
          description: 'Test manual review trigger for medium risk applicants',
          input: {
            credit_score: 650,
            annual_income: 45000,
            employment_years: 1.5,
            loan_amount: 30000,
            debt_to_income: 0.45
          },
          expectedOutput: {
            decision: 'pending_review',
            risk_score: 0.5,
            approval_type: 'manual'
          },
          expectedPath: ['start', 'data-collection', 'risk-assessment', 'manual-review', 'end'],
          tags: ['manual-review', 'medium-risk'],
          priority: 'high',
          createdAt: new Date('2024-01-16')
        },
        {
          id: 'test-high-risk-auto-reject',
          name: 'High Risk Auto Rejection',
          description: 'Test auto rejection for high risk applicants',
          input: {
            credit_score: 520,
            annual_income: 25000,
            employment_years: 0.5,
            loan_amount: 40000,
            debt_to_income: 0.8
          },
          expectedOutput: {
            decision: 'rejected',
            risk_score: 0.85,
            approval_type: 'automatic'
          },
          expectedPath: ['start', 'data-collection', 'risk-assessment', 'auto-reject', 'end'],
          tags: ['auto-rejection', 'high-risk', 'negative'],
          priority: 'high',
          createdAt: new Date('2024-01-17')
        },
        {
          id: 'test-edge-case-missing-data',
          name: 'Edge Case: Missing Data',
          description: 'Test workflow behavior with missing required data',
          input: {
            credit_score: 700,
            // Missing annual_income and employment_years
            loan_amount: 20000
          },
          expectedOutput: {
            decision: 'error',
            error_type: 'missing_data'
          },
          expectedPath: ['start', 'data-collection'],
          tags: ['edge-case', 'error-handling'],
          priority: 'medium',
          createdAt: new Date('2024-01-18')
        },
        {
          id: 'test-boundary-credit-score',
          name: 'Boundary: Credit Score Threshold',
          description: 'Test behavior at credit score decision boundaries',
          input: {
            credit_score: 750, // Exactly at threshold
            annual_income: 60000,
            employment_years: 3,
            loan_amount: 25000,
            debt_to_income: 0.3
          },
          expectedOutput: {
            decision: 'approved',
            risk_score: 0.25,
            approval_type: 'automatic'
          },
          expectedPath: ['start', 'data-collection', 'risk-assessment', 'auto-approve', 'end'],
          tags: ['boundary-test', 'credit-threshold'],
          priority: 'medium',
          createdAt: new Date('2024-01-19')
        }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-19')
    }

    this.testSuites.set(loanApprovalTestSuite.id, loanApprovalTestSuite)
  }

  // Test Suite Management
  createTestSuite(testSuite: Omit<TestSuite, 'id' | 'createdAt' | 'updatedAt'>): TestSuite {
    const newTestSuite: TestSuite = {
      ...testSuite,
      id: `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.testSuites.set(newTestSuite.id, newTestSuite)
    return newTestSuite
  }

  getTestSuite(suiteId: string): TestSuite | undefined {
    return this.testSuites.get(suiteId)
  }

  getAllTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values())
  }

  getTestSuitesForWorkflow(workflowId: string): TestSuite[] {
    return Array.from(this.testSuites.values())
      .filter(suite => suite.workflowId === workflowId)
  }

  // Test Case Management
  addTestCase(suiteId: string, testCase: Omit<TestCase, 'id' | 'createdAt'>): TestCase {
    const suite = this.testSuites.get(suiteId)
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`)
    }

    const newTestCase: TestCase = {
      ...testCase,
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }

    suite.testCases.push(newTestCase)
    suite.updatedAt = new Date()
    
    return newTestCase
  }

  updateTestCase(suiteId: string, testCaseId: string, updates: Partial<TestCase>): TestCase {
    const suite = this.testSuites.get(suiteId)
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`)
    }

    const testCaseIndex = suite.testCases.findIndex(tc => tc.id === testCaseId)
    if (testCaseIndex === -1) {
      throw new Error(`Test case not found: ${testCaseId}`)
    }

    suite.testCases[testCaseIndex] = { ...suite.testCases[testCaseIndex], ...updates }
    suite.updatedAt = new Date()
    
    return suite.testCases[testCaseIndex]
  }

  deleteTestCase(suiteId: string, testCaseId: string): void {
    const suite = this.testSuites.get(suiteId)
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`)
    }

    suite.testCases = suite.testCases.filter(tc => tc.id !== testCaseId)
    suite.updatedAt = new Date()
  }

  // Test Execution and Results
  async runTestCase(testCase: TestCase, workflowExecutionService: any): Promise<TestResult> {
    const startTime = Date.now()
    
    try {
      const executionRequest: ExecutionRequest = {
        workflowId: 'loan-approval-v1', // This should come from the test suite
        input: testCase.input,
        simulationMode: true
      }

      const executionResult = await workflowExecutionService.executeWorkflow(executionRequest)
      const executionTime = Date.now() - startTime

      const testResult: TestResult = {
        testCaseId: testCase.id,
        executionId: executionResult.executionId,
        status: 'passed',
        actualOutput: executionResult.result,
        actualPath: executionResult.executionPath,
        executionTime,
        differences: []
      }

      // Compare results
      const differences = this.compareResults(testCase.expectedOutput, executionResult.result)
      const pathMatches = this.compareExecutionPaths(testCase.expectedPath, executionResult.executionPath)

      if (differences.length > 0 || !pathMatches) {
        testResult.status = 'failed'
        testResult.differences = differences
        
        if (!pathMatches) {
          testResult.differences.push({
            field: 'execution_path',
            expected: testCase.expectedPath,
            actual: executionResult.executionPath,
            type: 'different'
          })
        }
      }

      return testResult

    } catch (error) {
      return {
        testCaseId: testCase.id,
        executionId: `error_${Date.now()}`,
        status: 'error',
        actualOutput: {},
        actualPath: [],
        executionTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async runTestSuite(suiteId: string, workflowExecutionService: any): Promise<TestResult[]> {
    const suite = this.testSuites.get(suiteId)
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`)
    }

    const results: TestResult[] = []
    
    for (const testCase of suite.testCases) {
      const result = await this.runTestCase(testCase, workflowExecutionService)
      results.push(result)
    }

    this.testResults.set(suiteId, results)
    return results
  }

  private compareResults(expected: Record<string, any>, actual: Record<string, any>): TestDifference[] {
    const differences: TestDifference[] = []
    
    // Check for missing fields
    Object.keys(expected).forEach(key => {
      if (!(key in actual)) {
        differences.push({
          field: key,
          expected: expected[key],
          actual: undefined,
          type: 'missing'
        })
      } else if (expected[key] !== actual[key]) {
        differences.push({
          field: key,
          expected: expected[key],
          actual: actual[key],
          type: 'different'
        })
      }
    })

    // Check for extra fields
    Object.keys(actual).forEach(key => {
      if (!(key in expected)) {
        differences.push({
          field: key,
          expected: undefined,
          actual: actual[key],
          type: 'extra'
        })
      }
    })

    return differences
  }

  private compareExecutionPaths(expected: string[], actual: string[]): boolean {
    if (expected.length !== actual.length) {
      return false
    }
    
    return expected.every((step, index) => step === actual[index])
  }

  // Test Results Management
  getTestResults(suiteId: string): TestResult[] {
    return this.testResults.get(suiteId) || []
  }

  getTestSummary(suiteId: string): {
    total: number
    passed: number
    failed: number
    errors: number
    passRate: number
  } {
    const results = this.getTestResults(suiteId)
    const total = results.length
    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    const errors = results.filter(r => r.status === 'error').length
    
    return {
      total,
      passed,
      failed,
      errors,
      passRate: total > 0 ? (passed / total) * 100 : 0
    }
  }

  // Mock Data Generators
  generateMockLoanApplication(): Record<string, any> {
    const creditScores = [520, 580, 650, 700, 750, 780, 820]
    const incomes = [25000, 35000, 45000, 55000, 65000, 75000, 85000, 95000]
    const employmentYears = [0.5, 1, 1.5, 2, 3, 5, 8, 10]
    const loanAmounts = [10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000]

    return {
      credit_score: creditScores[Math.floor(Math.random() * creditScores.length)],
      annual_income: incomes[Math.floor(Math.random() * incomes.length)],
      employment_years: employmentYears[Math.floor(Math.random() * employmentYears.length)],
      loan_amount: loanAmounts[Math.floor(Math.random() * loanAmounts.length)],
      debt_to_income: Math.round((Math.random() * 0.6 + 0.1) * 100) / 100,
      applicant_age: Math.floor(Math.random() * 40) + 25,
      has_collateral: Math.random() > 0.5,
      previous_defaults: Math.floor(Math.random() * 3),
      account_balance: Math.floor(Math.random() * 50000) + 1000
    }
  }

  generateMockInsuranceApplication(): Record<string, any> {
    const ages = [25, 30, 35, 40, 45, 50, 55, 60, 65]
    const coverageAmounts = [100000, 250000, 500000, 750000, 1000000]
    const occupations = ['teacher', 'engineer', 'doctor', 'lawyer', 'manager', 'technician']

    return {
      age: ages[Math.floor(Math.random() * ages.length)],
      coverage_amount: coverageAmounts[Math.floor(Math.random() * coverageAmounts.length)],
      occupation: occupations[Math.floor(Math.random() * occupations.length)],
      smoker: Math.random() > 0.7,
      health_score: Math.floor(Math.random() * 100) + 1,
      previous_claims: Math.floor(Math.random() * 5),
      annual_premium_budget: Math.floor(Math.random() * 5000) + 500,
      has_dependents: Math.random() > 0.4
    }
  }

  generateBulkTestData(type: 'loan' | 'insurance', count: number): Record<string, any>[] {
    const data: Record<string, any>[] = []
    
    for (let i = 0; i < count; i++) {
      if (type === 'loan') {
        data.push(this.generateMockLoanApplication())
      } else {
        data.push(this.generateMockInsuranceApplication())
      }
    }
    
    return data
  }

  // Performance Testing
  async runPerformanceTest(
    suiteId: string, 
    workflowExecutionService: any,
    concurrency: number = 5,
    iterations: number = 100
  ): Promise<{
    averageExecutionTime: number
    minExecutionTime: number
    maxExecutionTime: number
    throughput: number
    errorRate: number
    results: TestResult[]
  }> {
    const suite = this.testSuites.get(suiteId)
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteId}`)
    }

    const startTime = Date.now()
    const results: TestResult[] = []
    const executionTimes: number[] = []
    let errors = 0

    // Run tests in batches for concurrency
    for (let i = 0; i < iterations; i += concurrency) {
      const batch = []
      
      for (let j = 0; j < concurrency && (i + j) < iterations; j++) {
        const testCase = suite.testCases[Math.floor(Math.random() * suite.testCases.length)]
        batch.push(this.runTestCase(testCase, workflowExecutionService))
      }

      const batchResults = await Promise.all(batch)
      results.push(...batchResults)
      
      batchResults.forEach(result => {
        executionTimes.push(result.executionTime)
        if (result.status === 'error') {
          errors++
        }
      })
    }

    const totalTime = Date.now() - startTime
    const averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
    const minExecutionTime = Math.min(...executionTimes)
    const maxExecutionTime = Math.max(...executionTimes)
    const throughput = (iterations / totalTime) * 1000 // requests per second
    const errorRate = (errors / iterations) * 100

    return {
      averageExecutionTime,
      minExecutionTime,
      maxExecutionTime,
      throughput,
      errorRate,
      results
    }
  }
}

// Export singleton instance
export const workflowTestingUtility = new WorkflowTestingUtility()

// Export additional utility functions
export function createTestCaseFromExecution(
  name: string,
  description: string,
  input: Record<string, any>,
  executionResult: any
): Omit<TestCase, 'id' | 'createdAt'> {
  return {
    name,
    description,
    input,
    expectedOutput: executionResult.result,
    expectedPath: executionResult.executionPath,
    tags: ['generated'],
    priority: 'medium'
  }
}

export function validateTestCase(testCase: TestCase): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!testCase.name || testCase.name.trim().length === 0) {
    errors.push('Test case name is required')
  }

  if (!testCase.input || Object.keys(testCase.input).length === 0) {
    errors.push('Test case input is required')
  }

  if (!testCase.expectedOutput || Object.keys(testCase.expectedOutput).length === 0) {
    errors.push('Test case expected output is required')
  }

  if (!testCase.expectedPath || testCase.expectedPath.length === 0) {
    errors.push('Test case expected execution path is required')
  }

  return { isValid: errors.length === 0, errors }
}