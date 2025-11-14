/**
 * Enhanced Workflow System Test
 * 
 * This file demonstrates the improved workflow system with:
 * - Clear visual connectors between nodes
 * - Proper branching for decision nodes
 * - Enhanced flow visualization with arrows and labels
 * - Better node design and type indicators
 */

// Remove incorrect imports of canvas types
// import { WorkflowNode, WorkflowConnection } from './workflow-builder'

// Define local sample types that match this file’s data structure
type SampleNodeType = 
  | 'start' 
  | 'condition' 
  | 'action' 
  | 'end' 
  | 'data_source' 
  | 'rule_set' 
  | 'decision'
  | 'validation'
  | 'integration'
  | 'notification'
  | 'ai_decision'
  | 'batch_process'
  | 'audit_log'

interface SampleNode {
  id: string
  type: SampleNodeType
  label: string
  description?: string
  position: { x: number; y: number }
}

interface SampleConnection {
  id: string
  sourceNodeId: string
  sourceConnectorId: string
  targetNodeId: string
  targetConnectorId: string
}

// Sample workflow: Loan Application Processing
export const sampleEnhancedWorkflow = {
  nodes: [
    // 1. TRIGGER: Start the workflow
    {
      id: 'trigger-1',
      type: 'start' as const,
      label: 'New Application Submitted',
      description: 'Triggers when a loan application is submitted',
      position: { x: 100, y: 100 }
    },

    // 2. DATA SOURCE: Fetch applicant data
    {
      id: 'data-1',
      type: 'data_source' as const,
      label: 'Fetch Applicant Data',
      description: 'Retrieve applicant information from database',
      position: { x: 100, y: 250 }
    },

    // 3. VALIDATION: Validate application data
    {
      id: 'validation-1',
      type: 'validation' as const,
      label: 'Validate Application',
      description: 'Check if all required fields are complete',
      position: { x: 100, y: 400 }
    },

    // 4. CONDITION: Check loan amount
    {
      id: 'condition-1',
      type: 'condition' as const,
      label: 'Check Loan Amount',
      description: 'If loan amount ≤ $1,221',
      position: { x: 100, y: 550 }
    },

    // 5a. ACTION: Auto-approve (YES branch)
    {
      id: 'action-1',
      type: 'action' as const,
      label: 'Auto Approve',
      description: 'Automatically approve small loans',
      position: { x: 300, y: 700 }
    },

    // 5b. AI DECISION: Risk assessment (NO branch)
    {
      id: 'ai-decision-1',
      type: 'ai_decision' as const,
      label: 'AI Risk Assessment',
      description: 'AI evaluates risk factors for larger loans',
      position: { x: -100, y: 700 }
    },

    // 6a. ACTION: Manual review (HIGH RISK)
    {
      id: 'action-2',
      type: 'action' as const,
      label: 'Manual Review Required',
      description: 'Send to human underwriter',
      position: { x: -300, y: 850 }
    },

    // 6b. ACTION: Auto approve (LOW RISK)
    {
      id: 'action-3',
      type: 'action' as const,
      label: 'Auto Approve',
      description: 'Approve low-risk applications',
      position: { x: 100, y: 850 }
    },

    // 7. NOTIFICATION: Send approval notification
    {
      id: 'notification-1',
      type: 'notification' as const,
      label: 'Send Approval Email',
      description: 'Notify applicant of approval',
      position: { x: 200, y: 1000 }
    },

    // 8. AUDIT LOG: Log the decision
    {
      id: 'audit-1',
      type: 'audit_log' as const,
      label: 'Log Decision',
      description: 'Record approval decision for compliance',
      position: { x: 200, y: 1150 }
    },

    // 9. END: Application approved
    {
      id: 'end-1',
      type: 'end' as const,
      label: 'Application Approved',
      description: 'Workflow completed successfully',
      position: { x: 200, y: 1300 }
    },

    // Alternative end for manual review
    {
      id: 'end-2',
      type: 'end' as const,
      label: 'Pending Manual Review',
      description: 'Application sent for human review',
      position: { x: -300, y: 1000 }
    }
  ] as SampleNode[],

  connections: [
    // Main flow path
    {
      id: 'conn-1',
      sourceNodeId: 'trigger-1',
      sourceConnectorId: 'output',
      targetNodeId: 'data-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-2',
      sourceNodeId: 'data-1',
      sourceConnectorId: 'output',
      targetNodeId: 'validation-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-3',
      sourceNodeId: 'validation-1',
      sourceConnectorId: 'valid',
      targetNodeId: 'condition-1',
      targetConnectorId: 'input'
    },

    // Branching from loan amount condition
    {
      id: 'conn-4a',
      sourceNodeId: 'condition-1',
      sourceConnectorId: 'true', // YES: loan ≤ $1,221
      targetNodeId: 'action-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-4b',
      sourceNodeId: 'condition-1',
      sourceConnectorId: 'false', // NO: loan > $1,221
      targetNodeId: 'ai-decision-1',
      targetConnectorId: 'input'
    },

    // AI decision branching
    {
      id: 'conn-5a',
      sourceNodeId: 'ai-decision-1',
      sourceConnectorId: 'false', // HIGH RISK
      targetNodeId: 'action-2',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-5b',
      sourceNodeId: 'ai-decision-1',
      sourceConnectorId: 'true', // LOW RISK
      targetNodeId: 'action-3',
      targetConnectorId: 'input'
    },

    // Approval flow
    {
      id: 'conn-6a',
      sourceNodeId: 'action-1',
      sourceConnectorId: 'output',
      targetNodeId: 'notification-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-6b',
      sourceNodeId: 'action-3',
      sourceConnectorId: 'output',
      targetNodeId: 'notification-1',
      targetConnectorId: 'input'
    },

    // Final steps
    {
      id: 'conn-7',
      sourceNodeId: 'notification-1',
      sourceConnectorId: 'output',
      targetNodeId: 'audit-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-8',
      sourceNodeId: 'audit-1',
      sourceConnectorId: 'output',
      targetNodeId: 'end-1',
      targetConnectorId: 'input'
    },

    // Manual review path
    {
      id: 'conn-9',
      sourceNodeId: 'action-2',
      sourceConnectorId: 'output',
      targetNodeId: 'end-2',
      targetConnectorId: 'input'
    }
  ] as SampleConnection[]
}

