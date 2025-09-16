import { ApplicationDetail } from "@/components/applications/application-detail"

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id } = await params
  return <ApplicationDetail applicationId={id} />
}
