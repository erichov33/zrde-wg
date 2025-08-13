"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp } from "lucide-react"

const regions = [
  { country: "Kenya", applications: 2847, approvalRate: 89.2, growth: "+12.3%" },
  { country: "Nigeria", applications: 1923, approvalRate: 85.7, growth: "+8.1%" },
  { country: "South Africa", applications: 1456, approvalRate: 91.4, growth: "+15.2%" },
  { country: "Ghana", applications: 892, approvalRate: 87.9, growth: "+6.7%" },
  { country: "Uganda", applications: 634, approvalRate: 83.2, growth: "+9.4%" },
]

export function GeographicAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Geographic Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">Regional performance overview</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {regions.map((region) => (
            <div
              key={region.country}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50"
            >
              <div className="space-y-1">
                <p className="font-medium">{region.country}</p>
                <p className="text-sm text-muted-foreground">{region.applications.toLocaleString()} applications</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{region.approvalRate}%</span>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    {region.growth}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Approval rate</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
