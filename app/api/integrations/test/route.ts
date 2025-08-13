import { type NextRequest, NextResponse } from "next/server"

const mockIntegrations = {
  "smile-identity": {
    name: "Smile Identity",
    type: "identity-verification",
    status: "active",
    endpoint: "https://api.smileidentity.com/v1",
    testEndpoint: "/test/verify",
  },
  transunion: {
    name: "TransUnion Africa",
    type: "credit-bureau",
    status: "active",
    endpoint: "https://api.transunion.co.za/v2",
    testEndpoint: "/test/credit-report",
  },
  mpesa: {
    name: "M-Pesa API",
    type: "payment-verification",
    status: "active",
    endpoint: "https://api.safaricom.co.ke/mpesa",
    testEndpoint: "/test/account-balance",
  },
  experian: {
    name: "Experian Africa",
    type: "credit-bureau",
    status: "maintenance",
    endpoint: "https://api.experian.co.za/v1",
    testEndpoint: "/test/credit-score",
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { integrationId, testType } = body

    if (!integrationId || !mockIntegrations[integrationId as keyof typeof mockIntegrations]) {
      return NextResponse.json(
        {
          error: "Invalid integration",
          message: "Integration not found or not supported",
        },
        { status: 400 },
      )
    }

    const integration = mockIntegrations[integrationId as keyof typeof mockIntegrations]

    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500))

    // Mock test results
    const testResults = {
      integrationId,
      integrationName: integration.name,
      testType: testType || "connectivity",
      status: integration.status === "maintenance" ? "failed" : "success",
      responseTime: Math.round(Math.random() * 500 + 100),
      timestamp: new Date().toISOString(),
      details:
        integration.status === "maintenance"
          ? {
              error: "Service temporarily unavailable",
              code: "MAINTENANCE_MODE",
              retryAfter: "2024-01-25T10:00:00Z",
            }
          : {
              endpoint: integration.endpoint + integration.testEndpoint,
              httpStatus: 200,
              dataReceived: true,
              validResponse: true,
            },
    }

    return NextResponse.json(testResults)
  } catch (error) {
    console.error("Integration test error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to test integration",
      },
      { status: 500 },
    )
  }
}
