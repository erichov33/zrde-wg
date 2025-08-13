"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  Activity,
  Shield,
} from "lucide-react"
import Link from "next/link"

interface ApplicationDetailProps {
  applicationId: string
}

// Mock application data
const mockApplication = {
  id: "APP-2024-001247",
  status: "review",
  priority: "high",
  submittedAt: "2024-01-25T10:30:00Z",
  lastActivity: "2024-01-25T14:22:00Z",
  assignedTo: "Sarah Wilson",
  workflow: {
    id: "wf-001",
    name: "Credit Application Review",
    version: "v2.1",
  },
  applicant: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    phone: "+254712345678",
    dateOfBirth: "1985-06-15",
    nationalId: "12345678",
    address: "123 Main Street, Nairobi, Kenya",
    employmentStatus: "employed",
    monthlyIncome: 75000,
  },
  application: {
    requestedAmount: 50000,
    loanPurpose: "Business expansion",
    loanTerm: 12,
  },
  decision: {
    riskScore: 567,
    confidence: 78,
    outcome: "review",
    reason: "Medium risk - manual review required",
    fraudFlags: ["Unusual device fingerprint"],
    recommendations: ["Verify employment status", "Request additional income documentation"],
  },
  documents: [
    { id: "doc-1", name: "National ID", status: "verified", uploadedAt: "2024-01-25T10:35:00Z" },
    { id: "doc-2", name: "Payslip", status: "pending", uploadedAt: "2024-01-25T10:40:00Z" },
    { id: "doc-3", name: "Bank Statement", status: "verified", uploadedAt: "2024-01-25T10:45:00Z" },
    { id: "doc-4", name: "Employment Letter", status: "rejected", uploadedAt: "2024-01-25T10:50:00Z" },
  ],
  timeline: [
    {
      id: "event-1",
      type: "submitted",
      title: "Application Submitted",
      description: "Application received and initial validation completed",
      timestamp: "2024-01-25T10:30:00Z",
      user: "System",
    },
    {
      id: "event-2",
      type: "processing",
      title: "Risk Assessment Started",
      description: "Automated risk scoring and fraud detection initiated",
      timestamp: "2024-01-25T10:32:00Z",
      user: "System",
    },
    {
      id: "event-3",
      type: "review",
      title: "Manual Review Required",
      description: "Risk score of 567 requires manual review",
      timestamp: "2024-01-25T10:35:00Z",
      user: "System",
    },
    {
      id: "event-4",
      type: "assigned",
      title: "Assigned to Reviewer",
      description: "Application assigned to Sarah Wilson for review",
      timestamp: "2024-01-25T14:22:00Z",
      user: "Sarah Wilson",
    },
  ],
  notes: [
    {
      id: "note-1",
      content: "Applicant has good credit history but employment verification needed.",
      author: "Sarah Wilson",
      timestamp: "2024-01-25T14:25:00Z",
      type: "review",
    },
    {
      id: "note-2",
      content: "Requested additional income documentation via email.",
      author: "Sarah Wilson",
      timestamp: "2024-01-25T14:30:00Z",
      type: "communication",
    },
  ],
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [newNote, setNewNote] = useState("")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-accent" />
      case "declined":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "review":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "processing":
        return <Clock className="h-5 w-5 text-primary" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/applications">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Applications
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getStatusIcon(mockApplication.status)}
            <div>
              <h1 className="text-2xl font-serif font-bold">{mockApplication.id}</h1>
              <p className="text-muted-foreground">
                {mockApplication.applicant.firstName} {mockApplication.applicant.lastName}
              </p>
            </div>
            {getStatusBadge(mockApplication.status)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <MessageSquare className="h-4 w-4" />
            Add Note
          </Button>
          <Button className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Make Decision
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applicant">Applicant Info</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className={`text-4xl font-bold ${getRiskScoreColor(mockApplication.decision.riskScore)}`}>
                    {mockApplication.decision.riskScore}
                  </p>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                </div>
                <Progress value={(mockApplication.decision.riskScore / 1000) * 100} className="h-2" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span className="font-medium">{mockApplication.decision.confidence}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Outcome</span>
                    <span className="font-medium capitalize">{mockApplication.decision.outcome}</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Reason</p>
                  <p className="text-sm">{mockApplication.decision.reason}</p>
                </div>
              </CardContent>
            </Card>

            {/* Application Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Application Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Requested Amount</p>
                    <p className="font-semibold">{formatCurrency(mockApplication.application.requestedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loan Term</p>
                    <p className="font-semibold">{mockApplication.application.loanTerm} months</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Purpose</p>
                    <p className="font-semibold">{mockApplication.application.loanPurpose}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Workflow</p>
                  <p className="font-semibold">{mockApplication.workflow.name}</p>
                  <p className="text-xs text-muted-foreground">{mockApplication.workflow.version}</p>
                </div>
              </CardContent>
            </Card>

            {/* Assignment & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status & Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <p className="font-semibold">{mockApplication.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-semibold">{formatDate(mockApplication.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Activity</p>
                    <p className="font-semibold">{formatDate(mockApplication.lastActivity)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Priority</p>
                  <Badge variant="destructive" className="text-xs">
                    High Priority
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {mockApplication.decision.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {mockApplication.decision.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applicant" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {mockApplication.applicant.firstName[0]}
                      {mockApplication.applicant.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {mockApplication.applicant.firstName} {mockApplication.applicant.lastName}
                    </h3>
                    <p className="text-muted-foreground">Applicant</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{mockApplication.applicant.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">National ID</p>
                    <p className="font-medium">{mockApplication.applicant.nationalId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{mockApplication.applicant.email}</p>
                    <p className="text-sm text-muted-foreground">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{mockApplication.applicant.phone}</p>
                    <p className="text-sm text-muted-foreground">Phone</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="font-medium">{mockApplication.applicant.address}</p>
                    <p className="text-sm text-muted-foreground">Address</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Employment Status</p>
                    <p className="font-medium capitalize">{mockApplication.applicant.employmentStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Income</p>
                    <p className="font-medium">{formatCurrency(mockApplication.applicant.monthlyIncome)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Debt-to-Income Ratio</p>
                    <p className="font-medium">23%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockApplication.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-muted-foreground">Uploaded {formatDate(document.uploadedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {document.status === "verified" && (
                        <Badge className="bg-accent/10 text-accent border-accent/20">Verified</Badge>
                      )}
                      {document.status === "pending" && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          Pending
                        </Badge>
                      )}
                      {document.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                      <Button variant="outline" size="sm" className="bg-transparent">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {mockApplication.timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        {index < mockApplication.timeline.length - 1 && <div className="w-px h-8 bg-border mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{event.description}</p>
                        <p className="text-xs text-muted-foreground">by {event.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes & Communications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Add a note about this application..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button className="w-fit">Add Note</Button>
              </div>
              <div className="space-y-4 pt-4 border-t">
                {mockApplication.notes.map((note) => (
                  <div key={note.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{note.author}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(note.timestamp)}</span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {note.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
