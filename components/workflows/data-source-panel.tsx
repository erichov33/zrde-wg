"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Settings, Database, Globe, Key, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import type { WorkflowDefinition } from "@/lib/types/unified-workflow"
import { 
  DataSourceConfig, 
  convertExternalSourcesToIds,
  createDataRequirements 
} from "@/lib/types/workflow-definitions"

interface DataSourcePanelProps {
  workflow: Partial<WorkflowDefinition>
  onWorkflowUpdate: (updates: Partial<WorkflowDefinition>) => void
}

interface DataSource {
  id: string
  name: string
  type: "credit_bureau" | "kyc_provider" | "fraud_service" | "income_verification" | "bank_verification" | "custom_api"
  provider: string
  endpoint: string
  authentication: {
    type: "api_key" | "oauth" | "basic_auth" | "bearer_token"
    credentials: Record<string, string>
  }
  configuration: Record<string, any>
  status: "connected" | "disconnected" | "error" | "testing"
  lastTested?: string
  responseTime?: number
  errorMessage?: string
}

const DATA_SOURCE_TEMPLATES = {
  credit_bureau: {
    name: "Credit Bureau API",
    type: "credit_bureau" as const,
    provider: "Experian",
    endpoint: "https://api.experian.com/v1/credit-report",
    authentication: {
      type: "api_key" as const,
      credentials: { api_key: "", client_id: "" }
    },
    configuration: {
      timeout: 30000,
      retries: 3,
      format: "json"
    }
  },
  kyc_provider: {
    name: "KYC Verification",
    type: "kyc_provider" as const,
    provider: "Jumio",
    endpoint: "https://api.jumio.com/v1/verify",
    authentication: {
      type: "basic_auth" as const,
      credentials: { username: "", password: "" }
    },
    configuration: {
      verification_level: "standard",
      document_types: ["passport", "drivers_license", "id_card"]
    }
  },
  fraud_service: {
    name: "Fraud Detection",
    type: "fraud_service" as const,
    provider: "Sift",
    endpoint: "https://api.sift.com/v205/events",
    authentication: {
      type: "api_key" as const,
      credentials: { api_key: "" }
    },
    configuration: {
      score_threshold: 0.7,
      events: ["$create_account", "$login", "$transaction"]
    }
  },
  income_verification: {
    name: "Income Verification",
    type: "income_verification" as const,
    provider: "Plaid",
    endpoint: "https://api.plaid.com/income/verification/get",
    authentication: {
      type: "bearer_token" as const,
      credentials: { client_id: "", secret: "" }
    },
    configuration: {
      products: ["income", "employment"],
      verification_period: "12_months"
    }
  }
}

