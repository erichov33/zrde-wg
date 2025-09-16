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
    gradient: "from-emerald-500/10 to-green-500/10",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200/50",
  },
  {
    title: "Fraud Detection",
    value: "99.7%",
    change: "+0.3%",
    trend: "up",
    icon: Shield,
    description: "Accuracy rate",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200/50",
  },
  {
    title: "Processing Volume",
    value: "1.2M",
    change: "+15.2%",
    trend: "up",
    icon: Zap,
    description: "Decisions today",
    gradient: "from-purple-500/10 to-violet-500/10",
    iconColor: "text-purple-600",
    borderColor: "border-purple-200/50",
  },
  {
    title: "Active Users",
    value: "2,847",
    change: "-1.2%",
    trend: "down",
    icon: Users,
    description: "This month",
    gradient: "from-orange-500/10 to-amber-500/10",
    iconColor: "text-orange-600",
    borderColor: "border-orange-200/50",
  },
]

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <Card 
          key={kpi.title} 
          className={`relative overflow-hidden backdrop-blur-sm bg-gradient-to-br ${kpi.gradient} border-2 ${kpi.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-lg bg-white/10 backdrop-blur-sm ${kpi.iconColor} group-hover:scale-110 transition-transform duration-300`}>
              <kpi.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              <div className="text-3xl font-bold text-foreground tracking-tight">
                {kpi.value}
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={kpi.trend === "up" ? "default" : "secondary"}
                  className={`gap-1.5 px-3 py-1 font-medium shadow-sm ${
                    kpi.trend === "up" 
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" 
                      : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                  }`}
                >
                  {kpi.trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {kpi.change}
                </Badge>
                <span className="text-sm text-muted-foreground font-medium">
                  {kpi.description}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
