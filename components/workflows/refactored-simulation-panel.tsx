"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Plus, Trash2, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

// Import our new business logic and configuration
import { DecisionEngine, type ApplicantData, type DecisionResult } from "@/lib/business/decision-engine"
import { SIMULATION_CONFIG } from "@/lib/config/business-rules"
import { 
  type TestCase, 
  type TestExecutionResult, 
  type WorkflowDefinition,
  type ExecutionState 
} from "@/lib/types/workflow"

// ============================================================================
// Hooks for Business Logic
// ============================================================================

/**
 * Custom hook for managing test cases
 */
function useTestCases() {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addTestCase = useCallback((testCase: Omit<TestCase, 'id' | 'metadata'>) => {
    const newTestCase: TestCase = {
      ...testCase,
      id: `test-${Date.now()}`,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
        category: 'manual',
        priority: 'medium'
      }
    }
    setTestCases(prev => [...prev, newTestCase])
  }, [])

  const updateTestCase = useCallback((id: string, updates: Partial<TestCase>) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === id 
        ? { ...tc, ...updates, metadata: { ...tc.metadata, updatedAt: new Date() } }
        : tc
    ))
  }, [])

  const deleteTestCase = useCallback((id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id))
  }, [])

  const loadDefaultTestCases = useCallback(() => {
    setIsLoading(true)
    
    // Convert configuration to test cases
    const defaultCases = Object.entries(SIMULATION_CONFIG.DEFAULT_TEST_CASES).map(([key, config]) => ({
      name: `${key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')} Case`,
      description: `Test case for ${config.expectedDecision} scenario`,
      inputData: {
        creditScore: config.creditScore,
        income: config.income,
        debtToIncomeRatio: config.debtToIncomeRatio
      },
      expectedOutput: {
        decision: config.expectedDecision as any
      },
      tags: [key, 'default']
    }))

    defaultCases.forEach(testCase => addTestCase(testCase))
    setIsLoading(false)
  }, [addTestCase])

  return {
    testCases,
    isLoading,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    loadDefaultTestCases
  }
}

/**
 * Custom hook for test execution
 */
function useTestExecution() {
  const [executionResults, setExecutionResults] = useState<Map<string, TestExecutionResult>>(new Map())
  const [executionState, setExecutionState] = useState<ExecutionState>('pending')

  const executeTestCase = useCallback(async (testCase: TestCase): Promise<TestExecutionResult> => {
    const startTime = Date.now()
    
    try {
      // Use our business logic engine
      const result = DecisionEngine.evaluateApplicant(testCase.inputData as ApplicantData)
      
      const executionTime = Date.now() - startTime
      
      const testResult: TestExecutionResult = {
        testCaseId: testCase.id,
        status: result.decision === testCase.expectedOutput.decision ? 'passed' : 'failed',
        executionTime,
        actualOutput: {
          decision: result,
          outputData: { decision: result.decision, confidence: result.confidence },
          nodeResults: {},
          dataSourceResults: {}
        },
        expectedOutput: testCase.expectedOutput,
        differences: result.decision !== testCase.expectedOutput.decision 
          ? [{ field: 'decision', expected: testCase.expectedOutput.decision, actual: result.decision, type: 'value_mismatch' }]
          : [],
        errors: []
      }

      setExecutionResults(prev => new Map(prev).set(testCase.id, testResult))
      return testResult
      
    } catch (error) {
      const testResult: TestExecutionResult = {
        testCaseId: testCase.id,
        status: 'error',
        executionTime: Date.now() - startTime,
        actualOutput: {
          outputData: {},
          nodeResults: {},
          dataSourceResults: {}
        },
        expectedOutput: testCase.expectedOutput,
        differences: [],
        errors: [{
          id: `error-${Date.now()}`,
          type: 'system_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }]
      }

      setExecutionResults(prev => new Map(prev).set(testCase.id, testResult))
      return testResult
    }
  }, [])

  const executeAllTests = useCallback(async (testCases: TestCase[]) => {
    setExecutionState('running')
    
    try {
      const results = await Promise.all(
        testCases.map(testCase => executeTestCase(testCase))
      )
      
      setExecutionState('completed')
      return results
    } catch (error) {
      setExecutionState('failed')
      throw error
    }
  }, [executeTestCase])

  const clearResults = useCallback(() => {
    setExecutionResults(new Map())
    setExecutionState('pending')
  }, [])

  return {
    executionResults,
    executionState,
    executeTestCase,
    executeAllTests,
    clearResults
  }
}

// ============================================================================
// UI Components
// ============================================================================

/**
 * Test case form component
 */
function TestCaseForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (testCase: Omit<TestCase, 'id' | 'metadata'>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    creditScore: 700,
    income: 75000,
    debtToIncomeRatio: 0.3,
    expectedDecision: 'approved' as const
  })

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      name: formData.name,
      description: formData.description,
      inputData: {
        creditScore: formData.creditScore,
        income: formData.income,
        debtToIncomeRatio: formData.debtToIncomeRatio
      },
      expectedOutput: {
        decision: formData.expectedDecision
      },
      tags: ['manual']
    })
  }, [formData, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Test Case Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter test case name"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this test case"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Credit Score</label>
          <Input
            type="number"
            value={formData.creditScore}
            onChange={(e) => setFormData(prev => ({ ...prev, creditScore: parseInt(e.target.value) }))}
            min="300"
            max="850"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Annual Income</label>
          <Input
            type="number"
            value={formData.income}
            onChange={(e) => setFormData(prev => ({ ...prev, income: parseInt(e.target.value) }))}
            min="0"
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Debt-to-Income Ratio</label>
        <Input
          type="number"
          step="0.01"
          value={formData.debtToIncomeRatio}
          onChange={(e) => setFormData(prev => ({ ...prev, debtToIncomeRatio: parseFloat(e.target.value) }))}
          min="0"
          max="1"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Test Case
        </Button>
      </div>
    </form>
  )
}

