"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, RotateCcw, Download, Upload, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { WorkflowDefinition } from "@/lib/services/enhanced-decision-service"
import { EnhancedWorkflowNode } from "./enhanced-workflow-builder"

interface SimulationPanelProps {
  workflow: Partial<WorkflowDefinition>
  nodes: EnhancedWorkflowNode[]
}

interface TestCase {
  id: string
  name: string
  description: string
  inputData: Record<string, any>
  expectedOutcome?: string
  result?: SimulationResult
}

interface SimulationResult {
  decision: string
  score?: number
  flags: string[]
  executedRules: string[]
  executionTime: number
  errors: string[]
  warnings: string[]
}

export function SimulationPanel({ workflow, nodes }: SimulationPanelProps) {
  const [activeTab, setActiveTab] = useState("test-cases")
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: "test-1",
      name: "High Credit Score Application",
      description: "Test case for applicant with excellent credit",
      inputData: {
        creditScore: 780,
        income: 85000,
        debtToIncomeRatio: 0.25,
        employmentHistory: 5,
        applicationAmount: 250000
      },
      expectedOutcome: "approve"
    },
    {
      id: "test-2", 
      name: "Low Credit Score Application",
      description: "Test case for applicant with poor credit",
      inputData: {
        creditScore: 580,
        income: 45000,
        debtToIncomeRatio: 0.45,
        employmentHistory: 1,
        applicationAmount: 300000
      },
      expectedOutcome: "decline"
    }
  ])
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [bulkResults, setBulkResults] = useState<Record<string, SimulationResult>>({})

  const runSingleTest = async (testCase: TestCase) => {
    setIsRunning(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock simulation result
    const result: SimulationResult = {
      decision: testCase.inputData.creditScore > 650 ? "approve" : "decline",
      score: Math.min(100, Math.max(0, (testCase.inputData.creditScore - 300) / 5)),
      flags: testCase.inputData.creditScore < 600 ? ["low_credit_score"] : [],
      executedRules: ["credit_score_check", "debt_to_income_check", "income_verification"],
      executionTime: Math.random() * 200 + 50,
      errors: [],
      warnings: testCase.inputData.debtToIncomeRatio > 0.4 ? ["high_debt_ratio"] : []
    }
    
    // Update test case with result
    const updatedTestCase = { ...testCase, result }
    setTestCases(prev => prev.map(tc => tc.id === testCase.id ? updatedTestCase : tc))
    setSelectedTestCase(updatedTestCase)
    
    setIsRunning(false)
  }

  const runAllTests = async () => {
    setIsRunning(true)
    const results: Record<string, SimulationResult> = {}
    
    for (const testCase of testCases) {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const result: SimulationResult = {
        decision: testCase.inputData.creditScore > 650 ? "approve" : "decline",
        score: Math.min(100, Math.max(0, (testCase.inputData.creditScore - 300) / 5)),
        flags: testCase.inputData.creditScore < 600 ? ["low_credit_score"] : [],
        executedRules: ["credit_score_check", "debt_to_income_check", "income_verification"],
        executionTime: Math.random() * 200 + 50,
        errors: [],
        warnings: testCase.inputData.debtToIncomeRatio > 0.4 ? ["high_debt_ratio"] : []
      }
      
      results[testCase.id] = result
    }
    
    setBulkResults(results)
    setIsRunning(false)
  }

  const createNewTestCase = () => {
    const newTestCase: TestCase = {
      id: `test-${Date.now()}`,
      name: "New Test Case",
      description: "",
      inputData: {}
    }
    setTestCases(prev => [...prev, newTestCase])
    setSelectedTestCase(newTestCase)
  }

  const updateTestCase = (updates: Partial<TestCase>) => {
    if (!selectedTestCase) return
    
    const updated = { ...selectedTestCase, ...updates }
    setTestCases(prev => prev.map(tc => tc.id === selectedTestCase.id ? updated : tc))
    setSelectedTestCase(updated)
  }

  const deleteTestCase = (testCaseId: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== testCaseId))
    if (selectedTestCase?.id === testCaseId) {
      setSelectedTestCase(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Workflow Simulation</h3>
            <p className="text-sm text-muted-foreground">
              Test your workflow with sample data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runAllTests}
              disabled={isRunning || testCases.length === 0}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Run All Tests
            </Button>
            <Button 
              size="sm" 
              onClick={createNewTestCase}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              New Test Case
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50">
          <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="test-cases" className="flex-1 flex m-0">
          <div className="w-1/3 border-r border-slate-200/50 dark:border-slate-700/50 p-4">
            <div className="space-y-2">
              {testCases.map((testCase) => (
                <Card 
                  key={testCase.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedTestCase?.id === testCase.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => setSelectedTestCase(testCase)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{testCase.name}</h4>
                      {testCase.result && (
                        <Badge 
                          variant={testCase.result.decision === "approve" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {testCase.result.decision}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {testCase.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span>{Object.keys(testCase.inputData).length} fields</span>
                      {testCase.result && (
                        <span>{testCase.result.executionTime.toFixed(0)}ms</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4">
            {selectedTestCase ? (
              <TestCaseEditor 
                testCase={selectedTestCase}
                onUpdate={updateTestCase}
                onRun={() => runSingleTest(selectedTestCase)}
                onDelete={() => deleteTestCase(selectedTestCase.id)}
                isRunning={isRunning}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No Test Case Selected</p>
                  <p className="text-sm">Select a test case to edit or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="results" className="flex-1 m-0 p-4">
          <ResultsView testCases={testCases} bulkResults={bulkResults} />
        </TabsContent>

        <TabsContent value="performance" className="flex-1 m-0 p-4">
          <PerformanceView testCases={testCases} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Test Case Editor Component
function TestCaseEditor({ 
  testCase, 
  onUpdate, 
  onRun, 
  onDelete, 
  isRunning 
}: {
  testCase: TestCase
  onUpdate: (updates: Partial<TestCase>) => void
  onRun: () => void
  onDelete: () => void
  isRunning: boolean
}) {
  const addInputField = () => {
    const fieldName = prompt("Enter field name:")
    if (fieldName) {
      onUpdate({
        inputData: {
          ...testCase.inputData,
          [fieldName]: ""
        }
      })
    }
  }

  const updateInputField = (key: string, value: any) => {
    onUpdate({
      inputData: {
        ...testCase.inputData,
        [key]: value
      }
    })
  }

  const removeInputField = (key: string) => {
    const { [key]: removed, ...rest } = testCase.inputData
    onUpdate({ inputData: rest })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Test Case Editor</h3>
          <p className="text-sm text-muted-foreground">Configure test data and run simulation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDelete}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </Button>
          <Button 
            size="sm" 
            onClick={onRun}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Test
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Test Case Name</Label>
            <Input
              value={testCase.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Enter test case name"
            />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={testCase.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="w-full p-2 border rounded-md text-sm"
              rows={3}
              placeholder="Describe this test case"
            />
          </div>
          <div>
            <Label>Expected Outcome</Label>
            <Input
              value={testCase.expectedOutcome || ""}
              onChange={(e) => onUpdate({ expectedOutcome: e.target.value })}
              placeholder="e.g., approve, decline, review"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Input Data</CardTitle>
            <Button size="sm" onClick={addInputField} variant="outline">
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(testCase.inputData).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-1">
                <Label>{key}</Label>
                <Input
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value
                    // Try to parse as number if it looks like one
                    const parsedVal = !isNaN(Number(val)) && val !== "" ? Number(val) : val
                    updateInputField(key, parsedVal)
                  }}
                  placeholder="Enter value"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeInputField(key)}
                className="text-red-500 hover:text-red-700 mt-6"
              >
                ×
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {testCase.result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testCase.result.decision === "approve" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : testCase.result.decision === "decline" ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Test Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Decision</Label>
                <Badge 
                  variant={testCase.result.decision === "approve" ? "default" : "destructive"}
                  className="block w-fit mt-1"
                >
                  {testCase.result.decision}
                </Badge>
              </div>
              <div>
                <Label>Score</Label>
                <p className="font-medium">{testCase.result.score?.toFixed(1) || "N/A"}</p>
              </div>
            </div>
            
            <div>
              <Label>Executed Rules</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {testCase.result.executedRules.map((rule, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {rule}
                  </Badge>
                ))}
              </div>
            </div>

            {testCase.result.flags.length > 0 && (
              <div>
                <Label>Flags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {testCase.result.flags.map((flag, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {testCase.result.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Warnings: {testCase.result.warnings.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground">
              Execution time: {testCase.result.executionTime.toFixed(0)}ms
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Results View Component
function ResultsView({ 
  testCases, 
  bulkResults 
}: {
  testCases: TestCase[]
  bulkResults: Record<string, SimulationResult>
}) {
  const hasResults = Object.keys(bulkResults).length > 0 || testCases.some(tc => tc.result)

  if (!hasResults) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No Results Yet</p>
          <p className="text-sm">Run some tests to see results here</p>
        </div>
      </div>
    )
  }

  const allResults = testCases.map(tc => ({
    testCase: tc,
    result: bulkResults[tc.id] || tc.result
  })).filter(item => item.result)

  const approvedCount = allResults.filter(item => item.result?.decision === "approve").length
  const declinedCount = allResults.filter(item => item.result?.decision === "decline").length
  const avgExecutionTime = allResults.reduce((sum, item) => sum + (item.result?.executionTime || 0), 0) / allResults.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{declinedCount}</div>
            <p className="text-sm text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{avgExecutionTime.toFixed(0)}ms</div>
            <p className="text-sm text-muted-foreground">Avg. Execution Time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allResults.map(({ testCase, result }) => (
              <div key={testCase.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{testCase.name}</h4>
                  <p className="text-sm text-muted-foreground">{testCase.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={result?.decision === "approve" ? "default" : "destructive"}
                  >
                    {result?.decision}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {result?.executionTime.toFixed(0)}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Performance View Component
function PerformanceView({ testCases }: { testCases: TestCase[] }) {
  const resultsWithTiming = testCases.filter(tc => tc.result)

  if (resultsWithTiming.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No Performance Data</p>
          <p className="text-sm">Run some tests to see performance metrics</p>
        </div>
      </div>
    )
  }

  const avgTime = resultsWithTiming.reduce((sum, tc) => sum + (tc.result?.executionTime || 0), 0) / resultsWithTiming.length
  const maxTime = Math.max(...resultsWithTiming.map(tc => tc.result?.executionTime || 0))
  const minTime = Math.min(...resultsWithTiming.map(tc => tc.result?.executionTime || 0))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{avgTime.toFixed(1)}ms</div>
            <p className="text-sm text-muted-foreground">Average Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{maxTime.toFixed(1)}ms</div>
            <p className="text-sm text-muted-foreground">Max Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{minTime.toFixed(1)}ms</div>
            <p className="text-sm text-muted-foreground">Min Time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {resultsWithTiming.map((testCase) => (
              <div key={testCase.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{testCase.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${((testCase.result?.executionTime || 0) / maxTime) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {testCase.result?.executionTime.toFixed(0)}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}