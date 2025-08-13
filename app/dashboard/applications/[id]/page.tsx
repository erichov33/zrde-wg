import { ApplicationDetail } from "@/components/applications/application-detail"

interface ApplicationDetailPageProps {
  params: { id: string }
}

export default function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  return <ApplicationDetail applicationId={params.id} />
}
