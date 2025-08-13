import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Database, Activity, AlertTriangle } from "lucide-react"

export function IntegrationHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Integration Management</h1>
          <p className="text-muted-foreground">Monitor and manage external data source connections</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* System Health Overview */}
      <Card className="bg-gradient-to-r from-card to-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-medium">All Systems Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">8 Active Integrations</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">99.2% Average Uptime</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <AlertTriangle className="h-3 w-3" />1 Warning
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
