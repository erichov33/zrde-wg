import { type NextRequest, NextResponse } from "next/server"

const mockIntegrations = [
  {
    id: "smile-identity",
    name: "Smile Identity",
    type: "Identity Verification",
    status: "active",
    health: 98.5,
    responseTime: 189,
    callsToday: 12847,
    quota: { used: 12847, limit: 50000 },
    lastCall: "2024-01-25T14:32:15Z",
    version: "v2.1",
    description: "Biometric identity verification and KYC compliance",
    endpoints: ["verify", "authenticate", "liveness-check"],
    configuration: {
      baseUrl: "https://api.smileidentity.com/v1",
      timeout: 30000,
      rateLimit: 1000,
      retryAttempts: 3,
    },
    credentials: {
      hasApiKey: true,
      keyLastRotated: "2024-01-15T10:30:00Z",
      keyExpiresAt: "2024-07-15T10:30:00Z",
    },
  },
  {
    id: "transunion",
    name: "TransUnion Africa",
    type: "Credit Bureau",
    status: "active",
    health: 99.2,
    responseTime: 234,
    callsToday: 8934,
    quota: { used: 8934, limit: 25000 },
    lastCall: "2024-01-25T14:27:45Z",
    version: "v3.0",
    description: "Credit reports and risk assessment data",
    endpoints: ["credit-report", "risk-score", "payment-history"],
    configuration: {
      baseUrl: "https://api.transunion.co.za/v2",
      timeout: 45000,
      rateLimit: 500,
      retryAttempts: 2,
    },
    credentials: {
      hasApiKey: true,
      keyLastRotated: "2024-01-10T09:15:00Z",
      keyExpiresAt: "2024-06-10T09:15:00Z",
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    let filteredIntegrations = [...mockIntegrations]

    if (status) {
      filteredIntegrations = filteredIntegrations.filter((integration) => integration.status === status)
    }

    if (type) {
      filteredIntegrations = filteredIntegrations.filter((integration) => integration.type === type)
    }

    // Calculate summary statistics
    const summary = {
      total: filteredIntegrations.length,
      active: filteredIntegrations.filter((i) => i.status === "active").length,
      warning: filteredIntegrations.filter((i) => i.status === "warning").length,
      inactive: filteredIntegrations.filter((i) => i.status === "inactive").length,
      totalCallsToday: filteredIntegrations.reduce((sum, i) => sum + i.callsToday, 0),
      averageHealth: Math.round(
        filteredIntegrations.reduce((sum, i) => sum + i.health, 0) / filteredIntegrations.length,
      ),
      averageResponseTime: Math.round(
        filteredIntegrations.reduce((sum, i) => sum + i.responseTime, 0) / filteredIntegrations.length,
      ),
    }

    return NextResponse.json({
      integrations: filteredIntegrations,
      summary,
      filters: { status, type },
    })
  } catch (error) {
    console.error("Integrations fetch error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch integrations",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Create new integration configuration
    const newIntegration = {
      id: `integration-${Date.now()}`,
      name: body.name,
      type: body.type,
      status: "inactive",
      health: 0,
      responseTime: 0,
      callsToday: 0,
      quota: { used: 0, limit: body.quota?.limit || 10000 },
      lastCall: null,
      version: body.version || "v1.0",
      description: body.description || "",
      endpoints: body.endpoints || [],
      configuration: {
        baseUrl: body.baseUrl,
        timeout: body.timeout || 30000,
        rateLimit: body.rateLimit || 1000,
        retryAttempts: body.retryAttempts || 3,
      },
      credentials: {
        hasApiKey: false,
        keyLastRotated: null,
        keyExpiresAt: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(newIntegration, { status: 201 })
  } catch (error) {
    console.error("Integration creation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to create integration",
      },
      { status: 500 },
    )
  }
}
