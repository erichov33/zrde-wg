import { Application, ApplicationFilters, ApplicationStatus } from '@/lib/types/application'

// Create centralized data service
export class ApplicationsService {
  async getApplications(filters?: ApplicationFilters): Promise<Application[]> {
    // Mock implementation - replace with actual API call
    const mockApplications: Application[] = [
      {
        id: '1',
        applicantName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        status: 'submitted',
        riskScore: 650,
        amount: 50000,
        workflow: 'Personal Loan',
        submittedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        assignedTo: 'Sarah Wilson',
        priority: 'normal',
        documents: 3,
        notes: 1
      },
      {
        id: '2',
        applicantName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        status: 'processing',
        riskScore: 720,
        amount: 75000,
        workflow: 'Business Loan',
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        lastActivity: new Date().toISOString(),
        assignedTo: 'Michael Chen',
        priority: 'high',
        documents: 5,
        notes: 2
      }
    ]

    // Apply filters if provided
    if (!filters) {
      return mockApplications
    }

    return mockApplications.filter(app => {
      if (filters.status && !filters.status.includes(app.status)) {
        return false
      }
      if (filters.priority && !filters.priority.includes(app.priority)) {
        return false
      }
      if (filters.assignedTo && !filters.assignedTo.includes(app.assignedTo)) {
        return false
      }
      if (filters.workflow && !filters.workflow.includes(app.workflow)) {
        return false
      }
      if (filters.amountRange) {
        if (filters.amountRange.min && app.amount < filters.amountRange.min) {
          return false
        }
        if (filters.amountRange.max && app.amount > filters.amountRange.max) {
          return false
        }
      }
      if (filters.riskScoreRange) {
        if (filters.riskScoreRange.min && app.riskScore < filters.riskScoreRange.min) {
          return false
        }
        if (filters.riskScoreRange.max && app.riskScore > filters.riskScoreRange.max) {
          return false
        }
      }
      return true
    })
  }

  async getApplication(id: string): Promise<Application | null> {
    // Mock implementation - replace with actual API call
    const applications = await this.getApplications()
    return applications.find(app => app.id === id) || null
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
    // Mock implementation - replace with actual API call
    console.log(`Updating application ${id} status to ${status}`)
    // In a real implementation, this would make an API call to update the status
    // For now, we'll just log the action
  }
}