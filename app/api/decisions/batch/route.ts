import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const BatchDecisionRequestSchema = z.object({
  batchId: z.string().optional(),
  workflowId: z.string(),
  applications: z
    .array(
      z.object({
        applicantId: z.string(),
        applicationData: z.object({
          personalInfo: z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string().email(),
            phone: z.string(),
          }),
          financialInfo: z.object({
            monthlyIncome: z.number().optional(),
            requestedAmount: z.number().optional(),
          }),
          location: z.object({
            country: z.string(),
          }),
        }),
      }),
    )
    .max(100), // Limit batch size
  options: z
    .object({
      priority: z.enum(["low", "normal", "high"]).default("normal"),
      webhook: z.string().url().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = BatchDecisionRequestSchema.parse(body)

    const batchId = validatedData.batchId || `BATCH-${Date.now()}`
    const startTime = Date.now()

    // Process applications in batch
    const results = validatedData.applications.map((app, index) => {
      // Simulate processing delay
      const processingTime = Math.random() * 200 + 50

      // Simple risk scoring for batch
      const baseScore = 500
      const incomeBonus = app.applicationData.financialInfo.monthlyIncome
        ? Math.min(app.applicationData.financialInfo.monthlyIncome / 1000, 300)
        : 0
      const randomVariation = Math.random() * 200 - 100
      const riskScore = Math.max(0, Math.min(1000, baseScore + incomeBonus + randomVariation))

      // Determine outcome
      let outcome = "approved"
      let reason = "Low risk profile"

      if (riskScore < 400) {
        outcome = "declined"
        reason = "High risk profile"
      } else if (riskScore < 600) {
        outcome = "review"
        reason = "Medium risk - manual review required"
      }

      return {
        applicantId: app.applicantId,
        decisionId: `DEC-${new Date().getFullYear()}-${String(Date.now() + index).slice(-6)}`,
        decision: {
          outcome,
          riskScore: Math.round(riskScore),
          confidence: Math.round((1000 - Math.abs(riskScore - 500)) / 10),
          reason,
        },
        processing: {
          duration: Math.round(processingTime),
          timestamp: new Date().toISOString(),
        },
      }
    })

    const totalProcessingTime = Date.now() - startTime

    // Calculate batch statistics
    const stats = {
      total: results.length,
      approved: results.filter((r) => r.decision.outcome === "approved").length,
      declined: results.filter((r) => r.decision.outcome === "declined").length,
      review: results.filter((r) => r.decision.outcome === "review").length,
      averageScore: Math.round(results.reduce((sum, r) => sum + r.decision.riskScore, 0) / results.length),
      averageProcessingTime: Math.round(results.reduce((sum, r) => sum + r.processing.duration, 0) / results.length),
    }

    return NextResponse.json({
      batchId,
      status: "completed",
      results,
      statistics: stats,
      processing: {
        totalDuration: totalProcessingTime,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        throughput: Math.round((results.length / totalProcessingTime) * 1000), // decisions per second
      },
      metadata: {
        workflowId: validatedData.workflowId,
        priority: validatedData.options?.priority || "normal",
        version: "v2.1.0",
      },
    })
  } catch (error) {
    console.error("Batch decision error:", error)

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
        message: "Failed to process batch decisions",
      },
      { status: 500 },
    )
  }
}
