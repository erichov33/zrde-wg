"use client"

import { UnifiedWorkflowSystem } from "@/components/workflows/unified-workflow-system"

// Sample workflow nodes for demonstration
const sampleNodes = [
  {
    id: "start_1",
    type: "start" as const,
    position: { x: 100, y: 200 },
    data: {
      label: "Start Application",
      description: "Beginning of loan application process",
      config: {},
    },
  },
  {
    id: "credit_check_1",
    type: "condition" as const,
    position: { x: 400, y: 150 },
    data: {
      label: "Credit Score Check",
      description: "Evaluate applicant credit score",
      config: {
        rules: [
          { condition: "creditScore >= 750", action: "approve", priority: 1 },
          { condition: "creditScore >= 650", action: "review", priority: 2 },
          { condition: "creditScore < 650", action: "decline", priority: 3 },
        ],
      },
    },
  },
  {
    id: "income_verification_1",
    type: "action" as const,
    position: { x: 400, y: 280 },
    data: {
      label: "Income Verification",
      description: "Verify applicant income sources",
      config: {
        dataSources: ["payroll_system", "bank_statements"],
        timeout: 30000,
      },
    },
  },
  {
    id: "approve_1",
    type: "end" as const,
    position: { x: 700, y: 120 },
    data: {
      label: "Approve Loan",
      description: "Loan application approved",
      config: {
        actions: ["send_approval_email", "create_loan_account"],
      },
    },
  },
  {
    id: "decline_1",
    type: "end" as const,
    position: { x: 700, y: 280 },
    data: {
      label: "Decline Loan",
      description: "Loan application declined",
      config: {
        actions: ["send_decline_email", "log_decision"],
      },
    },
  },
]

// Sample connections between nodes
const sampleConnections = [
  {
    id: "conn_1",
    source: "start_1",
    target: "credit_check_1",
    label: "begin",
  },
  {
    id: "conn_2",
    source: "start_1",
    target: "income_verification_1",
    label: "parallel",
  },
  {
    id: "conn_3",
    source: "credit_check_1",
    target: "approve_1",
    label: "approved",
    condition: "creditScore >= 650",
  },
  {
    id: "conn_4",
    source: "credit_check_1",
    target: "decline_1",
    label: "declined",
    condition: "creditScore < 650",
  },
  {
    id: "conn_5",
    source: "income_verification_1",
    target: "approve_1",
    label: "verified",
  },
]

export default function WorkflowBuilderPage() {
  const handleSave = (workflow: any) => {
    console.log("Saving workflow:", workflow)
    // Implement save logic here
  }

  const handleExecute = (workflow: any) => {
    console.log("Executing workflow:", workflow)
    // Implement execution logic here
  }

  return (
    <div className="h-screen">
      <UnifiedWorkflowSystem
        mode="enhanced"
        onSave={handleSave}
        onExecute={handleExecute}
      />
    </div>
  )
}
