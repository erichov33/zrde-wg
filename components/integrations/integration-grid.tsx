"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { IntegrationModal } from "./integration-modal"
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  TestTube,
  BarChart3,
  Key,
  Pause,
  Play,
} from "lucide-react"

const integrations = [
  {
    id: "smile-identity",
    name: "Smile Identity",
    type: "Identity Verification",
    status: "active",
    health: 98.5,
    responseTime: 189,
    callsToday: 12847,
    quota: { used: 12847, limit: 50000 },
    lastCall: "2 minutes ago",
    version: "v2.1",
    description: "Biometric identity verification and KYC compliance",
    endpoints: ["verify", "authenticate", "liveness-check"],
  },
  {
    id: "transunion",
    name: "TransUnion Africa",
    type: "Credit Bureau",
    status: "active",
    health: 99.2,
    responseTime: 234,
    callsToday: 8934,
    quota: { used: 8934, limit: 25000 },
    lastCall: "5 minutes ago",
    version: "v3.0",
    description: "Credit reports and risk assessment data",
    endpoints: ["credit-report", "risk-score", "payment-history"],
  },
  {
    id: "mpesa",
    name: "M-Pesa API",
    type: "Payment Verification",
    status: "active",
    health: 97.8,
    responseTime: 156,
    callsToday: 15623,
    quota: { used: 15623, limit: 100000 },
    lastCall: "1 minute ago",
    version: "v1.0",
    description: "Mobile money transaction verification",
    endpoints: ["balance-inquiry", "transaction-status", "account-lookup"],
  },
  {
    id: "experian",
    name: "Experian Africa",
    type: "Credit Bureau",
    status: "warning",
    health: 85.3,
    responseTime: 456,
    callsToday: 3421,
    quota: { used: 3421, limit: 20000 },
    lastCall: "15 minutes ago",
    version: "v2.5",
    description: "Credit scoring and financial data",
    endpoints: ["credit-score", "affordability", "fraud-check"],
  },
  {
    id: "mtn-momo",
    name: "MTN Mobile Money",
    type: "Payment Verification",
    status: "inactive",
    health: 0,
    responseTime: 0,
    callsToday: 0,
    quota: { used: 0, limit: 50000 },
    lastCall: "2 days ago",
    version: "v1.2",
    description: "MTN mobile money integration",
    endpoints: ["balance", "transaction-history"],
  },
  {
    id: "youverify",
    name: "Youverify",
    type: "Identity Verification",
    status: "active",
    health: 96.7,
    responseTime: 298,
    callsToday: 5672,
    quota: { used: 5672, limit: 30000 },
    lastCall: "8 minutes ago",
    version: "v1.8",
    description: "Document verification and compliance",
    endpoints: ["document-verify", "address-verify", "phone-verify"],
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-accent" />
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "inactive":
      return <XCircle className="h-4 w-4 text-muted-foreground" />
    default:
      return <XCircle className="h-4 w-4 text-destructive" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-accent/10 text-accent border-accent/20">Active</Badge>
    case "warning":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          Warning
        </Badge>
      )
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>
    default:
      return <Badge variant="destructive">Error</Badge>
  }
}

const getHealthColor = (health: number) => {
  if (health >= 95) return "text-accent"
  if (health >= 85) return "text-yellow-500"
  return "text-destructive"
}

export function IntegrationGrid() {
  const [selectedIntegration, setSelectedIntegration] = useState<(typeof integrations)[0] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleViewDetails = (integration: (typeof integrations)[0]) => {
    setSelectedIntegration(integration)
    setModalOpen(true)
  }

  return (
    <>
      <div className="grid gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(integration.status)}
                    <CardTitle className="text-xl">{integration.name}</CardTitle>
                    {getStatusBadge(integration.status)}
                    <Badge variant="outline" className="text-xs">
                      {integration.version}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{integration.description}</p>
                  <Badge variant="outline" className="w-fit">
                    {integration.type}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(integration)}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <TestTube className="mr-2 h-4 w-4" />
                      Test Connection
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Key className="mr-2 h-4 w-4" />
                      Manage Keys
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {integration.status === "active" ? (
                      <DropdownMenuItem>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className={`text-lg font-semibold ${getHealthColor(integration.health)}`}>{integration.health}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-lg font-semibold">{integration.responseTime}ms</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Calls Today</p>
                  <p className="text-lg font-semibold">{integration.callsToday.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Call</p>
                  <p className="text-lg font-semibold">{integration.lastCall}</p>
                </div>
              </div>

              {/* Quota Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">API Quota Usage</span>
                  <span className="font-medium">
                    {integration.quota.used.toLocaleString()} / {integration.quota.limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={(integration.quota.used / integration.quota.limit) * 100} className="h-2" />
              </div>

              {/* Endpoints */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Available Endpoints</p>
                <div className="flex flex-wrap gap-1">
                  {integration.endpoints.map((endpoint) => (
                    <Badge key={endpoint} variant="outline" className="text-xs">
                      {endpoint}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <TestTube className="h-3 w-3" />
                  Test Connection
                </Button>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleViewDetails(integration)}>
                  <BarChart3 className="h-3 w-3" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <IntegrationModal
        integration={selectedIntegration}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedIntegration(null)
        }}
      />
    </>
  )
}
