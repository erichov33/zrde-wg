"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, MessageSquare, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

const applications = [
  {
    id: "APP-2024-001247",
    applicantName: "John Doe",
    email: "john.doe@email.com",
    phone: "+254712345678",
    status: "review",
    riskScore: 567,
    amount: 50000,
    workflow: "Credit Application Review",
    submittedAt: "2024-01-25T10:30:00Z",
    lastActivity: "2024-01-25T14:22:00Z",
    assignedTo: "Sarah Wilson",
    priority: "high",
    documents: 4,
    notes: 2,
  },
  {
    id: "APP-2024-001246",
    applicantName: "Sarah Wilson",
    email: "sarah.wilson@email.com",
    phone: "+254723456789",
    status: "approved",
    riskScore: 823,
    amount: 25000,
    workflow: "Identity Verification",
    submittedAt: "2024-01-25T09:15:00Z",
    lastActivity: "2024-01-25T14:18:00Z",
    assignedTo: "Michael Chen",
    priority: "normal",
    documents: 3,
    notes: 1,
  },
  {
    id: "APP-2024-001245",
    applicantName: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "+254734567890",
    status: "declined",
    riskScore: 234,
    amount: 75000,
    workflow: "Credit Application Review",
    submittedAt: "2024-01-25T08:45:00Z",
    lastActivity: "2024-01-25T14:15:00Z",
    assignedTo: "Emma Johnson",
    priority: "normal",
    documents: 2,
    notes: 3,
  },
  {
    id: "APP-2024-001244",
    applicantName: "Emma Johnson",
    email: "emma.johnson@email.com",
    phone: "+254745678901",
    status: "processing",
    riskScore: 689,
    amount: 35000,
    workflow: "Fraud Detection Pipeline",
    submittedAt: "2024-01-25T07:30:00Z",
    lastActivity: "2024-01-25T14:10:00Z",
    assignedTo: "David Brown",
    priority: "normal",
    documents: 5,
    notes: 0,
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-accent" />
    case "declined":
      return <XCircle className="h-4 w-4 text-destructive" />
    case "review":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case "processing":
      return <Clock className="h-4 w-4 text-primary" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-accent/10 text-accent border-accent/20">Approved</Badge>
    case "declined":
      return <Badge variant="destructive">Declined</Badge>
    case "review":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          Review Required
        </Badge>
      )
    case "processing":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Processing</Badge>
    default:
      return <Badge variant="secondary">Submitted</Badge>
  }
}

const getRiskScoreColor = (score: number) => {
  if (score >= 700) return "text-accent"
  if (score >= 400) return "text-yellow-500"
  return "text-destructive"
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return (
        <Badge variant="destructive" className="text-xs">
          High
        </Badge>
      )
    case "medium":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">
          Medium
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-xs">
          Normal
        </Badge>
      )
  }
}

export function ApplicationList() {
  const [sortBy, setSortBy] = useState("submittedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {application.applicantName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{application.applicantName}</h3>
                    {getPriorityBadge(application.priority)}
                  </div>
                  <p className="text-sm text-muted-foreground">{application.email}</p>
                  <p className="text-sm text-muted-foreground">{application.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(application.status)}
                {getStatusBadge(application.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/applications/${application.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Note
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      View Documents
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Assign to Me</DropdownMenuItem>
                    <DropdownMenuItem>Change Status</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Application ID</p>
                <p className="font-mono text-sm">{application.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className={`font-semibold ${getRiskScoreColor(application.riskScore)}`}>{application.riskScore}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">{formatCurrency(application.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Workflow</p>
                <p className="text-sm truncate">{application.workflow}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-sm">{formatDate(application.submittedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="text-sm">{application.assignedTo}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {application.documents} documents
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {application.notes} notes
                </span>
                <span>Last activity: {formatDate(application.lastActivity)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/applications/${application.id}`}>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Eye className="h-3 w-3" />
                    View Details
                  </Button>
                </Link>
                {application.status === "review" && (
                  <Button size="sm" className="gap-2">
                    <CheckCircle className="h-3 w-3" />
                    Review Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
