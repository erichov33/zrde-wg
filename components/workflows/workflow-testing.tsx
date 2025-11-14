"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Play, Pause, Square, TestTube, CheckCircle, 
  XCircle, Clock, AlertTriangle, FileText,
  Download, Upload, RotateCcw, Zap
} from "lucide-react"

interface WorkflowTestingProps {
  workflowId: string
  onTestComplete?: (results: TestResult[]) => void
}

interface TestScenario {
  id: string
  name: string
  description: string
  inputData: Record<string, any>
  expectedOutput?: Record<string, any>
  tags: string[]
}

interface TestResult {
  scenarioId: string
  scenarioName: string
  status: 'passed' | 'failed' | 'running' | 'pending'
  executionTime: number
  output?: Record<string, any>
  error?: string
  nodeResults: Array<{
    nodeId: string
    nodeName: string
    status: 'passed' | 'failed' | 'skipped'
    executionTime: number
    output?: any
    error?: string
  }>
}

interface TestSuite {
  id: string
  name: string
  description: string
  scenarios: TestScenario[]
  createdAt: Date
  lastRun?: Date
}

/**
 * WorkflowTesting component provides comprehensive testing capabilities
 * including test scenario creation, execution, and result analysis
 */
export function WorkflowTesting({ workflowId, onTestComplete }: WorkflowTestingProps) {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<string>('')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [newScenario, setNewScenario] = useState<Partial<TestScenario>>({
    name: '',
    description: '',
    inputData: {},
    tags: []
  })

  // Mock test suites - replace with actual API calls
  useEffect(() => {
    const mockSuites: TestSuite[] = [
      {
        id: 'suite-1',
        name: 'Credit Assessment Tests',
        description: 'Comprehensive tests for credit assessment workflow',
        createdAt: new Date(),
        lastRun: new Date(),
        scenarios: [
          {
            id: 'scenario-1',
            name: 'High Credit Score',
            description: 'Test with high credit score customer',
            inputData: {
              creditScore: 850,
              income: 100000,
              debtToIncome: 0.2,
              employmentYears: 10
            },
            expectedOutput: {
              approved: true,
              interestRate: 3.5,
              maxLoanAmount: 500000
            },
            tags: ['positive', 'high-score']
          },
          {
            id: 'scenario-2',
            name: 'Low Credit Score',
            description: 'Test with low credit score customer',
            inputData: {
              creditScore: 550,
              income: 40000,
              debtToIncome: 0.6,
              employmentYears: 1
            },
            expectedOutput: {
              approved: false,
              reason: 'Credit score too low'
            },
            tags: ['negative', 'low-score']
          },
          {
            id: 'scenario-3',
            name: 'Edge Case - Missing Data',
            description: 'Test with incomplete customer data',
            inputData: {
              creditScore: 720,
              income: null,
              debtToIncome: 0.3
            },
            tags: ['edge-case', 'validation']
          }
        ]
      },
      {
        id: 'suite-2',
        name: 'Fraud Detection Tests',
        description: 'Tests for fraud detection scenarios',
        createdAt: new Date(),
        scenarios: [
          {
            id: 'scenario-4',
            name: 'Suspicious Transaction',
            description: 'Test with high-risk transaction patterns',
            inputData: {
              transactionAmount: 50000,
              location: 'Unknown',
              timeOfDay: '3:00 AM',
              frequencyScore: 0.9
            },
            expectedOutput: {
              riskLevel: 'high',
              flagged: true,
              requiresReview: true
            },
            tags: ['fraud', 'high-risk']
          }
        ]
      }
    ]
    setTestSuites(mockSuites)
    const firstSuite = mockSuites.at(0)
    if (firstSuite) {
      setSelectedSuite(firstSuite.id)
    }
  }, [])

  const runTestSuite = async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId)
    if (!suite) return

    setIsRunning(true)
    const results: TestResult[] = []

    for (const scenario of suite.scenarios) {
      // Initialize result
      const result: TestResult = {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        status: 'running',
        executionTime: 0,
        nodeResults: []
      }
      results.push(result)
      setTestResults([...results])

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Mock execution results
      const success = Math.random() > 0.2 // 80% success rate
      const executionTime = Math.random() * 3000 + 500

      result.status = success ? 'passed' : 'failed'
      result.executionTime = executionTime
      
      if (success) {
        result.output = scenario.expectedOutput || { result: 'success' }
        result.nodeResults = [
          { nodeId: 'start-1', nodeName: 'Start', status: 'passed', executionTime: 100 },
          { nodeId: 'validation-1', nodeName: 'Validation', status: 'passed', executionTime: 300 },
          { nodeId: 'decision-1', nodeName: 'Decision', status: 'passed', executionTime: 800 },
          { nodeId: 'end-1', nodeName: 'End', status: 'passed', executionTime: 50 }
        ]
      } else {
        result.error = 'Validation failed: Missing required field'
        result.nodeResults = [
          { nodeId: 'start-1', nodeName: 'Start', status: 'passed', executionTime: 100 },
          { nodeId: 'validation-1', nodeName: 'Validation', status: 'failed', executionTime: 200, error: 'Missing required field' },
          { nodeId: 'decision-1', nodeName: 'Decision', status: 'skipped', executionTime: 0 },
          { nodeId: 'end-1', nodeName: 'End', status: 'skipped', executionTime: 0 }
        ]
      }

      setTestResults([...results])
    }

    setIsRunning(false)
    onTestComplete?.(results)
  }

  const runSingleScenario = async (scenarioId: string) => {
    // Similar to runTestSuite but for a single scenario
    console.log('Running single scenario:', scenarioId)
  }

  const addNewScenario = () => {
    if (!newScenario.name || !selectedSuite) return

    const suite = testSuites.find(s => s.id === selectedSuite)
    if (!suite) return

    const scenario: TestScenario = {
      id: `scenario-${Date.now()}`,
      name: newScenario.name,
      description: newScenario.description || '',
      inputData: newScenario.inputData || {},
      tags: newScenario.tags || [],
      expectedOutput: newScenario.expectedOutput
    }

    suite.scenarios.push(scenario)
    setTestSuites([...testSuites])
    setNewScenario({ name: '', description: '', inputData: {}, tags: [] })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const selectedSuiteData = testSuites.find(s => s.id === selectedSuite)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Testing</h2>
          <p className="text-muted-foreground">Create and run test scenarios to validate workflow behavior</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Tests
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      </div>

      {/* Test Suite Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Suites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedSuite} onValueChange={setSelectedSuite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test suite" />
                </SelectTrigger>
                <SelectContent>
                  {testSuites.map((suite) => (
                    <SelectItem key={suite.id} value={suite.id}>
                      {suite.name} ({suite.scenarios.length} scenarios)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => selectedSuite && runTestSuite(selectedSuite)}
              disabled={isRunning || !selectedSuite}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Suite
                </>
              )}
            </Button>
          </div>
          {selectedSuiteData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium">{selectedSuiteData.name}</h4>
              <p className="text-sm text-muted-foreground">{selectedSuiteData.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{selectedSuiteData.scenarios.length} scenarios</span>
                <span>Created: {selectedSuiteData.createdAt.toLocaleDateString()}</span>
                {selectedSuiteData.lastRun && (
                  <span>Last run: {selectedSuiteData.lastRun.toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="create">Create Scenario</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          {selectedSuiteData && (
            <div className="space-y-4">
              {selectedSuiteData.scenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{scenario.name}</h4>
                          {scenario.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-muted-foreground mb-3">{scenario.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Input Data</Label>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(scenario.inputData, null, 2)}
                            </pre>
                          </div>
                          {scenario.expectedOutput && (
                            <div>
                              <Label className="text-sm font-medium">Expected Output</Label>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(scenario.expectedOutput, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => runSingleScenario(scenario.id)}
                        disabled={isRunning}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {testResults.length > 0 ? (
            <div className="space-y-4">
              {testResults.map((result) => (
                <Card key={result.scenarioId}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-semibold">{result.scenarioName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Execution time: {result.executionTime.toFixed(0)}ms
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </div>

                    {result.error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Error</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">{result.error}</p>
                      </div>
                    )}

                    {result.nodeResults && result.nodeResults.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Node Execution Results</Label>
                        <div className="space-y-2">
                          {result.nodeResults.map((nodeResult) => (
                            <div key={nodeResult.nodeId} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(nodeResult.status)}
                                <span className="text-sm font-medium">{nodeResult.nodeName}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-muted-foreground">
                                  {nodeResult.executionTime}ms
                                </span>
                                {nodeResult.error && (
                                  <p className="text-xs text-red-600">{nodeResult.error}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.output && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium">Output</Label>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Test Results</h3>
                <p className="text-muted-foreground">Run a test suite to see results here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Test Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input
                    id="scenario-name"
                    value={newScenario.name || ''}
                    onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                    placeholder="Enter scenario name"
                  />
                </div>
                <div>
                  <Label htmlFor="scenario-tags">Tags (comma-separated)</Label>
                  <Input
                    id="scenario-tags"
                    value={newScenario.tags?.join(', ') || ''}
                    onChange={(e) => setNewScenario({ 
                      ...newScenario, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    placeholder="positive, validation, edge-case"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="scenario-description">Description</Label>
                <Textarea
                  id="scenario-description"
                  value={newScenario.description || ''}
                  onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                  placeholder="Describe what this scenario tests"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="input-data">Input Data (JSON)</Label>
                <Textarea
                  id="input-data"
                  value={JSON.stringify(newScenario.inputData || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const data = JSON.parse(e.target.value)
                      setNewScenario({ ...newScenario, inputData: data })
                    } catch {
                      // Invalid JSON, keep the text as is
                    }
                  }}
                  placeholder='{"key": "value"}'
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="expected-output">Expected Output (JSON, optional)</Label>
                <Textarea
                  id="expected-output"
                  value={JSON.stringify(newScenario.expectedOutput || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const data = JSON.parse(e.target.value)
                      setNewScenario({ ...newScenario, expectedOutput: data })
                    } catch {
                      // Invalid JSON, keep the text as is
                    }
                  }}
                  placeholder='{"result": "expected_value"}'
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={addNewScenario} disabled={!newScenario.name}>
                <TestTube className="h-4 w-4 mr-2" />
                Add Scenario
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}