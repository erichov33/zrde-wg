import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Shield, Users, Zap } from "lucide-react"

const kpis = [
  {
    title: "Approval Rate",
    value: "87.3%",
    change: "+2.1%",
    trend: "up",
    icon: TrendingUp,
    description: "Last 24 hours",
  },
  {
    title: "Fraud Detection",
    value: "99.7%",
    change: "+0.3%",
    trend: "up",
    icon: Shield,
    description: "Accuracy rate",
  },
  {
    title: "Processing Volume",
    value: "1.2M",
    change: "+15.2%",
    trend: "up",
    icon: Zap,
    description: "Decisions today",
  },
  {
    title: "Active Users",
    value: "2,847",
    change: "-1.2%",
    trend: "down",
    icon: Users,
    description: "This month",
  },
]

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={kpi.trend === "up" ? "default" : "secondary"}
                  className={`gap-1 ${
                    kpi.trend === "up" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {kpi.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.change}
                </Badge>
                <span className="text-xs text-muted-foreground">{kpi.description}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
