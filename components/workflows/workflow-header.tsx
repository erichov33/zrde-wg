import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Workflow, Activity } from "lucide-react"
import Link from "next/link"

export function WorkflowHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Decision Workflows</h1>
          <p className="text-muted-foreground">Design and manage automated decision processes</p>
        </div>
        <Link href="/dashboard/workflows/builder">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Workflow className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Activity className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">1.2M</p>
                <p className="text-sm text-muted-foreground">Decisions Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10 border border-chart-3/20">
                <Badge className="bg-accent/10 text-accent border-accent/20">99.2%</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
