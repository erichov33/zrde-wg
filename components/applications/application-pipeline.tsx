import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, AlertTriangle, XCircle, Eye } from "lucide-react"

const pipelineStages = [
  {
    name: "Submitted",
    count: 247,
    color: "text-muted-foreground",
    bgColor: "bg-muted/10",
    icon: Clock,
  },
  {
    name: "Processing",
    count: 89,
    color: "text-primary",
    bgColor: "bg-primary/10",
    icon: Clock,
  },
  {
    name: "Review Required",
    count: 34,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    icon: AlertTriangle,
  },
  {
    name: "Approved",
    count: 1247,
    color: "text-accent",
    bgColor: "bg-accent/10",
    icon: CheckCircle,
  },
  {
    name: "Declined",
    count: 156,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    icon: XCircle,
  },
]

export function ApplicationPipeline() {
  const totalApplications = pipelineStages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Application Pipeline Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {pipelineStages.map((stage) => (
            <div key={stage.name} className="text-center">
              <div className={`p-3 rounded-lg ${stage.bgColor} mb-2 mx-auto w-fit`}>
                <stage.icon className={`h-6 w-6 ${stage.color}`} />
              </div>
              <p className="text-2xl font-bold">{stage.count.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{stage.name}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Flow Visualization */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Processing Flow</span>
            <span>{totalApplications.toLocaleString()} Total Applications</span>
          </div>
          <div className="flex gap-1">
            {pipelineStages.map((stage) => (
              <div
                key={stage.name}
                className={`h-2 rounded-sm ${stage.bgColor.replace("/10", "/50")}`}
                style={{ width: `${(stage.count / totalApplications) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-semibold">87.3%</p>
            <p className="text-xs text-muted-foreground">Approval Rate</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">2.4h</p>
            <p className="text-xs text-muted-foreground">Avg Processing Time</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">34</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
