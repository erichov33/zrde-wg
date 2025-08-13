// API client utilities for frontend components

export interface DecisionRequest {
  applicantId: string
  workflowId: string
  applicationData: {
    personalInfo: {
      firstName: string
      lastName: string
      email: string
      phone: string
      dateOfBirth: string
      nationalId?: string
    }
    financialInfo: {
      monthlyIncome?: number
      employmentStatus?: string
      requestedAmount?: number
      loanPurpose?: string
    }
    location: {
      country: string
      city?: string
      address?: string
    }
    deviceInfo?: {
      ipAddress: string
      userAgent: string
      deviceFingerprint?: string
    }
  }
  metadata?: {
    source?: string
    channel?: string
    timestamp?: string
  }
}

export interface DecisionResponse {
  decisionId: string
  applicantId: string
  workflowId: string
  decision: {
    outcome: "approved" | "declined" | "review"
    riskScore: number
    confidence: number
    reason: string
    workflowName: string
  }
  fraudAnalysis: {
    riskLevel: "low" | "medium" | "high"
    confidence: number
    flags: string[]
  }
  processing: {
    duration: number
    timestamp: string
    version: string
  }
  metadata: {
    source: string
    channel: string
  }
}

export class DecisionEngineAPI {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  async evaluateDecision(request: DecisionRequest): Promise<DecisionResponse> {
    const response = await fetch(`${this.baseUrl}/decisions/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to evaluate decision")
    }

    return response.json()
  }

  async getDecisionHistory(params?: {
    page?: number
    limit?: number
    outcome?: string
    workflowId?: string
    applicantId?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.outcome) searchParams.set("outcome", params.outcome)
    if (params?.workflowId) searchParams.set("workflowId", params.workflowId)
    if (params?.applicantId) searchParams.set("applicantId", params.applicantId)

    const response = await fetch(`${this.baseUrl}/decisions/history?${searchParams}`)

    if (!response.ok) {
      throw new Error("Failed to fetch decision history")
    }

    return response.json()
  }

  async testIntegration(integrationId: string, testType?: string) {
    const response = await fetch(`${this.baseUrl}/integrations/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ integrationId, testType }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to test integration")
    }

    return response.json()
  }
}

export const decisionAPI = new DecisionEngineAPI()
