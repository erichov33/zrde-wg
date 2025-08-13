import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Decision request schema
const DecisionRequestSchema = z.object({
  applicantId: z.string(),
  workflowId: z.string(),
  applicationData: z.object({
    personalInfo: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      dateOfBirth: z.string(),
      nationalId: z.string().optional(),
    }),
    financialInfo: z.object({
      monthlyIncome: z.number().optional(),
      employmentStatus: z.string().optional(),
      requestedAmount: z.number().optional(),
      loanPurpose: z.string().optional(),
    }),
    location: z.object({
      country: z.string(),
      city: z.string().optional(),
      address: z.string().optional(),
    }),
    deviceInfo: z
      .object({
        ipAddress: z.string(),
        userAgent: z.string(),
        deviceFingerprint: z.string().optional(),
      })
      .optional(),
  }),
  metadata: z
    .object({
      source: z.string().optional(),
      channel: z.string().optional(),
      timestamp: z.string().optional(),
    })
    .optional(),
})

// Mock risk scoring engine
function calculateRiskScore(applicationData: any): number {
  let score = 500 // Base score

  // Income-based scoring
  if (applicationData.financialInfo.monthlyIncome) {
    const income = applicationData.financialInfo.monthlyIncome
    if (income > 100000) score += 200
    else if (income > 50000) score += 150
    else if (income > 25000) score += 100
    else if (income > 10000) score += 50
  }

  // Employment status
  if (applicationData.financialInfo.employmentStatus === "employed") score += 100
  else if (applicationData.financialInfo.employmentStatus === "self-employed") score += 50

  // Location-based risk (simplified)
  const lowRiskCountries = ["kenya", "south africa", "ghana"]
  if (lowRiskCountries.includes(applicationData.location.country.toLowerCase())) {
    score += 50
  }

  // Add some randomness to simulate real-world variability
  score += Math.floor(Math.random() * 100) - 50

  // Ensure score is within bounds
  return Math.max(0, Math.min(1000, score))
}

// Mock fraud detection
function detectFraud(applicationData: any): { isFraud: boolean; confidence: number; reasons: string[] } {
  const reasons: string[] = []
  let fraudScore = 0

  // Check for suspicious patterns
  if (applicationData.deviceInfo?.ipAddress?.includes("192.168")) {
    fraudScore += 30
    reasons.push("Local IP address detected")
  }

  // Check for high-risk locations (simplified)
  const highRiskCountries = ["unknown", "test"]
  if (highRiskCountries.includes(applicationData.location.country.toLowerCase())) {
    fraudScore += 50
    reasons.push("High-risk location")
  }

  // Random fraud detection simulation
  const randomFraud = Math.random() * 100
  if (randomFraud > 95) {
    fraudScore += 70
    reasons.push("Suspicious behavioral patterns detected")
  }

  return {
    isFraud: fraudScore > 60,
    confidence: Math.min(fraudScore, 100),
    reasons,
  }
}

// Mock workflow execution
function executeWorkflow(workflowId: string, applicationData: any, riskScore: number) {
  // Simplified workflow execution logic
  const workflows: Record<string, any> = {
    "wf-001": {
      name: "Credit Application Review",
      rules: [
        { condition: "riskScore >= 700", outcome: "approved", reason: "Low risk profile" },
        { condition: "riskScore >= 500", outcome: "review", reason: "Medium risk - manual review required" },
        { condition: "riskScore < 500", outcome: "declined", reason: "High risk profile" },
      ],
    },
    "wf-002": {
      name: "Identity Verification",
      rules: [
        { condition: "riskScore >= 600", outcome: "approved", reason: "Identity verified successfully" },
        { condition: "riskScore < 600", outcome: "review", reason: "Additional verification required" },
      ],
    },
  }

  const workflow = workflows[workflowId] || workflows["wf-001"]

  // Execute rules in order
  for (const rule of workflow.rules) {
    if (rule.condition.includes(">=")) {
      const threshold = Number.parseInt(rule.condition.split(">=")[1].trim())
      if (riskScore >= threshold) {
        return {
          outcome: rule.outcome,
          reason: rule.reason,
          workflowName: workflow.name,
        }
      }
    } else if (rule.condition.includes("<")) {
      const threshold = Number.parseInt(rule.condition.split("<")[1].trim())
      if (riskScore < threshold) {
        return {
          outcome: rule.outcome,
          reason: rule.reason,
          workflowName: workflow.name,
        }
      }
    }
  }

  // Default fallback
  return {
    outcome: "review",
    reason: "Manual review required",
    workflowName: workflow.name,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validatedData = DecisionRequestSchema.parse(body)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 100))

    // Calculate risk score
    const riskScore = calculateRiskScore(validatedData.applicationData)

    // Perform fraud detection
    const fraudAnalysis = detectFraud(validatedData.applicationData)

    // Execute workflow
    const workflowResult = executeWorkflow(validatedData.workflowId, validatedData.applicationData, riskScore)

    // Override decision if fraud detected
    if (fraudAnalysis.isFraud) {
      workflowResult.outcome = "declined"
      workflowResult.reason = "Fraud detected: " + fraudAnalysis.reasons.join(", ")
    }

    // Generate decision ID
    const decisionId = `DEC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Prepare response
    const response = {
      decisionId,
      applicantId: validatedData.applicantId,
      workflowId: validatedData.workflowId,
      decision: {
        outcome: workflowResult.outcome,
        riskScore,
        confidence: Math.round((1000 - Math.abs(riskScore - 500)) / 10),
        reason: workflowResult.reason,
        workflowName: workflowResult.workflowName,
      },
      fraudAnalysis: {
        riskLevel: fraudAnalysis.isFraud ? "high" : riskScore < 400 ? "medium" : "low",
        confidence: fraudAnalysis.confidence,
        flags: fraudAnalysis.reasons,
      },
      processing: {
        duration: Math.round(Math.random() * 400 + 100),
        timestamp: new Date().toISOString(),
        version: "v2.1.0",
      },
      metadata: {
        source: validatedData.metadata?.source || "api",
        channel: validatedData.metadata?.channel || "web",
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Decision evaluation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process decision request",
      },
      { status: 500 },
    )
  }
}
