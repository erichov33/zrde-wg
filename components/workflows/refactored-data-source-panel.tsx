"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, CheckCircle, XCircle, Clock, Settings, Plus, Trash2 } from "lucide-react"

// Import our new business logic and configuration
import { DataSourceManager, type DataSourceResult } from "@/lib/business/data-source-manager"
import { DATA_SOURCE_CONFIG } from "@/lib/config/business-rules"
import { type DataSourceConfig, type DataSourceType } from "@/lib/types/workflow"

// ============================================================================
// Hooks for Data Source Management
// ============================================================================

/**
 * Custom hook for managing data source configurations
 */
function useDataSources() {
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addDataSource = useCallback((dataSource: Omit<DataSourceConfig, 'id'>) => {
    const newDataSource: DataSourceConfig = {
      ...dataSource,
      id: `ds-${Date.now()}`
    }
    setDataSources(prev => [...prev, newDataSource])
  }, [])

  const updateDataSource = useCallback((id: string, updates: Partial<DataSourceConfig>) => {
    setDataSources(prev => prev.map(ds => 
      ds.id === id ? { ...ds, ...updates } : ds
    ))
  }, [])

  const deleteDataSource = useCallback((id: string) => {
    setDataSources(prev => prev.filter(ds => ds.id !== id))
  }, [])

  const loadDefaultDataSources = useCallback(() => {
    setIsLoading(true)
    
    const defaultSources: Omit<DataSourceConfig, 'id'>[] = [
      {
        name: "Credit Bureau",
        type: "credit_bureau",
        endpoint: DATA_SOURCE_CONFIG.ENDPOINTS.CREDIT_BUREAU,
        timeout: DATA_SOURCE_CONFIG.TIMEOUT_MS,
        retryPolicy: {
          maxAttempts: DATA_SOURCE_CONFIG.RETRY_ATTEMPTS,
          backoffStrategy: "exponential"
        },
        caching: {
          enabled: true,
          ttl: DATA_SOURCE_CONFIG.CACHE_DURATION_MS,
          strategy: "memory"
        },
        fieldMapping: [
          { sourceField: "credit_score", targetField: "creditScore" },
          { sourceField: "payment_history", targetField: "paymentHistory" }
        ],
        validation: {
          schema: {
            fields: {
              creditScore: { type: "number", rules: [], nullable: false }
            },
            required: ["creditScore"]
          },
          strictMode: true,
          allowAdditionalFields: false
        }
      },
      {
        name: "Income Verification",
        type: "income_verification",
        endpoint: DATA_SOURCE_CONFIG.ENDPOINTS.INCOME_VERIFICATION,
        timeout: DATA_SOURCE_CONFIG.TIMEOUT_MS,
        retryPolicy: {
          maxAttempts: DATA_SOURCE_CONFIG.RETRY_ATTEMPTS,
          backoffStrategy: "exponential"
        },
        caching: {
          enabled: true,
          ttl: DATA_SOURCE_CONFIG.CACHE_DURATION_MS,
          strategy: "memory"
        },
        fieldMapping: [
          { sourceField: "annual_income", targetField: "income" },
          { sourceField: "employment_status", targetField: "employmentStatus" }
        ],
        validation: {
          schema: {
            fields: {
              income: { type: "number", rules: [], nullable: false }
            },
            required: ["income"]
          },
          strictMode: true,
          allowAdditionalFields: false
        }
      }
    ]

    defaultSources.forEach(ds => addDataSource(ds))
    setIsLoading(false)
  }, [addDataSource])

  return {
    dataSources,
    isLoading,
    addDataSource,
    updateDataSource,
    deleteDataSource,
    loadDefaultDataSources
  }
}

/**
 * Custom hook for testing data source connections
 */
