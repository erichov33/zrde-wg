import { type NextRequest, NextResponse } from "next/server"

const mockWorkflows = [
  {
    id: "wf-001",
    name: "Credit Application Review",
    description: "Automated credit decision workflow with risk assessment and fraud detection",
    status: "active",
    version: "v2.1",
    rules: [
      {
        id: "rule-1",
        type: "condition",
        condition: "riskScore >= 700",
        action: { outcome: "approved", reason: "Low risk profile" },
      },
      {
        id: "rule-2",
        type: "condition",
        condition: "riskScore >= 500",
        action: { outcome: "review", reason: "Medium risk - manual review required" },
      },
      {
        id: "rule-3",
        type: "condition",
        condition: "riskScore < 500",
        action: { outcome: "declined", reason: "High risk profile" },
      },
    ],
    integrations: ["transunion", "smile-identity", "mpesa"],
    statistics: {
      decisions: 45672,
      accuracy: 94.2,
      averageProcessingTime: 245,
    },
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:22:00Z",
    author: "Sarah Wilson",
  },
  {
    id: "wf-002",
    name: "Identity Verification",
    description: "KYC compliance workflow with biometric verification and document validation",
    status: "active",
    version: "v1.8",
    rules: [
      {
        id: "rule-1",
        type: "action",
        action: { type: "verify-identity", integration: "smile-identity" },
      },
      {
        id: "rule-2",
        type: "condition",
        condition: "identityScore >= 80",
        action: { outcome: "approved", reason: "Identity verified successfully" },
      },
      {
        id: "rule-3",
        type: "condition",
        condition: "identityScore < 80",
        action: { outcome: "review", reason: "Additional verification required" },
      },
    ],
    integrations: ["smile-identity"],
    statistics: {
      decisions: 23891,
      accuracy: 98.7,
      averageProcessingTime: 189,
    },
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T11:45:00Z",
    author: "Michael Chen",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const author = searchParams.get("author")

    let filteredWorkflows = [...mockWorkflows]

    if (status) {
      filteredWorkflows = filteredWorkflows.filter((w) => w.status === status)
    }

    if (author) {
      filteredWorkflows = filteredWorkflows.filter((w) => w.author.toLowerCase().includes(author.toLowerCase()))
    }

    return NextResponse.json({
      workflows: filteredWorkflows,
      total: filteredWorkflows.length,
    })
  } catch (error) {
    console.error("Workflows fetch error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch workflows",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Create new workflow
    const newWorkflow = {
      id: `wf-${String(Date.now()).slice(-3)}`,
      name: body.name || "New Workflow",
      description: body.description || "",
      status: "draft",
      version: "v1.0",
      rules: body.rules || [],
      integrations: body.integrations || [],
      statistics: {
        decisions: 0,
        accuracy: 0,
        averageProcessingTime: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: body.author || "System",
    }

    return NextResponse.json(newWorkflow, { status: 201 })
  } catch (error) {
    console.error("Workflow creation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to create workflow",
      },
      { status: 500 },
    )
  }
}
