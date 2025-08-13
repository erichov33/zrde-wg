import { ApplicationHeader } from "@/components/applications/application-header"
import { ApplicationPipeline } from "@/components/applications/application-pipeline"
import { ApplicationFilters } from "@/components/applications/application-filters"
import { ApplicationList } from "@/components/applications/application-list"

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <ApplicationHeader />
      <ApplicationPipeline />
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ApplicationFilters />
        </div>
        <div className="lg:col-span-3">
          <ApplicationList />
        </div>
      </div>
    </div>
  )
}
