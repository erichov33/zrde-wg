import { WorkflowList } from "@/components/workflows/workflow-list"
import { WorkflowHeader } from "@/components/workflows/workflow-header"

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-primary opacity-5 rounded-3xl blur-3xl" />
          <div className="relative bg-card/60 backdrop-blur-glass border border-border/50 rounded-2xl p-8 shadow-custom-xl">
            <WorkflowHeader />
          </div>
        </div>
        <WorkflowList />
      </div>
    </div>
  )
}
