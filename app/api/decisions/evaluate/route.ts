import { type NextRequest, NextResponse } from "next/server"
import { DecisionService } from "@/lib/services/decision-service"
import { DecisionRequestSchema } from "@/lib/schemas/decision-schemas"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = DecisionRequestSchema.parse(body)
    
    // Process decision
    const result = await DecisionService.evaluateDecision(validatedData)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error("Decision evaluation error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
