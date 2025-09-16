// Centralized type definitions
export interface Application {
  id: string
  applicantName: string
  email: string
  phone: string
  status: ApplicationStatus
  riskScore: number
  amount: number
  workflow: string
  submittedAt: string
  lastActivity: string
  assignedTo: string
  priority: 'high' | 'normal' | 'low'
  documents: number
  notes: number
}

export interface ApplicationFilters {
  status?: ApplicationStatus[]
  priority?: ('high' | 'normal' | 'low')[]
  assignedTo?: string[]
  workflow?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  riskScoreRange?: {
    min: number
    max: number
  }
}

export interface ManualApplicationData {
  applicantName: string
  email: string
  phone: string
  amount: number
  workflow: string
  priority: 'high' | 'normal' | 'low'
  assignedTo: string
  notes?: string
}

export type ApplicationStatus = 'submitted' | 'processing' | 'review' | 'approved' | 'declined'

export const WORKFLOWS = [
  'Credit Application Review',
  'Identity Verification', 
  'Fraud Detection Pipeline',
  'Document Verification',
  'Risk Assessment',
  'Compliance Check'
] as const

export const ASSIGNEES = [
  'Sarah Wilson',
  'Michael Chen', 
  'Emma Johnson',
  'David Brown',
  'Lisa Anderson',
  'James Taylor'
] as const

export const PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' }
] as const