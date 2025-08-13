import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, CheckCircle } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">Real-time insights and decision analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Live Data
          </Badge>
        </div>
      </div>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-card to-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">All Systems Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Processing: 1,247 decisions/min</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">Last updated: 2 seconds ago</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
