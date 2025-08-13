import { IntegrationHeader } from "@/components/integrations/integration-header"
import { IntegrationGrid } from "@/components/integrations/integration-grid"
import { IntegrationStats } from "@/components/integrations/integration-stats"

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <IntegrationHeader />
      <IntegrationStats />
      <IntegrationGrid />
    </div>
  )
}
