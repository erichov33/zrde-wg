"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle, XCircle, AlertTriangle, User, CreditCard, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Application } from "@/lib/types/application"

interface ApplicationReviewModalProps {
  application: Application | null
  isOpen: boolean
  onClose: () => void
  onDecision: (applicationId: string, decision: string, notes: string) => void
}

export function ApplicationReviewModal({ application, isOpen, onClose, onDecision }: ApplicationReviewModalProps) {
  const [decision, setDecision] = useState<string>("")
  const [reviewNotes, setReviewNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!application) return null

  const handleSubmit = async () => {
    if (!decision) {
      toast.error("Please select a decision")
      return
    }

    if (!reviewNotes.trim()) {
      toast.error("Please provide review notes")
      return
    }

    setIsSubmitting(true)
    
    try {
      await onDecision(application.id, decision, reviewNotes)
      
      // Reset form
      setDecision("")
      setReviewNotes("")
      onClose()
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setDecision("")
      setReviewNotes("")
      onClose()
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Review Application - {application.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{application.applicantName}</p>
                <p className="text-sm text-muted-foreground">{application.email}</p>
                <p className="text-sm text-muted-foreground">{application.phone}</p>
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    Assigned to: {application.assignedTo}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-lg">{formatCurrency(application.amount)}</p>
                <p className="text-sm text-muted-foreground">{application.workflow}</p>
                <div className="flex gap-2">
                  <Badge 
                    variant={application.priority === "high" ? "destructive" : application.priority === "normal" ? "outline" : "secondary"}
                    className="text-xs"
                  >
                    {application.priority} priority
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted: {formatDate(application.submittedAt)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={`text-2xl font-bold ${getRiskScoreColor(application.riskScore)}`}>
                  {application.riskScore}
                </p>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <Badge 
                  variant={application.riskScore >= 700 ? "default" : application.riskScore >= 500 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {getRiskLevel(application.riskScore)}
                </Badge>
                <div className="pt-1 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {application.documents} documents
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {application.notes} notes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Status */}
          <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {application.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last activity: {formatDate(application.lastActivity)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Decision Section */}
          <Card className="bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle>Make Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-base font-medium">Decision *</Label>
                <RadioGroup value={decision} onValueChange={setDecision} className="mt-3">
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                    <RadioGroupItem value="approved" id="approved" />
                    <Label htmlFor="approved" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Approve Application</p>
                        <p className="text-xs text-muted-foreground">Grant the requested amount</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <RadioGroupItem value="declined" id="declined" />
                    <Label htmlFor="declined" className="flex items-center gap-2 cursor-pointer flex-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium">Decline Application</p>
                        <p className="text-xs text-muted-foreground">Reject the application</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                    <RadioGroupItem value="review" id="review" />
                    <Label htmlFor="review" className="flex items-center gap-2 cursor-pointer flex-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="font-medium">Request More Information</p>
                        <p className="text-xs text-muted-foreground">Keep in review status</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="notes" className="text-base font-medium">Review Notes *</Label>
                <Textarea
                  id="notes"
                  placeholder="Provide detailed notes about your decision. Include reasoning, any concerns, or additional requirements..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-2 min-h-[120px] bg-white/50 dark:bg-slate-800/50"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These notes will be visible to other team members and may be shared with the applicant.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !decision || !reviewNotes.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Decision...
              </>
            ) : (
              "Submit Decision"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}