"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, AlertTriangle, CheckCircle, Clock, 
  Pause, Play, Square, Zap, TrendingUp, 
  Users, Server, Database, RefreshCw,
  Filter, Download, Settings
} from "lucide-react"

interface WorkflowMonitoringProps {
  onExecutionSelect?: (executionId: string) => void
}

interface ExecutionStatus {
  id: string
  workflowId: string
  workflowName: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'queued'
  progress: number
  startTime: Date
  endTime?: Date
  duration?: number
  currentNode?: string
  userId?: string
  priority: 'low' | 'normal' | 'high'
  metrics: {
    nodesExecuted: number
    totalNodes: number
    errorCount: number
    retryCount: number
  }
}

interface SystemMetrics {
  activeExecutions: number
  queuedExecutions: number
  completedToday: number
  failureRate: number
  averageExecutionTime: number
  systemLoad: number
  memoryUsage: number
  throughput: number
}

interface AlertItem {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  workflowId?: string
  executionId?: string
  acknowledged: boolean
}

/**
 * WorkflowMonitoring component provides real-time monitoring of workflow executions
 * including system metrics, active executions, alerts, and performance insights
 */
export function WorkflowMonitoring({ onExecutionSelect }: WorkflowMonitoringProps) {
  const [executions, setExecutions] = useState<ExecutionStatus[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000)

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadMonitoringData = () => {
      // Mock executions
      const mockExecutions: ExecutionStatus[] = [
        {
          id: 'exec-1',
          workflowId: 'wf-1',
          workflowName: 'Credit Assessment',
          status: 'running',
          progress: 65,
          startTime: new Date(Date.now() - 120000),
          currentNode: 'Decision Engine',
          userId: 'user-123',
          priority: 'high',
          metrics: { nodesExecuted: 4, totalNodes: 7, errorCount: 0, retryCount: 1 }
        },
        {
          id: 'exec-2',
          workflowId: 'wf-2',
          workflowName: 'Fraud Detection',
          status: 'completed',
          progress: 100,
          startTime: new Date(Date.now() - 300000),
          endTime: new Date(Date.now() - 60000),
          duration: 240000,
          userId: 'user-456',
          priority: 'normal',
          metrics: { nodesExecuted: 5, totalNodes: 5, errorCount: 0, retryCount: 0 }
        },
        {
          id: 'exec-3',
          workflowId: 'wf-1',
          workflowName: 'Credit Assessment',
          status: 'failed',
          progress: 30,
          startTime: new Date(Date.now() - 180000),
          endTime: new Date(Date.now() - 120000),
          duration: 60000,
          currentNode: 'Data Validation',
          userId: 'user-789',
          priority: 'normal',
          metrics: { nodesExecuted: 2, totalNodes: 7, errorCount: 1, retryCount: 3 }
        },
        {
          id: 'exec-4',
          workflowId: 'wf-3',
          workflowName: 'KYC Verification',
          status: 'queued',
          progress: 0,
          startTime: new Date(),
          userId: 'user-101',
          priority: 'low',
          metrics: { nodesExecuted: 0, totalNodes: 6, errorCount: 0, retryCount: 0 }
        }
      ]

      // Mock system metrics
      const mockSystemMetrics: SystemMetrics = {
        activeExecutions: 3,
        queuedExecutions: 12,
        completedToday: 247,
        failureRate: 5.2,
        averageExecutionTime: 2.3,
        systemLoad: 68,
        memoryUsage: 72,
        throughput: 45
      }

      // Mock alerts
      const mockAlerts: AlertItem[] = [
        {
          id: 'alert-1',
          type: 'error',
          title: 'High Failure Rate',
          message: 'Credit Assessment workflow has a 15% failure rate in the last hour',
          timestamp: new Date(Date.now() - 300000),
          workflowId: 'wf-1',
          acknowledged: false
        },
        {
          id: 'alert-2',
          type: 'warning',
          title: 'Queue Backlog',
          message: 'Execution queue has 12 pending workflows',
          timestamp: new Date(Date.now() - 600000),
          acknowledged: false
        },
        {
          id: 'alert-3',
          type: 'info',
          title: 'System Update',
          message: 'Workflow engine updated to version 2.1.0',
          timestamp: new Date(Date.now() - 3600000),
          acknowledged: true
        }
      ]

      setExecutions(mockExecutions)
      setSystemMetrics(mockSystemMetrics)
      setAlerts(mockAlerts)
    }

    loadMonitoringData()

    // Set up auto-refresh
    let intervalId: NodeJS.Timeout
    if (autoRefresh) {
      intervalId = setInterval(loadMonitoringData, refreshInterval)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [autoRefresh, refreshInterval])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'cancelled': return <Square className="h-4 w-4 text-gray-600" />
      case 'queued': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'queued': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info': return <Activity className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredExecutions = executions.filter(execution => {
    const statusMatch = selectedStatus === 'all' || execution.status === selectedStatus
    const priorityMatch = selectedPriority === 'all' || execution.priority === selectedPriority
    return statusMatch && priorityMatch
  })

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Monitoring</h2>
          <p className="text-muted-foreground">Real-time monitoring of workflow executions and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Executions</p>
                  <p className="text-2xl font-bold">{systemMetrics.activeExecutions}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Queue Length</p>
                  <p className="text-2xl font-bold">{systemMetrics.queuedExecutions}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{(100 - systemMetrics.failureRate).toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <Progress value={100 - systemMetrics.failureRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Throughput</p>
                  <p className="text-2xl font-bold">{systemMetrics.throughput}/min</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions">Active Executions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Executions List */}
          <div className="space-y-4">
            {filteredExecutions.map((execution) => (
              <Card key={execution.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6" onClick={() => onExecutionSelect?.(execution.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(execution.status)}
                        <h4 className="font-semibold">{execution.workflowName}</h4>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                        <Badge className={getPriorityColor(execution.priority)}>
                          {execution.priority}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Execution ID:</span> {execution.id}
                        </div>
                        <div>
                          <span className="font-medium">Started:</span> {execution.startTime.toLocaleTimeString()}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {
                            execution.duration 
                              ? formatDuration(execution.duration)
                              : formatDuration(Date.now() - execution.startTime.getTime())
                          }
                        </div>
                      </div>

                      {execution.currentNode && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Current Node:</span> {execution.currentNode}
                        </div>
                      )}

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{execution.progress}%</span>
                        </div>
                        <Progress value={execution.progress} className="h-2" />
                      </div>

                      <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                        <span>Nodes: {execution.metrics.nodesExecuted}/{execution.metrics.totalNodes}</span>
                        <span>Errors: {execution.metrics.errorCount}</span>
                        <span>Retries: {execution.metrics.retryCount}</span>
                        {execution.userId && <span>User: {execution.userId}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={alert.acknowledged ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.type)}
                      <div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-muted-foreground mt-1">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{alert.timestamp.toLocaleString()}</span>
                          {alert.workflowId && <span>Workflow: {alert.workflowId}</span>}
                          {alert.executionId && <span>Execution: {alert.executionId}</span>}
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {systemMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{systemMetrics.systemLoad}%</span>
                    </div>
                    <Progress value={systemMetrics.systemLoad} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{systemMetrics.memoryUsage}%</span>
                    </div>
                    <Progress value={systemMetrics.memoryUsage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg. Execution Time</span>
                    <span className="text-lg font-bold">{systemMetrics.averageExecutionTime}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed Today</span>
                    <span className="text-lg font-bold">{systemMetrics.completedToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Failure Rate</span>
                    <span className="text-lg font-bold text-red-600">{systemMetrics.failureRate}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}