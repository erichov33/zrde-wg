import { type NextRequest, NextResponse } from "next/server"

// Mock decision history data
const mockDecisions = [
  {
    decisionId: "DEC-2024-001247",
    applicantId: "APP-001247",
    applicantName: "John Doe",
    workflowId: "wf-001",
    workflowName: "Credit Application Review",
    decision: {
      outcome: "approved",
      riskScore: 847,
      confidence: 94,
      reason: "Low risk profile",
    },
    fraudAnalysis: {
      riskLevel: "low",
      confidence: 12,
      flags: [],
    },
    processing: {
      duration: 245,
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      version: "v2.1.0",
    },
    metadata: {
      source: "api",
      channel: "mobile",
      amount: 5000,
    },
  },
  {
    decisionId: "DEC-2024-001246",
    applicantId: "APP-001246",
    applicantName: "Sarah Wilson",
    workflowId: "wf-002",
    workflowName: "Identity Verification",
    decision: {
      outcome: "approved",
      riskScore: 923,
      confidence: 98,
      reason: "Identity verified successfully",
    },
    fraudAnalysis: {
      riskLevel: "low",
      confidence: 8,
      flags: [],
    },
    processing: {
      duration: 189,
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      version: "v2.1.0",
    },
    metadata: {
      source: "api",
      channel: "web",
    },
  },
  {
    decisionId: "DEC-2024-001245",
    applicantId: "APP-001245",
    applicantName: "Michael Chen",
    workflowId: "wf-001",
    workflowName: "Credit Application Review",
    decision: {
      outcome: "declined",
      riskScore: 234,
      confidence: 89,
      reason: "Fraud detected: Suspicious behavioral patterns detected",
    },
    fraudAnalysis: {
      riskLevel: "high",
      confidence: 87,
      flags: ["Suspicious behavioral patterns detected"],
    },
    processing: {
      duration: 312,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      version: "v2.1.0",
    },
    metadata: {
      source: "api",
      channel: "web",
      amount: 12000,
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const outcome = searchParams.get("outcome")
    const workflowId = searchParams.get("workflowId")
    const applicantId = searchParams.get("applicantId")

    // Filter decisions
    let filteredDecisions = [...mockDecisions]

    if (outcome) {
      filteredDecisions = filteredDecisions.filter((d) => d.decision.outcome === outcome)
    }

    if (workflowId) {
      filteredDecisions = filteredDecisions.filter((d) => d.workflowId === workflowId)
    }

    if (applicantId) {
      filteredDecisions = filteredDecisions.filter((d) => d.applicantId === applicantId)
    }

    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedDecisions = filteredDecisions.slice(startIndex, endIndex)

    // Generate additional mock data if needed
    const totalDecisions = Math.max(filteredDecisions.length, 1247)
    const additionalDecisions = []

    if (paginatedDecisions.length < limit && startIndex < totalDecisions) {
      const needed = Math.min(
        limit - paginatedDecisions.length,
        totalDecisions - startIndex - paginatedDecisions.length,
      )

      for (let i = 0; i < needed; i++) {
        const id = totalDecisions - startIndex - paginatedDecisions.length - i
        additionalDecisions.push({
          decisionId: `DEC-2024-${String(id).padStart(6, "0")}`,
          applicantId: `APP-${String(id).padStart(6, "0")}`,
          applicantName: `Applicant ${id}`,
          workflowId: ["wf-001", "wf-002", "wf-003"][i % 3],
          workflowName: ["Credit Application Review", "Identity Verification", "Fraud Detection Pipeline"][i % 3],
          decision: {
            outcome: ["approved", "declined", "review"][Math.floor(Math.random() * 3)],
            riskScore: Math.floor(Math.random() * 1000),
            confidence: Math.floor(Math.random() * 100),
            reason: "Automated decision",
          },
          fraudAnalysis: {
            riskLevel: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
            confidence: Math.floor(Math.random() * 100),
            flags: [],
          },
          processing: {
            duration: Math.floor(Math.random() * 500) + 100,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            version: "v2.1.0",
          },
          metadata: {
            source: "api",
            channel: ["web", "mobile", "api"][Math.floor(Math.random() * 3)],
          },
        })
      }
    }

    const allDecisions = [...paginatedDecisions, ...additionalDecisions]

    return NextResponse.json({
      decisions: allDecisions,
      pagination: {
        page,
        limit,
        total: totalDecisions,
        pages: Math.ceil(totalDecisions / limit),
        hasNext: page * limit < totalDecisions,
        hasPrev: page > 1,
      },
      filters: {
        outcome,
        workflowId,
        applicantId,
      },
    })
  } catch (error) {
    console.error("Decision history error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch decision history",
      },
      { status: 500 },
    )
  }
}