export function DataSourcePanel({ workflow, onWorkflowUpdate }: DataSourcePanelProps) {
  const [activeTab, setActiveTab] = useState("sources")
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: "ds-1",
      name: "Primary Credit Bureau",
      type: "credit_bureau",
      provider: "Experian",
      endpoint: "https://api.experian.com/v1/credit-report",
      authentication: {
        type: "api_key",
        credentials: { api_key: "***", client_id: "***" }
      },
      configuration: { timeout: 30000, retries: 3 },
      status: "connected",
      lastTested: "2024-01-15T10:30:00Z",
      responseTime: 245
    },
    {
      id: "ds-2", 
      name: "KYC Verification Service",
      type: "kyc_provider",
      provider: "Jumio",
      endpoint: "https://api.jumio.com/v1/verify",
      authentication: {
        type: "basic_auth",
        credentials: { username: "***", password: "***" }
      },
      configuration: { verification_level: "standard" },
      status: "error",
      errorMessage: "Authentication failed"
    }
  ])
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  const addDataSource = (template?: keyof typeof DATA_SOURCE_TEMPLATES) => {
    const baseSource = template ? DATA_SOURCE_TEMPLATES[template] : {
      name: "New Data Source",
      type: "custom_api" as const,
      provider: "",
      endpoint: "",
      authentication: {
        type: "api_key" as const,
        credentials: {}
      },
      configuration: {}
    }

    const newDataSource: DataSource = {
      id: `ds-${Date.now()}`,
      ...baseSource,
      status: "disconnected"
    }

    setDataSources(prev => [...prev, newDataSource])
    setSelectedDataSource(newDataSource)
  }

  const updateDataSource = (updates: Partial<DataSource>) => {
    if (!selectedDataSource) return

    const updated = { ...selectedDataSource, ...updates }
    setDataSources(prev => prev.map(ds => ds.id === selectedDataSource.id ? updated : ds))
    setSelectedDataSource(updated)

    // Update workflow data requirements
    updateWorkflowDataRequirements()
  }

  const deleteDataSource = (dataSourceId: string) => {
    setDataSources(prev => prev.filter(ds => ds.id !== dataSourceId))
    if (selectedDataSource?.id === dataSourceId) {
      setSelectedDataSource(null)
    }
    updateWorkflowDataRequirements()
  }

  const testConnection = async (dataSource: DataSource) => {
    setIsTestingConnection(true)
    
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const success = Math.random() > 0.3 // 70% success rate for demo
    const responseTime = Math.random() * 500 + 100
    
    const updates: Partial<DataSource> = {
      status: success ? "connected" : "error",
      lastTested: new Date().toISOString(),
      responseTime: success ? responseTime : undefined,
      errorMessage: success ? undefined : "Connection timeout"
    }
    
    setDataSources(prev => prev.map(ds => 
      ds.id === dataSource.id ? { ...ds, ...updates } : ds
    ))
    
    if (selectedDataSource?.id === dataSource.id) {
      setSelectedDataSource(prev => prev ? { ...prev, ...updates } : null)
    }
    
    setIsTestingConnection(false)
  }

  const updateWorkflowDataRequirements = () => {
    if (!workflow) return

    // Filter connected data sources
    const connectedDataSources = dataSources.filter(ds => ds.status === "connected")

    // Convert connected data sources to the format expected by WorkflowDefinition
    const externalSources: DataSourceConfig[] = connectedDataSources.map(source => ({
      id: source.id,
      name: source.name,
      type: source.type as any, // Will be properly typed
      endpoint: source.endpoint,
      timeout: 5000,
      retries: 2,
      enabled: true,
      fields: getDataSourceFields(source.type)
    }))

    // Convert to string array for the WorkflowDefinition
    const externalSourceIds = convertExternalSourcesToIds(externalSources)

    const updatedWorkflow = {
      ...workflow,
      dataRequirements: createDataRequirements(
        workflow.dataRequirements?.required || [],
        workflow.dataRequirements?.optional || [],
        externalSourceIds
      )
    }

    onWorkflowUpdate(updatedWorkflow)
  }

  const getDataSourceFields = (type: DataSource["type"]): string[] => {
    const fieldMap = {
      credit_bureau: ["creditScore", "creditHistory", "delinquencies", "creditUtilization"],
      kyc_provider: ["identityVerified", "documentType", "verificationLevel"],
      fraud_service: ["riskScore", "fraudFlags", "deviceFingerprint"],
      income_verification: ["monthlyIncome", "employmentStatus", "incomeStability"],
      bank_verification: ["accountBalance", "transactionHistory", "accountAge"],
      custom_api: ["customData"]
    }
    return fieldMap[type] || []
  }

  return (
    <div className="h-full flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Data Sources</h3>
            <p className="text-sm text-muted-foreground">
              Configure external data integrations for your workflow
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(value) => addDataSource(value as keyof typeof DATA_SOURCE_TEMPLATES)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Add from template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_bureau">Credit Bureau</SelectItem>
                <SelectItem value="kyc_provider">KYC Provider</SelectItem>
                <SelectItem value="fraud_service">Fraud Service</SelectItem>
                <SelectItem value="income_verification">Income Verification</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => addDataSource()} className="gap-2">
              <Plus className="h-4 w-4" />
              Custom Source
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50">
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="flex-1 flex m-0">
          <div className="w-1/3 border-r border-slate-200/50 dark:border-slate-700/50 p-4">
            <div className="space-y-2">
              {dataSources.map((dataSource) => (
                <Card 
                  key={dataSource.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedDataSource?.id === dataSource.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => setSelectedDataSource(dataSource)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{dataSource.name}</h4>
                      <StatusBadge status={dataSource.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {dataSource.provider} • {dataSource.type.replace('_', ' ')}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span>{dataSource.endpoint.split('/')[2]}</span>
                      {dataSource.responseTime && (
                        <span>{dataSource.responseTime.toFixed(0)}ms</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4">
            {selectedDataSource ? (
              <DataSourceEditor 
                dataSource={selectedDataSource}
                onUpdate={updateDataSource}
                onTest={() => testConnection(selectedDataSource)}
                onDelete={() => deleteDataSource(selectedDataSource.id)}
                isTestingConnection={isTestingConnection}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Data Source Selected</p>
                  <p className="text-sm">Select a data source to configure or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mapping" className="flex-1 m-0 p-4">
          <FieldMappingView dataSources={dataSources} workflow={workflow} onWorkflowUpdate={onWorkflowUpdate} />
        </TabsContent>

        <TabsContent value="monitoring" className="flex-1 m-0 p-4">
          <MonitoringView dataSources={dataSources} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: DataSource["status"] }) {
  const config = {
    connected: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", text: "Connected" },
    disconnected: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-50", text: "Disconnected" },
    error: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", text: "Error" },
    testing: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-50", text: "Testing" }
  }

  const { icon: Icon, color, bg, text } = config[status]

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bg}`}>
      <Icon className={`h-3 w-3 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>{text}</span>
    </div>
  )
}

// Data Source Editor Component
function DataSourceEditor({ 
  dataSource, 
  onUpdate, 
  onTest, 
  onDelete, 
  isTestingConnection 
}: {
  dataSource: DataSource
  onUpdate: (updates: Partial<DataSource>) => void
  onTest: () => void
  onDelete: () => void
  isTestingConnection: boolean
}) {
  const updateAuthentication = (field: string, value: string) => {
    onUpdate({
      authentication: {
        ...dataSource.authentication,
        credentials: {
          ...dataSource.authentication.credentials,
          [field]: value
        }
      }
    })
  }

  const updateConfiguration = (field: string, value: any) => {
    onUpdate({
      configuration: {
        ...dataSource.configuration,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Data Source Configuration</h3>
          <p className="text-sm text-muted-foreground">Configure connection and authentication</p>
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
            onClick={onTest}
            disabled={isTestingConnection}
            className="gap-2"
          >
            <TestTube className="h-4 w-4" />
            {isTestingConnection ? "Testing..." : "Test Connection"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={dataSource.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Data source name"
              />
            </div>
            <div>
              <Label>Provider</Label>
              <Input
                value={dataSource.provider}
                onChange={(e) => onUpdate({ provider: e.target.value })}
                placeholder="Provider name"
              />
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={dataSource.type}
              onValueChange={(value: DataSource["type"]) => onUpdate({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_bureau">Credit Bureau</SelectItem>
                <SelectItem value="kyc_provider">KYC Provider</SelectItem>
                <SelectItem value="fraud_service">Fraud Service</SelectItem>
                <SelectItem value="income_verification">Income Verification</SelectItem>
                <SelectItem value="bank_verification">Bank Verification</SelectItem>
                <SelectItem value="custom_api">Custom API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Endpoint URL</Label>
            <Input
              value={dataSource.endpoint}
              onChange={(e) => onUpdate({ endpoint: e.target.value })}
              placeholder="https://api.example.com/v1/endpoint"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Authentication Type</Label>
            <Select
              value={dataSource.authentication.type}
              onValueChange={(value: DataSource["authentication"]["type"]) => 
                onUpdate({
                  authentication: { ...dataSource.authentication, type: value }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="oauth">OAuth 2.0</SelectItem>
                <SelectItem value="basic_auth">Basic Auth</SelectItem>
                <SelectItem value="bearer_token">Bearer Token</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dataSource.authentication.type === "api_key" && (
            <div className="space-y-3">
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={dataSource.authentication.credentials.api_key || ""}
                  onChange={(e) => updateAuthentication("api_key", e.target.value)}
                  placeholder="Enter API key"
                />
              </div>
              {dataSource.type === "credit_bureau" && (
                <div>
                  <Label>Client ID</Label>
                  <Input
                    value={dataSource.authentication.credentials.client_id || ""}
                    onChange={(e) => updateAuthentication("client_id", e.target.value)}
                    placeholder="Enter client ID"
                  />
                </div>
              )}
            </div>
          )}

          {dataSource.authentication.type === "basic_auth" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={dataSource.authentication.credentials.username || ""}
                  onChange={(e) => updateAuthentication("username", e.target.value)}
                  placeholder="Username"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={dataSource.authentication.credentials.password || ""}
                  onChange={(e) => updateAuthentication("password", e.target.value)}
                  placeholder="Password"
                />
              </div>
            </div>
          )}

          {dataSource.authentication.type === "bearer_token" && (
            <div className="space-y-3">
              <div>
                <Label>Client ID</Label>
                <Input
                  value={dataSource.authentication.credentials.client_id || ""}
                  onChange={(e) => updateAuthentication("client_id", e.target.value)}
                  placeholder="Client ID"
                />
              </div>
              <div>
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  value={dataSource.authentication.credentials.secret || ""}
                  onChange={(e) => updateAuthentication("secret", e.target.value)}
                  placeholder="Client Secret"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Timeout (ms)</Label>
              <Input
                type="number"
                value={dataSource.configuration.timeout || 30000}
                onChange={(e) => updateConfiguration("timeout", parseInt(e.target.value))}
                placeholder="30000"
              />
            </div>
            <div>
              <Label>Retry Attempts</Label>
              <Input
                type="number"
                value={dataSource.configuration.retries || 3}
                onChange={(e) => updateConfiguration("retries", parseInt(e.target.value))}
                placeholder="3"
              />
            </div>
          </div>

          {dataSource.type === "fraud_service" && (
            <div>
              <Label>Risk Score Threshold</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={dataSource.configuration.score_threshold || 0.7}
                onChange={(e) => updateConfiguration("score_threshold", parseFloat(e.target.value))}
                placeholder="0.7"
              />
            </div>
          )}

          {dataSource.type === "kyc_provider" && (
            <div>
              <Label>Verification Level</Label>
              <Select
                value={dataSource.configuration.verification_level || "standard"}
                onValueChange={(value) => updateConfiguration("verification_level", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {dataSource.status === "error" && dataSource.errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connection Error: {dataSource.errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {dataSource.status === "connected" && dataSource.lastTested && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully connected. Last tested: {new Date(dataSource.lastTested).toLocaleString()}
            {dataSource.responseTime && ` (${dataSource.responseTime.toFixed(0)}ms)`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Field Mapping View Component
function FieldMappingView({ 
  dataSources, 
  workflow, 
  onWorkflowUpdate 
}: {
  dataSources: DataSource[]
  workflow: Partial<WorkflowDefinition>
  onWorkflowUpdate: (updates: Partial<WorkflowDefinition>) => void
}) {
  const connectedSources = dataSources.filter(ds => ds.status === "connected")

  if (connectedSources.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Connected Data Sources</p>
          <p className="text-sm">Connect data sources to configure field mapping</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Field Mapping</h3>
        <p className="text-sm text-muted-foreground">
          Map external data fields to your workflow variables
        </p>
      </div>

      {connectedSources.map((dataSource) => (
        <Card key={dataSource.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {dataSource.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getDataSourceFields(dataSource.type).map((field) => (
                <div key={field} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{field}</p>
                    <p className="text-sm text-muted-foreground">
                      From {dataSource.provider}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">→</span>
                    <Input
                      placeholder="workflow.variable"
                      className="w-48"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Monitoring View Component
function MonitoringView({ dataSources }: { dataSources: DataSource[] }) {
  const connectedSources = dataSources.filter(ds => ds.status === "connected")
  const errorSources = dataSources.filter(ds => ds.status === "error")
  const avgResponseTime = connectedSources.reduce((sum, ds) => sum + (ds.responseTime || 0), 0) / connectedSources.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{connectedSources.length}</div>
            <p className="text-sm text-muted-foreground">Connected Sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{errorSources.length}</div>
            <p className="text-sm text-muted-foreground">Error Sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dataSources.map((dataSource) => (
              <div key={dataSource.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <StatusBadge status={dataSource.status} />
                  <div>
                    <h4 className="font-medium">{dataSource.name}</h4>
                    <p className="text-sm text-muted-foreground">{dataSource.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  {dataSource.responseTime && (
                    <p className="text-sm font-medium">{dataSource.responseTime.toFixed(0)}ms</p>
                  )}
                  {dataSource.lastTested && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(dataSource.lastTested).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get data source fields
function getDataSourceFields(type: DataSource["type"]): string[] {
  const fieldMap = {
    credit_bureau: ["creditScore", "creditHistory", "delinquencies", "creditUtilization"],
    kyc_provider: ["identityVerified", "documentType", "verificationLevel"],
    fraud_service: ["riskScore", "fraudFlags", "deviceFingerprint"],
    income_verification: ["monthlyIncome", "employmentStatus", "incomeStability"],
    bank_verification: ["accountBalance", "transactionHistory", "accountAge"],
    custom_api: ["customData"]
  }
  return fieldMap[type] || []
}