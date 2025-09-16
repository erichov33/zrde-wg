"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

const data = [
  { range: "0-200", count: 45, label: "Very High Risk" },
  { range: "201-400", count: 123, label: "High Risk" },
  { range: "401-600", count: 287, label: "Medium Risk" },
  { range: "601-800", count: 456, label: "Low Risk" },
  { range: "801-1000", count: 234, label: "Very Low Risk" },
]

const chartConfig = {
  count: {
    label: "Applications",
    color: "hsl(var(--primary))",
  },
}

export function RiskDistribution() {
  return (
    <Card className="shadow-lg border-2 border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent pb-6">
        <div className="space-y-2">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Risk Score Distribution
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium">
            Application distribution across risk score ranges (Last 7 days)
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-lg blur-xl" />
          <ChartContainer config={chartConfig} className="h-[300px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                className="drop-shadow-sm"
              >
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <ChartTooltip 
                  content={({ active, payload, label, coordinate }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <ChartTooltipContent 
                        active={active}
                        payload={payload}
                        label={label}
                        coordinate={coordinate}
                        accessibilityLayer={false}
                        className="bg-card/95 backdrop-blur-sm border-2 shadow-lg" 
                      />
                    );
                  }} 
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.2, rx: 4 }} 
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#barGradient)" 
                  radius={[6, 6, 0, 0]} 
                  className="drop-shadow-sm hover:opacity-80 transition-opacity duration-200"
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