function useDataSourceTesting() {
  const [testResults, setTestResults] = useState<Map<string, DataSourceResult>>(new Map())
  const [testingStates, setTestingStates] = useState<Map<string, boolean>>(new Map())

  const testConnection = useCallback(async (dataSource: DataSourceConfig) => {
    setTestingStates(prev => new Map(prev).set(dataSource.id, true))
    
    try {
      const result = await DataSourceManager.testConnection(dataSource.type)
      setTestResults(prev => new Map(prev).set(dataSource.id, result))
      return result
    } catch (error) {
      const errorResult: DataSourceResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        source: dataSource.type
      }
      setTestResults(prev => new Map(prev).set(dataSource.id, errorResult))
      return errorResult
    } finally {
      setTestingStates(prev => new Map(prev).set(dataSource.id, false))
    }
  }, [])

  const testAllConnections = useCallback(async (dataSources: DataSourceConfig[]) => {
    const results = await Promise.all(
      dataSources.map(ds => testConnection(ds))
    )
    return results
  }, [testConnection])

  const clearResults = useCallback(() => {
    setTestResults(new Map())
    setTestingStates(new Map())
  }, [])

  return {
    testResults,
    testingStates,
    testConnection,
    testAllConnections,
    clearResults
  }
}

// ============================================================================
// UI Components
// ============================================================================

/**
 * Data source form component
 */
function DataSourceForm({ 
  onSubmit, 
  onCancel,
  initialData 
}: { 
  onSubmit: (dataSource: Omit<DataSourceConfig, 'id'>) => void
  onCancel: () => void
  initialData?: Partial<DataSourceConfig>
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'credit_bureau' as DataSourceType,
    endpoint: initialData?.endpoint || '',
    timeout: initialData?.timeout || DATA_SOURCE_CONFIG.TIMEOUT_MS,
    authType: 'api_key' as const,
    apiKey: ''
  })

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      name: formData.name,
      type: formData.type,
      endpoint: formData.endpoint,
      timeout: formData.timeout,
      authentication: {
        type: formData.authType,
        credentials: { apiKey: formData.apiKey }
      },
      retryPolicy: {
        maxAttempts: DATA_SOURCE_CONFIG.RETRY_ATTEMPTS,
        backoffStrategy: "exponential"
      },
      caching: {
        enabled: true,
        ttl: DATA_SOURCE_CONFIG.CACHE_DURATION_MS,
        strategy: "memory"
      },
      fieldMapping: [],
      validation: {
        schema: { fields: {}, required: [] },
        strictMode: true,
        allowAdditionalFields: false
      }
    })
  }, [formData, onSubmit])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Data Source Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter data source name"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Type</label>
        <Select
          value={formData.type}
          onValueChange={(value: DataSourceType) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="credit_bureau">Credit Bureau</SelectItem>
            <SelectItem value="income_verification">Income Verification</SelectItem>
            <SelectItem value="fraud_detection">Fraud Detection</SelectItem>
            <SelectItem value="bank_verification">Bank Verification</SelectItem>
            <SelectItem value="kyc_provider">KYC Provider</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-sm font-medium">Endpoint URL</label>
        <Input
          value={formData.endpoint}
          onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
          placeholder="https://api.example.com/v1"
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Timeout (ms)</label>
        <Input
          type="number"
          value={formData.timeout}
          onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
          min="1000"
          max="30000"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">API Key</label>
        <Input
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Enter API key"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'} Data Source
        </Button>
      </div>
    </form>
  )
}

/**
 * Data source card component
 */
