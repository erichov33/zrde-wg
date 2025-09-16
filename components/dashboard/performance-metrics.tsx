"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Activity } from "lucide-react"

const data = [
  { time: "00:00", responseTime: 245, accuracy: 99.2 },
  { time: "04:00", responseTime: 189, accuracy: 99.5 },
  { time: "08:00", responseTime: 312, accuracy: 99.1 },
  { time: "12:00", responseTime: 278, accuracy: 99.3 },
  { time: "16:00", responseTime: 234, accuracy: 99.7 },
  { time: "20:00", responseTime: 198, accuracy: 99.4 },
]

const chartConfig = {
  responseTime: {
    label: "Response Time (ms)",
    color: "hsl(var(--primary))",
  },
  accuracy: {
    label: "Accuracy (%)",
    color: "hsl(var(--accent))",
  },
}

export function PerformanceMetrics() {
  return (
    <Card className="shadow-lg border-2 border-border/50 bg-gradient-to-br from-card to-card/95 hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
        <CardTitle className="flex items-center gap-3 text-lg font-bold">
          <div className="p-2 rounded-full bg-purple-100">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          Performance Metrics
        </CardTitle>
        <p className="text-sm text-muted-foreground font-medium">System performance over 24 hours</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-lg blur-xl" />
          <ChartContainer config={chartConfig} className="h-[200px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                className="drop-shadow-sm"
              >
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false} 
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
                />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5, className: "drop-shadow-sm" }}
                  activeDot={{ r: 7, className: "drop-shadow-md" }}
                  className="drop-shadow-sm"
                />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
