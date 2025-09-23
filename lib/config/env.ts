import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  SMILE_IDENTITY_API_KEY: z.string().optional(),
  TRANSUNION_API_KEY: z.string().optional(),
  MPESA_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
})

function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    // During build time, some env vars might not be available
    // Only throw in production runtime, not during build
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
      console.error("❌ Invalid environment variables:", error)
      throw new Error("Invalid environment configuration")
    }
    // Return safe defaults for build time
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV || "development",
      LOG_LEVEL: "info"
    })
  }
}

export const env = validateEnv()