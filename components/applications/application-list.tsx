"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Eye, MessageSquare, FileText, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, Check, X, Edit, ChevronDown, Trash2, Users, Download, FileSpreadsheet, FileImage } from "lucide-react"
import Link from "next/link"
import { ApplicationReviewModal } from "./application-review-modal"
import { ApplicationDetailModal } from "./application-detail-modal"
import { useApplications } from "@/lib/contexts/applications-context"
import { Application } from "@/lib/types/application"
import { FilterState } from "./application-filters"
import { exportFilteredApplications } from "@/lib/utils/export"
import { toast } from "sonner"
import { isWithinInterval, parseISO } from "date-fns"

interface ApplicationListProps {
  filters: FilterState
  sortBy: string
  sortOrder: "asc" | "desc"
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "submitted":
      return <Badge variant="outline" className="gap-1">{getStatusIcon(status)} Submitted</Badge>
    case "processing":
      return <Badge variant="outline" className="gap-1">{getStatusIcon(status)} Processing</Badge>
    case "review":
      return <Badge variant="destructive" className="gap-1">{getStatusIcon(status)} Review Required</Badge>
    case "approved":
      return <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">{getStatusIcon(status)} Approved</Badge>
    case "declined":
      return <Badge variant="destructive" className="gap-1">{getStatusIcon(status)} Declined</Badge>
    default:
      return <Badge variant="outline" className="gap-1">{getStatusIcon(status)} Unknown</Badge>
  }
}

const getRiskScoreColor = (score: number) => {
  if (score >= 700) return "text-green-600"
  if (score >= 500) return "text-yellow-600"
  return "text-red-600"
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return (
        <Badge variant="destructive" className="text-xs">
          High Priority
        </Badge>
      )
    case "normal":
      return (
        <Badge variant="outline" className="text-xs">
          Normal
        </Badge>
      )
    case "low":
      return (
        <Badge variant="secondary" className="text-xs">
          Low Priority
        </Badge>
      )
    default:
      return null
  }
}

