import AnalyticsPage from '@/components/dashboard/AnalyticsPage'

export default function Page({ params }: { params: { workflowId: string } }) {
  return <AnalyticsPage workflowId={params.workflowId} />
}
