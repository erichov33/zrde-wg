"use client"

import dynamic from 'next/dynamic'

const WorkflowAnalytics = dynamic(() => import('@/components/workflows/workflow-analytics').then(m => m.WorkflowAnalytics), {
  ssr: false,
  loading: () => <div className="p-4">Loading analytics…</div>
})

const WorkflowMonitoring = dynamic(() => import('@/components/workflows/workflow-monitoring').then(m => m.WorkflowMonitoring), {
  ssr: false,
  loading: () => <div className="p-4">Loading monitoring…</div>
})

export default function AnalyticsPage({ workflowId }: { workflowId?: string }) {
  return (
    <div className="space-y-8 p-4">
      <WorkflowAnalytics workflowId={workflowId || 'workflow-123'} onRefresh={() => {}} />
      <WorkflowMonitoring />
    </div>
  )
}

