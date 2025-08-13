import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Zap, Clock, AlertCircle } from "lucide-react"

const stats = [
  {
    title: "API Calls Today",
    value: "847K",
    change: "+12.3%",
    trend: "up",
    icon: Zap,
    description: "Across all integrations",
  },
  {
    title: "Average Response Time",
    value: "245ms",
    change: "-8.2%",
    trend: "up", // Lower response time is better
    icon: Clock,
    description: "Last 24 hours",
  },
  {
    title: "Success Rate",
    value: "99.7%",
    change: "+0.1%",
    trend: "up",
    icon: TrendingUp,
    description: "API call success rate",
  },
  {
    title: "Active Alerts",
    value: "3",
    change: "+2",
    trend: "down", // More alerts is bad
    icon: AlertCircle,
    description: "Requiring attention",
  },
]

export function IntegrationStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={stat.trend === "up" ? "default" : "secondary"}
                  className={`gap-1 ${
                    stat.trend === "up" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </Badge>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
