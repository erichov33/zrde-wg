import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, CheckCircle, Activity } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Real-time insights and decision analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-700 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
            <span className="font-semibold">Live Data</span>
          </Badge>
        </div>
      </div>

      {/* System Status */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-card via-card/95 to-primary/5 border-2 border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-accent/5" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100 shadow-sm">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-base font-semibold text-foreground">
                  All Systems Operational
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 shadow-sm">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Processing Rate</span>
                  <span className="text-sm text-muted-foreground">1,247 decisions/min</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 px-3 py-2 rounded-lg backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Last updated: 2 seconds ago
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