// Sample workflow: Customer Support Ticket Processing
export const customerSupportWorkflow = {
  nodes: [
    {
      id: 'start-1',
      type: 'start' as const,
      label: 'New Support Ticket',
      description: 'Customer submits a support request',
      position: { x: 100, y: 100 }
    },
    {
      id: 'rule-1',
      type: 'rule_set' as const,
      label: 'Categorize Ticket',
      description: 'Apply rules to categorize ticket priority',
      position: { x: 100, y: 250 }
    },
    {
      id: 'condition-1',
      type: 'condition' as const,
      label: 'Is High Priority?',
      description: 'Check if ticket is high priority',
      position: { x: 100, y: 400 }
    },
    {
      id: 'action-1',
      type: 'action' as const,
      label: 'Escalate to Manager',
      description: 'Send high priority tickets to manager',
      position: { x: 300, y: 550 }
    },
    {
      id: 'action-2',
      type: 'action' as const,
      label: 'Assign to Agent',
      description: 'Assign normal tickets to available agent',
      position: { x: -100, y: 550 }
    },
    {
      id: 'notification-1',
      type: 'notification' as const,
      label: 'Send Confirmation',
      description: 'Notify customer that ticket was received',
      position: { x: 100, y: 700 }
    },
    {
      id: 'end-1',
      type: 'end' as const,
      label: 'Ticket Processed',
      description: 'Support ticket has been assigned',
      position: { x: 100, y: 850 }
    }
  ] as SampleNode[],

  connections: [
    {
      id: 'conn-1',
      sourceNodeId: 'start-1',
      sourceConnectorId: 'output',
      targetNodeId: 'rule-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-2',
      sourceNodeId: 'rule-1',
      sourceConnectorId: 'output',
      targetNodeId: 'condition-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-3a',
      sourceNodeId: 'condition-1',
      sourceConnectorId: 'true',
      targetNodeId: 'action-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-3b',
      sourceNodeId: 'condition-1',
      sourceConnectorId: 'false',
      targetNodeId: 'action-2',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-4a',
      sourceNodeId: 'action-1',
      sourceConnectorId: 'output',
      targetNodeId: 'notification-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-4b',
      sourceNodeId: 'action-2',
      sourceConnectorId: 'output',
      targetNodeId: 'notification-1',
      targetConnectorId: 'input'
    },
    {
      id: 'conn-5',
      sourceNodeId: 'notification-1',
      sourceConnectorId: 'output',
      targetNodeId: 'end-1',
      targetConnectorId: 'input'
    }
  ] as SampleConnection[]
}

/**
 * Key Enhancements Made:
 * 
 * 1. VISUAL CONNECTORS:
 *    - Larger, more prominent connector circles
 *    - Color-coded connectors (green for YES/true, red for NO/false)
 *    - Always-visible connection points
 *    - Clear labels for branch connectors
 * 
 * 2. FLOW VISUALIZATION:
 *    - Curved connection lines with arrows
 *    - Branch labels on connections
 *    - Shadow effects for depth
 *    - Animated temporary connections during creation
 * 
 * 3. NODE DESIGN:
 *    - Enhanced visual styling with shadows and borders
 *    - Clear type badges (TRIGGER, CONDITION, ACTION, END)
 *    - Branch indicators for decision nodes
 *    - Flow direction arrows
 * 
 * 4. BRANCHING SUPPORT:
 *    - Proper YES/NO branches for conditions
 *    - PASS/FAIL branches for validations
 *    - SUCCESS/ERROR branches for batch processes
 *    - Multiple output connectors for decision nodes
 * 
 * 5. WORKFLOW TOOLBOX:
 *    - Better categorization with visual sections
 *    - Examples for each node type
 *    - Clear descriptions of functionality
 *    - Help section with workflow building tips
 */