"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

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
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <p className="text-sm text-muted-foreground">System performance over 24 hours</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
