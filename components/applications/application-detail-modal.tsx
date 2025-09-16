"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  User, 
  CreditCard, 
  Shield, 
  FileText, 
  MessageSquare, 
  Clock, 
  Edit3, 
  Save, 
  X,
  Loader2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Application, WORKFLOWS, PRIORITIES, ASSIGNEES } from "@/lib/types/application"
import { useApplications } from "@/lib/contexts/applications-context"
import { toast } from "sonner"

interface ApplicationDetailModalProps {
  application: Application | null
  isOpen: boolean
  onClose: () => void
}

interface EditableFields {
  applicantName: string
  email: string
  phone: string
  amount: string
  workflow: string
  priority: string
  assignedTo: string
}

export function ApplicationDetailModal({ application, isOpen, onClose }: ApplicationDetailModalProps) {
  const { updateApplication, isLoading } = useApplications()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<EditableFields>({
    applicantName: "",
    email: "",
    phone: "",
    amount: "",
    workflow: "",
    priority: "",
    assignedTo: ""
  })
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  useEffect(() => {
    if (application) {
      setEditData({
        applicantName: application.applicantName,
        email: application.email,
        phone: application.phone,
        amount: application.amount.toString(),
        workflow: application.workflow,
        priority: application.priority,
        assignedTo: application.assignedTo
      })
    }
  }, [application])

  if (!application) return null

  const handleEditChange = (field: keyof EditableFields, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = async () => {
    try {
      const amount = parseFloat(editData.amount)
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount")
        return
      }

      await updateApplication(application.id, {
        applicantName: editData.applicantName,
        email: editData.email,
        phone: editData.phone,
        amount: amount,
        workflow: editData.workflow,
        priority: editData.priority as Application['priority'],
        assignedTo: editData.assignedTo,
        lastActivity: new Date().toISOString()
      })

      setIsEditing(false)
      toast.success("Application updated successfully")
    } catch (error) {
      // Error handling is done in the context
    }
  }

  const handleCancelEdit = () => {
    setEditData({
      applicantName: application.applicantName,
      email: application.email,
      phone: application.phone,
      amount: application.amount.toString(),
      workflow: application.workflow,
      priority: application.priority,
      assignedTo: application.assignedTo
    })
    setIsEditing(false)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note")
      return
    }

    setIsAddingNote(true)
    try {
      await updateApplication(application.id, {
        notes: application.notes + 1,
        lastActivity: new Date().toISOString()
      })
      
      setNewNote("")
      toast.success("Note added successfully")
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setIsAddingNote(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "review":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 700) return "text-green-600"
    if (score >= 500) return "text-yellow-600"
    return "text-red-600"
  }

  const getRiskLevel = (score: number) => {
    if (score >= 700) return "Low Risk"
    if (score >= 500) return "Medium Risk"
    return "High Risk"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Details - {application.id}
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Status and Priority */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Current Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(application.status)}
                    <Badge variant="outline" className="capitalize">
                      {application.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Last updated: {formatDate(application.lastActivity)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className={`text-2xl font-bold ${getRiskScoreColor(application.riskScore)}`}>
                      {application.riskScore}
                    </span>
                  </div>
                  <Badge 
                    variant={application.riskScore >= 700 ? "default" : application.riskScore >= 500 ? "secondary" : "destructive"}
                    className="text-xs mt-2"
                  >
                    {getRiskLevel(application.riskScore)}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Application Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Applicant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editData.applicantName}
                        onChange={(e) => handleEditChange('applicantName', e.target.value)}
                        placeholder="Full Name"
                      />
                      <Input
                        value={editData.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        placeholder="Email"
                        type="email"
                      />
                      <Input
                        value={editData.phone}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        placeholder="Phone"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{application.applicantName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {application.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {application.phone}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Application
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editData.amount}
                        onChange={(e) => handleEditChange('amount', e.target.value)}
                        placeholder="Amount"
                        type="number"
                      />
                      <Select value={editData.workflow} onValueChange={(value) => handleEditChange('workflow', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKFLOWS.map((workflow) => (
                            <SelectItem key={workflow} value={workflow}>
                              {workflow}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={editData.priority} onValueChange={(value) => handleEditChange('priority', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((priority) => (
                            <SelectItem key={priority.value} value={priority.value}>
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-lg">{formatCurrency(application.amount)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{application.workflow}</p>
                      <Badge 
                        variant={application.priority === "high" ? "destructive" : application.priority === "normal" ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {application.priority} priority
                      </Badge>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Assignment & Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <Select value={editData.assignedTo} onValueChange={(value) => handleEditChange('assignedTo', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNEES.map((assignee) => (
                          <SelectItem key={assignee} value={assignee}>
                            {assignee}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span className="text-sm">{application.assignedTo}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Submitted: {formatDate(application.submittedAt)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last activity: {formatDate(application.lastActivity)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Application ID</Label>
                    <p className="text-sm text-muted-foreground mt-1">{application.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Workflow Type</Label>
                    <p className="text-sm text-muted-foreground mt-1">{application.workflow}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Requested Amount</Label>
                    <p className="text-sm text-muted-foreground mt-1">{formatCurrency(application.amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Risk Score</Label>
                    <p className={`text-sm mt-1 font-medium ${getRiskScoreColor(application.riskScore)}`}>
                      {application.riskScore} ({getRiskLevel(application.riskScore)})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents ({application.documents})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Document management coming soon</p>
                  <p className="text-sm">This application has {application.documents} documents attached</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes ({application.notes})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newNote">Add New Note</Label>
                  <Textarea
                    id="newNote"
                    placeholder="Enter your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddNote} 
                    disabled={isAddingNote || !newNote.trim()}
                    size="sm"
                  >
                    {isAddingNote ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Note"
                    )}
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Note history coming soon</p>
                    <p className="text-sm">This application has {application.notes} notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}