"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"
import { CheckCircle, XCircle, AlertTriangle, Activity, Clock, Zap } from "lucide-react"

interface IntegrationModalProps {
  integration: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

// Mock data for charts
const responseTimeData = [
  { time: "00:00", responseTime: 189, calls: 45 },
  { time: "04:00", responseTime: 156, calls: 23 },
  { time: "08:00", responseTime: 234, calls: 89 },
  { time: "12:00", responseTime: 198, calls: 156 },
  { time: "16:00", responseTime: 167, calls: 134 },
  { time: "20:00", responseTime: 145, calls: 78 },
]

const errorData = [
  { endpoint: "verify", errors: 2, total: 1247 },
  { endpoint: "authenticate", errors: 0, total: 892 },
  { endpoint: "liveness-check", errors: 1, total: 456 },
]

const recentLogs = [
  {
    id: "log-001",
    timestamp: "2024-01-25T14:32:15Z",
    endpoint: "/verify",
    status: "success",
    responseTime: 189,
    statusCode: 200,
  },
  {
    id: "log-002",
    timestamp: "2024-01-25T14:31:45Z",
    endpoint: "/authenticate",
    status: "success",
    responseTime: 156,
    statusCode: 200,
  },
  {
    id: "log-003",
    timestamp: "2024-01-25T14:31:12Z",
    endpoint: "/verify",
    status: "error",
    responseTime: 5000,
    statusCode: 500,
    error: "Service temporarily unavailable",
  },
]

const chartConfig = {
  responseTime: {
    label: "Response Time (ms)",
    color: "hsl(var(--primary))",
  },
  calls: {
    label: "API Calls",
    color: "hsl(var(--accent))",
  },
}

export function IntegrationModal({ integration, open, onOpenChange, onClose }: IntegrationModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!integration) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-accent" />
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {integration.name}
            <Badge variant="outline">{integration.type}</Badge>
          </DialogTitle>
          <DialogDescription>{integration.description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">{integration.health}%</p>
                      <p className="text-xs text-muted-foreground">Health Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{integration.responseTime}ms</p>
                      <p className="text-xs text-muted-foreground">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-chart-4" />
                    <div>
                      <p className="text-2xl font-bold">{integration.callsToday.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Calls Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">99.8%</p>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>API Quota Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span className="font-medium">
                      {integration.quota.used.toLocaleString()} / {integration.quota.limit.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={(integration.quota.used / integration.quota.limit) * 100} />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(((integration.quota.limit - integration.quota.used) / integration.quota.limit) * 100)}%
                    remaining this month
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {integration.endpoints.map((endpoint: string) => (
                    <div key={endpoint} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{endpoint}</span>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time & Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={responseTimeData}>
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
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
                            />
                          );
                        }} 
                      />
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

            <Card>
              <CardHeader>
                <CardTitle>Error Rate by Endpoint</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={errorData}>
                      <XAxis dataKey="endpoint" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
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
                            />
                          );
                        }} 
                      />
                      <Bar dataKey="errors" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-mono text-sm">{log.endpoint}</p>
                            <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{log.responseTime}ms</p>
                          <p className="text-xs text-muted-foreground">Status: {log.statusCode}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integration Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Version</p>
                    <p className="text-sm text-muted-foreground">{integration.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground capitalize">{integration.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rate Limit</p>
                    <p className="text-sm text-muted-foreground">1000 calls/minute</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Timeout</p>
                    <p className="text-sm text-muted-foreground">30 seconds</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="bg-transparent">
                    Test Connection
                  </Button>
                  <Button variant="outline" className="bg-transparent">
                    Regenerate API Key
                  </Button>
                  <Button variant="outline" className="bg-transparent">
                    Export Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
