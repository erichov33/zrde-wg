import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const integrationId = params.id

    // Mock integration details with extended information
    const integration = {
      id: integrationId,
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
      analytics: {
        last24Hours: {
          calls: 12847,
          errors: 23,
          averageResponseTime: 189,
          successRate: 99.8,
        },
        last7Days: {
          calls: 89234,
          errors: 156,
          averageResponseTime: 195,
          successRate: 99.7,
        },
        last30Days: {
          calls: 387456,
          errors: 678,
          averageResponseTime: 201,
          successRate: 99.6,
        },
      },
      recentLogs: [
        {
          id: "log-001",
          timestamp: "2024-01-25T14:32:15Z",
          endpoint: "/verify",
          method: "POST",
          status: "success",
          responseTime: 189,
          statusCode: 200,
          requestId: "req-12847",
        },
        {
          id: "log-002",
          timestamp: "2024-01-25T14:31:45Z",
          endpoint: "/authenticate",
          method: "POST",
          status: "success",
          responseTime: 156,
          statusCode: 200,
          requestId: "req-12846",
        },
        {
          id: "log-003",
          timestamp: "2024-01-25T14:31:12Z",
          endpoint: "/verify",
          method: "POST",
          status: "error",
          responseTime: 5000,
          statusCode: 500,
          requestId: "req-12845",
          error: "Service temporarily unavailable",
        },
      ],
    }

    return NextResponse.json(integration)
  } catch (error) {
    console.error("Integration details fetch error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to fetch integration details",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const integrationId = params.id
    const body = await request.json()

    // Mock integration update
    const updatedIntegration = {
      id: integrationId,
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(updatedIntegration)
  } catch (error) {
    console.error("Integration update error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to update integration",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const integrationId = params.id

    return NextResponse.json({
      message: `Integration ${integrationId} deleted successfully`,
      deletedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Integration deletion error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to delete integration",
      },
      { status: 500 },
    )
  }
}
