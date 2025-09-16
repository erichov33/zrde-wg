"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { Application, ManualApplicationData } from "@/lib/types/application"
import { toast } from "sonner"

interface ApplicationsContextType {
  applications: Application[]
  isLoading: boolean
  addApplication: (data: ManualApplicationData) => Promise<void>
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>
  deleteApplication: (id: string) => Promise<void>
  refreshApplications: () => Promise<void>
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined)

// Sample applications data
const sampleApplications: Application[] = [
  {
    id: "APP-2024-001",
    applicantName: "John Doe",
    email: "john.doe@email.com",
    phone: "+254712345678",
    status: "review",
    riskScore: 650,
    amount: 50000,
    workflow: "Personal Loan",
    submittedAt: "2024-01-15T10:30:00Z",
    lastActivity: "2024-01-16T14:20:00Z",
    assignedTo: "Sarah Johnson",
    priority: "high",
    documents: 3,
    notes: 2
  },
  {
    id: "APP-2024-002",
    applicantName: "Jane Smith",
    email: "jane.smith@email.com",
    phone: "+254723456789",
    status: "processing",
    riskScore: 720,
    amount: 75000,
    workflow: "Business Loan",
    submittedAt: "2024-01-14T09:15:00Z",
    lastActivity: "2024-01-15T16:45:00Z",
    assignedTo: "Michael Chen",
    priority: "normal",
    documents: 5,
    notes: 1
  },
  {
    id: "APP-2024-003",
    applicantName: "Robert Wilson",
    email: "robert.wilson@email.com",
    phone: "+254734567890",
    status: "submitted",
    riskScore: 580,
    amount: 30000,
    workflow: "Emergency Loan",
    submittedAt: "2024-01-16T11:00:00Z",
    lastActivity: "2024-01-16T11:00:00Z",
    assignedTo: "Emily Davis",
    priority: "high",
    documents: 2,
    notes: 0
  },
  {
    id: "APP-2024-004",
    applicantName: "Maria Garcia",
    email: "maria.garcia@email.com",
    phone: "+254745678901",
    status: "approved",
    riskScore: 780,
    amount: 100000,
    workflow: "Mortgage",
    submittedAt: "2024-01-10T08:30:00Z",
    lastActivity: "2024-01-12T10:15:00Z",
    assignedTo: "David Brown",
    priority: "normal",
    documents: 8,
    notes: 4
  },
  {
    id: "APP-2024-005",
    applicantName: "Ahmed Hassan",
    email: "ahmed.hassan@email.com",
    phone: "+254756789012",
    status: "declined",
    riskScore: 420,
    amount: 25000,
    workflow: "Personal Loan",
    submittedAt: "2024-01-08T14:20:00Z",
    lastActivity: "2024-01-09T09:30:00Z",
    assignedTo: "Sarah Johnson",
    priority: "low",
    documents: 2,
    notes: 3
  }
]

export function ApplicationsProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<Application[]>(sampleApplications)
  const [isLoading, setIsLoading] = useState(false)

  const generateApplicationId = () => {
    const year = new Date().getFullYear()
    const count = applications.length + 1
    return `APP-${year}-${count.toString().padStart(3, '0')}`
  }

  const addApplication = useCallback(async (data: ManualApplicationData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newApplication: Application = {
        id: generateApplicationId(),
        applicantName: data.applicantName,
        email: data.email,
        phone: data.phone,
        status: "submitted",
        riskScore: Math.floor(Math.random() * 400) + 400, // Random score between 400-800
        amount: data.amount,
        workflow: data.workflow,
        submittedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        assignedTo: data.assignedTo,
        priority: data.priority,
        documents: 0,
        notes: data.notes ? 1 : 0
      }

      setApplications(prev => [newApplication, ...prev])
      toast.success("Application created successfully")
    } catch (error) {
      toast.error("Failed to create application")
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [applications.length])

  const updateApplication = useCallback(async (id: string, updates: Partial<Application>) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setApplications(prev => 
        prev.map(app => 
          app.id === id 
            ? { ...app, ...updates, lastActivity: new Date().toISOString() }
            : app
        )
      )
    } catch (error) {
      toast.error("Failed to update application")
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteApplication = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setApplications(prev => prev.filter(app => app.id !== id))
    } catch (error) {
      toast.error("Failed to delete application")
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshApplications = useCallback(async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      // In a real app, this would fetch fresh data from the server
      toast.success("Applications refreshed")
    } catch (error) {
      toast.error("Failed to refresh applications")
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value: ApplicationsContextType = {
    applications,
    isLoading,
    addApplication,
    updateApplication,
    deleteApplication,
    refreshApplications
  }

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  )
}

export function useApplications() {
  const context = useContext(ApplicationsContext)
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationsProvider')
  }
  return context
}