/**
 * Test result display component
 */
function TestResultDisplay({ result }: { result: TestExecutionResult }) {
  const getStatusIcon = () => {
    switch (result.status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    switch (result.status) {
      case 'passed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'error':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {result.status.toUpperCase()}
            </span>
          </div>
          <Badge variant="outline">
            {result.executionTime}ms
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {result.actualOutput.decision && (
          <div>
            <h4 className="text-sm font-medium mb-2">Decision Result</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div><strong>Decision:</strong> {result.actualOutput.decision.decision}</div>
              <div><strong>Confidence:</strong> {(result.actualOutput.decision.confidence * 100).toFixed(1)}%</div>
              <div><strong>Risk Level:</strong> {result.actualOutput.decision.riskLevel}</div>
            </div>
          </div>
        )}
        
        {result.differences.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Differences</h4>
            <div className="space-y-1">
              {result.differences.map((diff, index) => (
                <div key={index} className="bg-red-50 p-2 rounded text-sm">
                  <strong>{diff.field}:</strong> Expected {diff.expected}, got {diff.actual}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {result.errors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Errors</h4>
            <div className="space-y-1">
              {result.errors.map((error, index) => (
                <div key={index} className="bg-red-50 p-2 rounded text-sm text-red-700">
                  {error.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Main simulation panel component
 */
export function RefactoredSimulationPanel() {
  const [activeTab, setActiveTab] = useState("test-cases")
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const {
    testCases,
    isLoading,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    loadDefaultTestCases
  } = useTestCases()
  
  const {
    executionResults,
    executionState,
    executeTestCase,
    executeAllTests,
    clearResults
  } = useTestExecution()

  // Memoized statistics
  const testStats = useMemo(() => {
    const results = Array.from(executionResults.values())
    return {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      errors: results.filter(r => r.status === 'error').length,
      avgExecutionTime: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.executionTime, 0) / results.length)
        : 0
    }
  }, [executionResults])

  const handleCreateTestCase = useCallback((testCase: Omit<TestCase, 'id' | 'metadata'>) => {
    addTestCase(testCase)
    setShowCreateForm(false)
  }, [addTestCase])

  const handleRunAllTests = useCallback(async () => {
    try {
      await executeAllTests(testCases)
    } catch (error) {
      console.error('Failed to execute tests:', error)
    }
  }, [testCases, executeAllTests])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Workflow Testing</h2>
            <p className="text-sm text-gray-600">Test your workflow with different scenarios</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={loadDefaultTestCases}
              disabled={isLoading}
            >
              Load Defaults
            </Button>
            <Button 
              onClick={handleRunAllTests}
              disabled={testCases.length === 0 || executionState === 'running'}
            >
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </Button>
          </div>
        </div>
        
        {/* Statistics */}
        {testStats.total > 0 && (
          <div className="flex items-center space-x-4 mt-4 text-sm">
            <Badge variant="outline">
              Total: {testStats.total}
            </Badge>
            <Badge variant="outline" className="text-green-600">
              Passed: {testStats.passed}
            </Badge>
            <Badge variant="outline" className="text-red-600">
              Failed: {testStats.failed}
            </Badge>
            {testStats.errors > 0 && (
              <Badge variant="outline" className="text-yellow-600">
                Errors: {testStats.errors}
              </Badge>
            )}
            <Badge variant="outline">
              Avg: {testStats.avgExecutionTime}ms
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="test-cases" className="h-full p-6">
              {showCreateForm ? (
                <div className="max-w-md">
                  <h3 className="text-lg font-medium mb-4">Create Test Case</h3>
                  <TestCaseForm
                    onSubmit={handleCreateTestCase}
                    onCancel={() => setShowCreateForm(false)}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Test Cases</h3>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Test Case
                    </Button>
                  </div>
                  
                  {testCases.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No test cases yet. Create one to get started.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {testCases.map((testCase) => (
                        <Card key={testCase.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{testCase.name}</CardTitle>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => executeTestCase(testCase)}
                                  disabled={executionState === 'running'}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteTestCase(testCase.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <CardDescription>{testCase.description}</CardDescription>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Credit Score:</span> {testCase.inputData.creditScore}
                              </div>
                              <div>
                                <span className="font-medium">Income:</span> ${testCase.inputData.income?.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">DTI:</span> {(testCase.inputData.debtToIncomeRatio * 100).toFixed(1)}%
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="results" className="h-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Test Results</h3>
                {executionResults.size > 0 && (
                  <Button variant="outline" onClick={clearResults}>
                    Clear Results
                  </Button>
                )}
              </div>
              
              {executionResults.size === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No test results yet. Run some tests to see results here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {Array.from(executionResults.values()).map((result) => (
                    <TestResultDisplay key={result.testCaseId} result={result} />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}