function DataSourceCard({ 
  dataSource, 
  testResult, 
  isTesting, 
  onTest, 
  onEdit, 
  onDelete 
}: {
  dataSource: DataSourceConfig
  testResult?: DataSourceResult
  isTesting: boolean
  onTest: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const getStatusIcon = () => {
    if (isTesting) return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
    if (!testResult) return <Database className="h-4 w-4 text-gray-400" />
    return testResult.success 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusText = () => {
    if (isTesting) return "Testing..."
    if (!testResult) return "Not tested"
    return testResult.success ? "Connected" : "Failed"
  }

  const getStatusColor = () => {
    if (isTesting) return "text-blue-600"
    if (!testResult) return "text-gray-500"
    return testResult.success ? "text-green-600" : "text-red-600"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">{dataSource.name}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={onTest} disabled={isTesting}>
              Test
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Settings className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CardDescription>
          <Badge variant="outline" className="mr-2">
            {dataSource.type.replace('_', ' ').toUpperCase()}
          </Badge>
          {dataSource.endpoint}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            Timeout: {dataSource.timeout}ms
          </div>
        </div>
        
        {testResult && !testResult.success && (
          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
            {testResult.error}
          </div>
        )}
        
        {testResult && testResult.success && (
          <div className="mt-2 text-sm text-gray-600">
            Last tested: {new Date(testResult.timestamp).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Main refactored data source panel component
 */
export function RefactoredDataSourcePanel() {
  const [activeTab, setActiveTab] = useState("sources")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSource, setEditingSource] = useState<DataSourceConfig | null>(null)
  
  const {
    dataSources,
    isLoading,
    addDataSource,
    updateDataSource,
    deleteDataSource,
    loadDefaultDataSources
  } = useDataSources()
  
  const {
    testResults,
    testingStates,
    testConnection,
    testAllConnections,
    clearResults
  } = useDataSourceTesting()

  const handleCreateDataSource = useCallback((dataSource: Omit<DataSourceConfig, 'id'>) => {
    addDataSource(dataSource)
    setShowCreateForm(false)
  }, [addDataSource])

  const handleUpdateDataSource = useCallback((dataSource: Omit<DataSourceConfig, 'id'>) => {
    if (editingSource) {
      updateDataSource(editingSource.id, dataSource)
      setEditingSource(null)
    }
  }, [editingSource, updateDataSource])

  const handleTestAll = useCallback(async () => {
    try {
      await testAllConnections(dataSources)
    } catch (error) {
      console.error('Failed to test connections:', error)
    }
  }, [dataSources, testAllConnections])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Data Sources</h2>
            <p className="text-sm text-gray-600">Configure external data integrations</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={loadDefaultDataSources}
              disabled={isLoading}
            >
              Load Defaults
            </Button>
            <Button 
              onClick={handleTestAll}
              disabled={dataSources.length === 0}
            >
              Test All
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="sources" className="h-full p-6">
              {showCreateForm || editingSource ? (
                <div className="max-w-md">
                  <h3 className="text-lg font-medium mb-4">
                    {editingSource ? 'Edit' : 'Create'} Data Source
                  </h3>
                  <DataSourceForm
                    initialData={editingSource || undefined}
                    onSubmit={editingSource ? handleUpdateDataSource : handleCreateDataSource}
                    onCancel={() => {
                      setShowCreateForm(false)
                      setEditingSource(null)
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Configured Data Sources</h3>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Data Source
                    </Button>
                  </div>
                  
                  {dataSources.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No data sources configured yet.</p>
                      <p className="text-sm">Add one to get started with external integrations.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {dataSources.map((dataSource) => (
                        <DataSourceCard
                          key={dataSource.id}
                          dataSource={dataSource}
                          testResult={testResults.get(dataSource.id)}
                          isTesting={testingStates.get(dataSource.id) || false}
                          onTest={() => testConnection(dataSource)}
                          onEdit={() => setEditingSource(dataSource)}
                          onDelete={() => deleteDataSource(dataSource.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="configuration" className="h-full p-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Global Configuration</h3>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Default Settings</CardTitle>
                      <CardDescription>
                        Global defaults for all data sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Default Timeout</label>
                          <div className="text-sm text-gray-600">
                            {DATA_SOURCE_CONFIG.TIMEOUT_MS}ms
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Retry Attempts</label>
                          <div className="text-sm text-gray-600">
                            {DATA_SOURCE_CONFIG.RETRY_ATTEMPTS}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Cache Duration</label>
                          <div className="text-sm text-gray-600">
                            {DATA_SOURCE_CONFIG.CACHE_DURATION_MS / 1000}s
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Cache Statistics</CardTitle>
                      <CardDescription>
                        Current cache status and performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        Cache statistics would be displayed here in a real implementation.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}