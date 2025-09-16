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
      return <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-md">Active</Badge>
    case "paused":
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
          Paused
        </Badge>
      )
    case "draft":
      return <Badge className="bg-gradient-to-r from-slate-500 to-gray-500 text-white border-0 shadow-md">Draft</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

export function WorkflowList() {
  return (
    <div className="grid gap-8">
      {workflows.map((workflow) => (
        <Card key={workflow.id} className="group hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-700/30 border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                    {workflow.name}
                  </CardTitle>
                  {getStatusBadge(workflow.status)}
                  <Badge variant="outline" className="text-xs bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 font-medium">
                    {workflow.version}
                  </Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">{workflow.description}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-700">
                  <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <Link href={`/dashboard/workflows/builder?id=${workflow.id}`}>
                    <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Workflow
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  {workflow.status === "active" ? (
                    <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-destructive hover:bg-red-50 dark:hover:bg-red-950/20">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-6">
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Decisions Processed</p>
                <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{workflow.decisions.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Accuracy Rate</p>
                <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{workflow.accuracy}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Last Modified</p>
                <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{workflow.lastModified}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Author</p>
                <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{workflow.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/dashboard/workflows/builder?id=${workflow.id}`}>
                <Button variant="outline" size="sm" className="gap-2 bg-white/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
                  <Edit className="h-3 w-3" />
                  Edit Workflow
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
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
