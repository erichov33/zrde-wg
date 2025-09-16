"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { ManualApplicationData, WORKFLOWS, PRIORITIES, ASSIGNEES } from "@/lib/types/application"
import { useApplications } from "@/lib/contexts/applications-context"

interface ManualApplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ApplicationFormData extends Omit<ManualApplicationData, 'amount'> {
  amount: string
}

export function ManualApplicationModal({ open, onOpenChange }: ManualApplicationModalProps) {
  const { addApplication, isLoading } = useApplications()
  const [formData, setFormData] = useState<ApplicationFormData>({
    applicantName: "",
    email: "",
    phone: "",
    amount: "",
    workflow: "",
    priority: "normal",
    assignedTo: "",
    notes: ""
  })

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const required = ['applicantName', 'email', 'phone', 'amount', 'workflow', 'assignedTo']
    const missing = required.filter(field => !formData[field as keyof ApplicationFormData])
    
    if (missing.length > 0) {
      toast.error(`Please fill in all required fields: ${missing.join(', ')}`)
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    // Phone validation (basic)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid phone number")
      return false
    }

    // Amount validation
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      const applicationData: ManualApplicationData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }
      
      await addApplication(applicationData)
      
      // Reset form
      setFormData({
        applicantName: "",
        email: "",
        phone: "",
        amount: "",
        workflow: "",
        priority: "normal",
        assignedTo: "",
        notes: ""
      })
      
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the context
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Manual Application
          </DialogTitle>
          <DialogDescription>
            Add a new application manually to the system. All required fields must be completed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Applicant Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Applicant Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName">Full Name *</Label>
                <Input
                  id="applicantName"
                  placeholder="Enter applicant's full name"
                  value={formData.applicantName}
                  onChange={(e) => handleInputChange('applicantName', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="applicant@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+254712345678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Application Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflow">Workflow *</Label>
                <Select value={formData.workflow} onValueChange={(value) => handleInputChange('workflow', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOWS.map((workflow) => (
                      <SelectItem key={workflow} value={workflow}>
                        {workflow}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assignment & Priority */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Assignment & Priority</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To *</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange('assignedTo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNEES.map((assignee) => (
                      <SelectItem key={assignee} value={assignee}>
                        {assignee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value as ManualApplicationData['priority'])}>
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
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Initial Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any initial notes or comments about this application..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}