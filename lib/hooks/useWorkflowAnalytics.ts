"use client"

import { useEffect, useMemo, useState } from "react"
import { auditLoggingService } from "@/lib/services/audit-logging-service"
import { workflowService } from "@/lib/services/unified-workflow-service"

export type TimeRange = "24h" | "7d" | "30d"

interface ExecutionMetrics {
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  errorCount: number
  lastExecution: Date | null
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

interface UseWorkflowAnalyticsResult {
  metrics: ExecutionMetrics | null
  performanceData: PerformanceData | null
  suggestions: Array<{ type: "performance" | "reliability" | "efficiency"; priority: "high" | "medium" | "low"; title: string; description: string; impact: string }>
  isLoading: boolean
  timeRange: TimeRange
  setTimeRange: (r: TimeRange) => void
  refresh: () => void
}

export function useWorkflowAnalytics(workflowId: string, initialRange: TimeRange = "7d"): UseWorkflowAnalyticsResult {
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [suggestions, setSuggestions] = useState<UseWorkflowAnalyticsResult["suggestions"]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange)

  const rangeWindow = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    if (timeRange === "24h") start.setDate(start.getDate() - 1)
    else if (timeRange === "7d") start.setDate(start.getDate() - 7)
    else start.setDate(start.getDate() - 30)
    return { start, end: now }
  }, [timeRange])

  async function load() {
    setIsLoading(true)

    const events = await auditLoggingService.queryEvents({
      resource: "workflow",
      resourceId: workflowId,
      action: "execute",
      startDate: rangeWindow.start,
      endDate: rangeWindow.end,
      limit: 10000,
      sortBy: "timestamp",
      sortOrder: "desc",
    })

    const total = events.length
    const successes = events.filter(e => e.outcome === "success").length
    const errors = events.filter(e => e.outcome !== "success").length
    const avgExecMs =
      total > 0
        ? Math.round(
            events.reduce((sum, e) => sum + Number(e.details?.executionTime || 0), 0) / total
          )
        : 0

    const last = events[0]?.timestamp || null

    const hourBuckets = new Map<number, number>()
    events.forEach(e => {
      const h = e.timestamp.getHours()
      hourBuckets.set(h, (hourBuckets.get(h) || 0) + 1)
    })
    let peakHour = null as number | null
    let peakCount = -1
    hourBuckets.forEach((count, h) => {
      if (count > peakCount) {
        peakCount = count
        peakHour = h
      }
    })
    const peakExecutionTime = peakHour !== null ? `${peakHour}:00 - ${((peakHour + 2) % 24)}:00` : "N/A"

    setMetrics({
      totalExecutions: total,
      successRate: total > 0 ? Number(((successes / total) * 100).toFixed(1)) : 0,
      averageExecutionTime: Number((avgExecMs / 1000).toFixed(2)),
      errorCount: errors,
      lastExecution: last,
      peakExecutionTime,
    })

    const trendMap = new Map<string, { executions: number; successes: number; totalTime: number }>()
    events.forEach(e => {
      const k = e.timestamp.toISOString().slice(0, 10)
      const entry = trendMap.get(k) || { executions: 0, successes: 0, totalTime: 0 }
      entry.executions += 1
      if (e.outcome === "success") entry.successes += 1
      entry.totalTime += Number(e.details?.executionTime || 0)
      trendMap.set(k, entry)
    })
    const executionTrends = Array.from(trendMap.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, v]) => ({
        date,
        executions: v.executions,
        successRate: Number(((v.successes / v.executions) * 100).toFixed(1)),
        averageTime: v.executions > 0 ? Number((v.totalTime / v.executions / 1000).toFixed(2)) : 0,
      }))

    const wf = await workflowService.getWorkflow(workflowId)
    const nodes = wf.nodes
    const avgPerNodeSec = nodes.length > 0 ? Number((avgExecMs / nodes.length / 1000).toFixed(2)) : 0
    const nodePerformance = nodes.map(n => ({
      nodeId: n.id,
      nodeName: n.data?.label || n.id,
      averageTime: avgPerNodeSec,
      errorRate: 0,
      executionCount: total,
    }))

    const errorGroups = new Map<string, { count: number; last: Date }>()
    events.filter(e => e.outcome !== "success").forEach(e => {
      const type = (e.details?.errorType as string) || "Unknown"
      const current = errorGroups.get(type) || { count: 0, last: e.timestamp }
      current.count += 1
      if (e.timestamp > current.last) current.last = e.timestamp
      errorGroups.set(type, current)
    })
    const errorAnalysis = Array.from(errorGroups.entries()).map(([errorType, v]) => ({
      errorType,
      count: v.count,
      percentage: total > 0 ? Number(((v.count / total) * 100).toFixed(1)) : 0,
      lastOccurrence: v.last,
    }))

    setPerformanceData({ nodePerformance, executionTrends, errorAnalysis })

    const s: UseWorkflowAnalyticsResult["suggestions"] = []
    if (total > 0 && (successes / total) < 0.9) {
      s.push({
        type: "reliability",
        priority: "high",
        title: "Improve success rate",
        description: "Investigate frequent failure types and add retries or fallbacks",
        impact: "Potential +5-10% success rate",
      })
    }
    if (avgExecMs > 2500) {
      s.push({
        type: "performance",
        priority: "medium",
        title: "Reduce execution time",
        description: "Optimize data sources and parallelize independent nodes",
        impact: "Potential -10-20% execution time",
      })
    }
    if (nodes.length > 20) {
      s.push({
        type: "efficiency",
        priority: "low",
        title: "Simplify workflow",
        description: "Consider splitting into sub-workflows and consolidating conditions",
        impact: "Lower complexity and easier maintenance",
      })
    }
    setSuggestions(s)

    setIsLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, rangeWindow.start.getTime(), rangeWindow.end.getTime()])

  const refresh = () => {
    load()
  }

  return { metrics, performanceData, suggestions, isLoading, timeRange, setTimeRange, refresh }
}