export function ApplicationList({ filters, sortBy, sortOrder }: ApplicationListProps) {
  const { applications, isLoading, updateApplication, deleteApplication } = useApplications()
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  
  // Bulk actions state
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    const filtered = applications.filter(app => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          app.applicantName,
          app.email,
          app.phone,
          app.id,
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(app.status)) {
        return false
      }

      // Workflow filter
      if (filters.workflows.length > 0 && !filters.workflows.includes(app.workflow)) {
        return false
      }

      // Risk level filter
      if (filters.riskLevels.length > 0) {
        const riskLevel = app.riskScore >= 700 ? 'low' : app.riskScore >= 500 ? 'medium' : 'high'
        if (!filters.riskLevels.includes(riskLevel)) {
          return false
        }
      }

      // Priority filter
      if (filters.priorities.length > 0 && !filters.priorities.includes(app.priority)) {
        return false
      }

      // Assignee filter
      if (filters.assignees.length > 0 && !filters.assignees.includes(app.assignedTo)) {
        return false
      }

      // Amount range filter
      if (filters.amountRange.min !== undefined && app.amount < filters.amountRange.min) {
        return false
      }
      if (filters.amountRange.max !== undefined && app.amount > filters.amountRange.max) {
        return false
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const appDate = parseISO(app.submittedAt)
        if (filters.dateRange.from && filters.dateRange.to) {
          if (!isWithinInterval(appDate, { start: filters.dateRange.from, end: filters.dateRange.to })) {
            return false
          }
        } else if (filters.dateRange.from) {
          if (appDate < filters.dateRange.from) {
            return false
          }
        } else if (filters.dateRange.to) {
          if (appDate > filters.dateRange.to) {
            return false
          }
        }
      }

      return true
    })

    // Sort applications
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Application]
      const bValue = b[sortBy as keyof Application]
      
      let comparison = 0
      if (aValue > bValue) comparison = 1
      if (aValue < bValue) comparison = -1
      
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [applications, filters, sortBy, sortOrder])

  const handleReviewClick = (application: Application) => {
    setSelectedApplication(application)
    setReviewModalOpen(true)
  }

  const handleDetailClick = (application: Application) => {
    setSelectedApplication(application)
    setDetailModalOpen(true)
  }

  const handleQuickStatusUpdate = async (applicationId: string, newStatus: Application['status'], actionName: string) => {
    setUpdatingStatus(applicationId)
    try {
      await updateApplication(applicationId, {
        status: newStatus,
        lastActivity: new Date().toISOString()
      })
      toast.success(`Application ${actionName.toLowerCase()} successfully`)
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDecision = async (applicationId: string, decision: string, notes: string) => {
    try {
      await updateApplication(applicationId, {
        status: decision as Application['status'],
        lastActivity: new Date().toISOString(),
        notes: selectedApplication ? selectedApplication.notes + 1 : 1
      })
      setReviewModalOpen(false)
      toast.success(`Application ${decision} successfully`)
    } catch (error) {
      // Error handling is done in the context
    }
  }

  // Export functions
  const handleExport = async (format: "csv" | "pdf", exportSelected: boolean = false) => {
    setExportLoading(true)
    try {
      const applicationsToExport = exportSelected 
        ? filteredAndSortedApplications.filter(app => selectedApplications.has(app.id))
        : filteredAndSortedApplications

      if (applicationsToExport.length === 0) {
        toast.error("No applications to export")
        return
      }

      const filename = exportSelected 
        ? `selected_applications_${new Date().toISOString().split('T')[0]}`
        : `applications_${new Date().toISOString().split('T')[0]}`

      exportFilteredApplications(applicationsToExport, format, filename)
      
      toast.success(`${applicationsToExport.length} applications exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(`Failed to export applications`)
    } finally {
      setExportLoading(false)
    }
  }

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(new Set(filteredAndSortedApplications.map(app => app.id)))
    } else {
      setSelectedApplications(new Set())
    }
  }

  const handleSelectApplication = (applicationId: string, checked: boolean) => {
    const newSelected = new Set(selectedApplications)
    if (checked) {
      newSelected.add(applicationId)
    } else {
      newSelected.delete(applicationId)
    }
    setSelectedApplications(newSelected)
  }

  // Bulk actions
  const handleBulkStatusUpdate = async (newStatus: Application['status'], actionName: string) => {
    if (selectedApplications.size === 0) return

    setBulkActionLoading(true)
    try {
      const promises = Array.from(selectedApplications).map(id =>
        updateApplication(id, {
          status: newStatus,
          lastActivity: new Date().toISOString()
        })
      )
      
      await Promise.all(promises)
      toast.success(`${selectedApplications.size} applications ${actionName.toLowerCase()} successfully`)
      setSelectedApplications(new Set())
    } catch (error) {
      toast.error(`Failed to update applications`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedApplications.size === 0) return

    setBulkActionLoading(true)
    try {
      const promises = Array.from(selectedApplications).map(id => deleteApplication(id))
      await Promise.all(promises)
      toast.success(`${selectedApplications.size} applications deleted successfully`)
      setSelectedApplications(new Set())
      setDeleteConfirmOpen(false)
    } catch (error) {
      toast.error(`Failed to delete applications`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const isAllSelected = selectedApplications.size === filteredAndSortedApplications.length && filteredAndSortedApplications.length > 0
  const isIndeterminate = selectedApplications.size > 0 && selectedApplications.size < filteredAndSortedApplications.length

  if (isLoading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading applications...
        </div>
      </div>
    )
  }

  if (filteredAndSortedApplications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          {applications.length === 0 ? (
            <>
              <p className="text-muted-foreground">No applications found</p>
              <p className="text-sm text-muted-foreground">Create your first application using the "Add Application" button</p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">No applications match your filters</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search criteria or clearing filters</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating applications...
        </div>
      )}

      {/* Results Summary and Export */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedApplications.length} of {applications.length} applications
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={exportLoading}>
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export All as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileImage className="mr-2 h-4 w-4" />
                Export All as PDF
              </DropdownMenuItem>
              {selectedApplications.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport("csv", true)}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Selected as CSV ({selectedApplications.size})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf", true)}>
                    <FileImage className="mr-2 h-4 w-4" />
                    Export Selected as PDF ({selectedApplications.size})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Actions Header */}
      {filteredAndSortedApplications.length > 0 && (
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={isIndeterminate ? "indeterminate" : isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedApplications.size > 0 
                    ? `${selectedApplications.size} of ${filteredAndSortedApplications.length} selected`
                    : `${filteredAndSortedApplications.length} applications`
                  }
                </span>
              </div>

              {selectedApplications.size > 0 && (
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={bulkActionLoading}>
                        {bulkActionLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Users className="h-4 w-4 mr-2" />
                        )}
                        Bulk Actions
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate("processing", "Moved to Processing")}>
                        <Clock className="mr-2 h-4 w-4" />
                        Move to Processing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate("review", "Moved to Review")}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Move to Review
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate("approved", "Approved")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate("declined", "Declined")}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline All
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedApplications(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4">
        {filteredAndSortedApplications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedApplications.has(application.id)}
                  onCheckedChange={(checked) => handleSelectApplication(application.id, checked as boolean)}
                  className="mt-1"
                />
                
                <div className="flex items-start justify-between flex-1">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {application.applicantName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{application.applicantName}</h3>
                        {getStatusBadge(application.status)}
                        {application.priority === "high" && getPriorityBadge(application.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">{application.id}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{application.email}</span>
                        <span>{application.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Risk Score:</span>
                      <span className={`font-medium ${getRiskScoreColor(application.riskScore)}`}>
                        {application.riskScore}
                      </span>
                    </div>
                    <p className="text-lg font-semibold">{formatCurrency(application.amount)}</p>
                    <p className="text-sm text-muted-foreground">{application.workflow}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 ml-10 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {application.documents} documents
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {application.notes} notes
                  </span>
                  <span>Last activity: {formatDate(application.lastActivity)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-transparent"
                    onClick={() => handleDetailClick(application)}
                  >
                    <Eye className="h-3 w-3" />
                    View Details
                  </Button>
                  
                  {/* Quick Action Buttons */}
                  {application.status === "review" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => handleQuickStatusUpdate(application.id, "approved", "Approved")}
                        disabled={updatingStatus === application.id}
                      >
                        {updatingStatus === application.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Quick Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleQuickStatusUpdate(application.id, "declined", "Declined")}
                        disabled={updatingStatus === application.id}
                      >
                        {updatingStatus === application.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Quick Decline
                      </Button>
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleReviewClick(application)}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Full Review
                      </Button>
                    </>
                  )}
                  
                  {application.status === "submitted" && (
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleQuickStatusUpdate(application.id, "processing", "Moved to Processing")}
                      disabled={updatingStatus === application.id}
                    >
                      {updatingStatus === application.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      Start Processing
                    </Button>
                  )}
                  
                  {application.status === "processing" && (
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleQuickStatusUpdate(application.id, "review", "Moved to Review")}
                      disabled={updatingStatus === application.id}
                    >
                      {updatingStatus === application.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      Send to Review
                    </Button>
                  )}

                  {/* More Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDetailClick(application)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReviewClick(application)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Add Notes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <ApplicationReviewModal
        application={selectedApplication}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onDecision={handleDecision}
      />

      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Applications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedApplications.size} selected application{selectedApplications.size > 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
