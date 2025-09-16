"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, TrendingUp } from "lucide-react"

const regions = [
  { country: "Kenya", applications: 2847, approvalRate: 89.2, growth: "+12.3%", flag: "🇰🇪" },
  { country: "Nigeria", applications: 1923, approvalRate: 85.7, growth: "+8.1%", flag: "🇳🇬" },
  { country: "South Africa", applications: 1456, approvalRate: 91.4, growth: "+15.2%", flag: "🇿🇦" },
  { country: "Ghana", applications: 892, approvalRate: 87.9, growth: "+6.7%", flag: "🇬🇭" },
  { country: "Uganda", applications: 634, approvalRate: 83.2, growth: "+9.4%", flag: "🇺🇬" },
]

export function GeographicAnalysis() {
  return (
    <Card className="shadow-lg border-2 border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="p-2 rounded-full bg-blue-100">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          Geographic Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground font-medium">Regional performance overview</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {regions.map((region, index) => (
            <div
              key={region.country}
              className="group relative overflow-hidden rounded-xl border-2 border-border/30 bg-gradient-to-r from-muted/20 to-transparent p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{region.flag}</span>
                  <div className="space-y-1">
                    <p className="font-semibold text-base text-foreground">{region.country}</p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {region.applications.toLocaleString()} applications
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">{region.approvalRate}%</span>
                    <Badge className="gap-1.5 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 shadow-sm">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {region.growth}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium bg-white/50 px-2 py-1 rounded-md">
                    Approval rate
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
