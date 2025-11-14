"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, Clock, CheckCircle, AlertTriangle, 
  TrendingUp, Activity, Users, Zap, RefreshCw,
  Download, Filter, Calendar
} from "lucide-react"
import { useWorkflowAnalytics } from "@/lib/hooks/useWorkflowAnalytics"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts"

interface WorkflowAnalyticsProps {
  workflowId: string
  onRefresh?: () => void
}

interface ExecutionMetrics {
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  errorCount: number
  lastExecution: Date
  peakExecutionTime: string
}

interface PerformanceData {
  nodePerformance: Array<{
    nodeId: string
    nodeName: string
    averageTime: number
    errorRate: number
    executionCount: number
  }>
  executionTrends: Array<{
    date: string
    executions: number
    successRate: number
    averageTime: number
  }>
  errorAnalysis: Array<{
    errorType: string
    count: number
    percentage: number
    lastOccurrence: Date
  }>
}

interface OptimizationSuggestion {
  type: 'performance' | 'reliability' | 'efficiency'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
}

/**
 * WorkflowAnalytics component provides comprehensive insights into workflow performance
 * including execution metrics, performance trends, error analysis, and optimization suggestions
 */
export function WorkflowAnalytics({ workflowId, onRefresh }: WorkflowAnalyticsProps) {
  const { metrics, performanceData, suggestions, isLoading, timeRange, setTimeRange, refresh } = useWorkflowAnalytics(workflowId, '7d')
  const handleRefresh = () => {
    onRefresh?.()
    refresh()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="h-4 w-4" />
      case 'reliability': return <CheckCircle className="h-4 w-4" />
      case 'efficiency': return <TrendingUp className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Analytics</h2>
          <p className="text-muted-foreground">Performance insights and optimization recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                  <p className="text-2xl font-bold">{metrics.totalExecutions.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{metrics.successRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <Progress value={metrics.successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Execution Time</p>
                  <p className="text-2xl font-bold">{metrics.averageExecutionTime}s</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Error Count</p>
                  <p className="text-2xl font-bold">{metrics.errorCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {performanceData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Executions Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData.executionTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="executions" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Node Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Node Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData.nodePerformance} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nodeName" hide />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="averageTime" fill="#22c55e" name="Avg Time (s)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {performanceData.nodePerformance.map((node) => (
                      <div key={node.nodeId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{node.nodeName}</p>
                          <p className="text-sm text-muted-foreground">{node.executionCount} executions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{node.averageTime}s avg</p>
                          <p className={`text-xs ${node.errorRate > 3 ? 'text-red-600' : 'text-green-600'}`}>{node.errorRate}% error rate</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Execution Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Execution Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceData.executionTrends.slice(-5).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(trend.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {trend.executions} executions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{trend.successRate}% success</p>
                          <p className="text-xs text-muted-foreground">
                            {trend.averageTime}s avg time
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {performanceData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Error Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.errorAnalysis.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{error.errorType}</h4>
                          <Badge variant="outline">{error.count} occurrences</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Last occurred: {error.lastOccurrence.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{error.percentage}%</p>
                        <Progress value={error.percentage} className="w-20 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{suggestion.description}</p>
                      <p className="text-sm font-medium text-green-600">{suggestion.impact}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
