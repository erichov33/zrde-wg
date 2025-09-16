import { z } from "zod"

// Types
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
  outcome: "approved" | "declined" | "review"
  riskScore: number
  confidence: number
  reasons: string[]
  recommendations?: string[]
  fraudDetection: {
    isFraud: boolean
    confidence: number
    reasons: string[]
  }
  processingTime: number
  timestamp: string
}

export class DecisionService {
  static calculateRiskScore(applicationData: DecisionRequest['applicationData']): number {
    let score = 500 // Base score

    // Income-based scoring
    if (applicationData.financialInfo.monthlyIncome) {
      const income = applicationData.financialInfo.monthlyIncome
      if (income > 100000) score += 150
      else if (income > 50000) score += 100
      else if (income > 25000) score += 50
      else if (income < 10000) score -= 100
    }

    // Employment status
    if (applicationData.financialInfo.employmentStatus === "employed") {
      score += 75
    } else if (applicationData.financialInfo.employmentStatus === "self-employed") {
      score += 25
    } else if (applicationData.financialInfo.employmentStatus === "unemployed") {
      score -= 150
    }

    // Loan amount vs income ratio
    if (applicationData.financialInfo.requestedAmount && applicationData.financialInfo.monthlyIncome) {
      const ratio = applicationData.financialInfo.requestedAmount / (applicationData.financialInfo.monthlyIncome * 12)
      if (ratio > 5) score -= 200
      else if (ratio > 3) score -= 100
      else if (ratio > 1) score -= 50
    }

    // Location-based adjustments
    const highRiskCountries = ["NG", "KE", "GH"]
    if (highRiskCountries.includes(applicationData.location.country)) {
      score -= 25
    }

    return Math.max(300, Math.min(850, score))
  }

  static detectFraud(applicationData: DecisionRequest['applicationData']): {
    isFraud: boolean
    confidence: number
    reasons: string[]
  } {
    const reasons: string[] = []
    let riskFactors = 0

    // Check for suspicious patterns
    if (applicationData.personalInfo.email.includes("temp") || applicationData.personalInfo.email.includes("fake")) {
      reasons.push("Suspicious email domain")
      riskFactors += 2
    }

    if (applicationData.personalInfo.phone.length < 10) {
      reasons.push("Invalid phone number format")
      riskFactors += 1
    }

    // Device fingerprinting checks
    if (applicationData.deviceInfo?.ipAddress === "127.0.0.1" || applicationData.deviceInfo?.ipAddress?.startsWith("10.")) {
      reasons.push("Suspicious IP address")
      riskFactors += 1
    }

    // Financial inconsistencies
    if (applicationData.financialInfo.monthlyIncome && applicationData.financialInfo.requestedAmount) {
      const ratio = applicationData.financialInfo.requestedAmount / applicationData.financialInfo.monthlyIncome
      if (ratio > 50) {
        reasons.push("Unrealistic loan amount vs income")
        riskFactors += 3
      }
    }

    const isFraud = riskFactors >= 3
    const confidence = Math.min(95, riskFactors * 25)

    return { isFraud, confidence, reasons }
  }

  static async evaluateDecision(request: DecisionRequest): Promise<DecisionResponse> {
    const startTime = Date.now()
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(request.applicationData)
    
    // Detect fraud
    const fraudDetection = this.detectFraud(request.applicationData)
    
    // Execute workflow logic
    const workflowResult = this.executeWorkflow(request.workflowId, request.applicationData, riskScore)
    
    const processingTime = Date.now() - startTime
    
    return {
      decisionId: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      outcome: fraudDetection.isFraud ? "declined" : workflowResult.outcome,
      riskScore,
      confidence: workflowResult.confidence,
      reasons: fraudDetection.isFraud ? fraudDetection.reasons : workflowResult.reasons,
      recommendations: workflowResult.recommendations,
      fraudDetection,
      processingTime,
      timestamp: new Date().toISOString()
    }
  }

  private static executeWorkflow(workflowId: string, applicationData: any, riskScore: number) {
    // Simplified workflow execution
    if (riskScore >= 700) {
      return {
        outcome: "approved" as const,
        confidence: 95,
        reasons: ["Excellent credit profile", "Low risk assessment"],
        recommendations: ["Consider premium product offerings"]
      }
    } else if (riskScore >= 500) {
      return {
        outcome: "review" as const,
        confidence: 75,
        reasons: ["Medium risk profile", "Manual review recommended"],
        recommendations: ["Verify employment status", "Request additional documentation"]
      }
    } else {
      return {
        outcome: "declined" as const,
        confidence: 90,
        reasons: ["High risk profile", "Insufficient creditworthiness"],
        recommendations: ["Consider secured loan products", "Improve credit history"]
      }
    }
  }
}