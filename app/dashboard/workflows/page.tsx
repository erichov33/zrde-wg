import { WorkflowList } from "@/components/workflows/workflow-list"
import { WorkflowHeader } from "@/components/workflows/workflow-header"

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <WorkflowHeader />
      <WorkflowList />
    </div>
  )
}
