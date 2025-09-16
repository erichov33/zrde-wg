import { z } from "zod"

export const PersonalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18 && age <= 100
  }, "Must be between 18 and 100 years old"),
  nationalId: z.string().optional(),
})

export const FinancialInfoSchema = z.object({
  monthlyIncome: z.number().positive().optional(),
  employmentStatus: z.enum(["employed", "self-employed", "unemployed", "retired"]).optional(),
  requestedAmount: z.number().positive().optional(),
  loanPurpose: z.string().optional(),
})

export const LocationSchema = z.object({
  country: z.string().length(2, "Country code must be 2 characters"),
  city: z.string().optional(),
  address: z.string().optional(),
})

export const DeviceInfoSchema = z.object({
  ipAddress: z.string().ip(),
  userAgent: z.string().min(1),
  deviceFingerprint: z.string().optional(),
}).optional()

export const MetadataSchema = z.object({
  source: z.string().optional(),
  channel: z.string().optional(),
  timestamp: z.string().optional(),
}).optional()

export const DecisionRequestSchema = z.object({
  applicantId: z.string().min(1, "Applicant ID is required"),
  workflowId: z.string().min(1, "Workflow ID is required"),
  applicationData: z.object({
    personalInfo: PersonalInfoSchema,
    financialInfo: FinancialInfoSchema,
    location: LocationSchema,
    deviceInfo: DeviceInfoSchema,
  }),
  metadata: MetadataSchema,
})

export type DecisionRequestType = z.infer<typeof DecisionRequestSchema>