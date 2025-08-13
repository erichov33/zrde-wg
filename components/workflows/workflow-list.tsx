"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Play, Pause, Edit, Copy, Trash2, Eye } from "lucide-react"
import Link from "next/link"

const workflows = [
  {
    id: "wf-001",
    name: "Credit Application Review",
    description: "Automated credit decision workflow with risk assessment and fraud detection",
    status: "active",
    version: "v2.1",
    decisions: 45672,
    accuracy: 94.2,
    lastModified: "2 days ago",
    author: "Sarah Wilson",
  },
  {
    id: "wf-002",
    name: "Identity Verification",
    description: "KYC compliance workflow with biometric verification and document validation",
    status: "active",
    version: "v1.8",
    decisions: 23891,
    accuracy: 98.7,
    lastModified: "1 week ago",
    author: "Michael Chen",
  },
  {
    id: "wf-003",
    name: "Fraud Detection Pipeline",
    description: "Real-time fraud detection with behavioral analysis and risk scoring",
    status: "draft",
    version: "v1.0",
    decisions: 0,
    accuracy: 0,
    lastModified: "3 hours ago",
    author: "Emma Johnson",
  },
  {
    id: "wf-004",
    name: "Loan Underwriting",
    description: "Comprehensive loan approval process with income verification and credit checks",
    status: "paused",
    version: "v3.2",
    decisions: 12456,
    accuracy: 91.8,
    lastModified: "5 days ago",
    author: "David Brown",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-accent/10 text-accent border-accent/20">Active</Badge>
    case "paused":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          Paused
        </Badge>
      )
    case "draft":
      return <Badge variant="secondary">Draft</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

export function WorkflowList() {
  return (
    <div className="grid gap-6">
      {workflows.map((workflow) => (
        <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">{workflow.name}</CardTitle>
                  {getStatusBadge(workflow.status)}
                  <Badge variant="outline" className="text-xs">
                    {workflow.version}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{workflow.description}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Workflow
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  {workflow.status === "active" ? (
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
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Decisions Processed</p>
                <p className="font-semibold">{workflow.decisions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Accuracy Rate</p>
                <p className="font-semibold">{workflow.accuracy}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Modified</p>
                <p className="font-semibold">{workflow.lastModified}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Author</p>
                <p className="font-semibold">{workflow.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Link href="/dashboard/workflows/builder">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Edit className="h-3 w-3" />
                  Edit Workflow
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="gap-2">
                <Eye className="h-3 w-3" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
