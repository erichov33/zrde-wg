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
    <div className="space-y-6">
      <h1>Test</h1>
    </div>
  )
}
