"use client"

/**
 * Demo script to test the enhanced workflow system with connectors and branching
 * This demonstrates the new visual connectors and connection creation capabilities
 */

import { WorkflowNode, WorkflowConnection } from './components/workflows/workflow-builder'

// Sample workflow with various node types and connections
const sampleNodes: WorkflowNode[] = [
  {
    id: "start-1",
    type: "start",
    position: { x: 50, y: 200 },
    data: { label: "Application Received" }
  },
  {
    id: "validation-1",
    type: "validation",
    position: { x: 250, y: 200 },
    data: { label: "Document Validation" }
  },
  {
    id: "condition-1",
    type: "condition",
    position: { x: 450, y: 150 },
    data: { label: "Credit Score Check" }
  },
  {
    id: "ai-decision-1",
    type: "ai_decision",
    position: { x: 650, y: 100 },
    data: { label: "AI Risk Assessment" }
  },
  {
    id: "rule-set-1",
    type: "rule_set",
    position: { x: 650, y: 250 },
    data: { label: "Business Rules" }
  },
  {
    id: "action-1",
    type: "action",
    position: { x: 850, y: 100 },
    data: { label: "Approve Application" }
  },
  {
    id: "action-2",
    type: "action",
    position: { x: 850, y: 200 },
    data: { label: "Request More Info" }
  },
  {
    id: "notification-1",
    type: "notification",
    position: { x: 850, y: 300 },
    data: { label: "Reject & Notify" }
  },
  {
    id: "end-1",
    type: "end",
    position: { x: 1050, y: 200 },
    data: { label: "Process Complete" }
  }
]

const sampleConnections: WorkflowConnection[] = [
  {
    id: "conn-1",
    source: "start-1",
    target: "validation-1",
    label: "Next"
  },
  {
    id: "conn-2",
    source: "validation-1",
    target: "condition-1",
    label: "Valid"
  },
  {
    id: "conn-3",
    source: "condition-1",
    target: "ai-decision-1",
    label: "Yes"
  },
  {
    id: "conn-4",
    source: "condition-1",
    target: "rule-set-1",
    label: "No"
  },
  {
    id: "conn-5",
    source: "ai-decision-1",
    target: "action-1",
    label: "Approved"
  },
  {
    id: "conn-6",
    source: "ai-decision-1",
    target: "action-2",
    label: "Rejected"
  },
  {
    id: "conn-7",
    source: "rule-set-1",
    target: "action-2",
    label: "Pass"
  },
  {
    id: "conn-8",
    source: "rule-set-1",
    target: "notification-1",
    label: "Fail"
  },
  {
    id: "conn-9",
    source: "action-1",
    target: "end-1"
  },
  {
    id: "conn-10",
    source: "action-2",
    target: "end-1"
  },
  {
    id: "conn-11",
    source: "notification-1",
    target: "end-1"
  }
]

console.log("Enhanced Workflow System Demo")
console.log("=============================")
console.log("")
console.log("New Features:")
console.log("✅ Visual connectors on nodes")
console.log("✅ Interactive connection creation")
console.log("✅ Branching support for decision nodes")
console.log("✅ Advanced node types with appropriate connectors")
console.log("✅ Curved connection paths with labels")
console.log("✅ Color-coded branches (green for success, red for failure)")
console.log("")
console.log("Node Types Supported:")
console.log("- Start/End nodes: Single input/output")
console.log("- Condition/Decision/AI Decision: Input + True/False branches")
console.log("- Rule Set: Input + Pass/Fail branches")
console.log("- Validation: Input + Valid/Invalid branches")
console.log("- Batch Process: Input + Success/Error branches")
console.log("- Action/Integration/Data Source: Input + Output")
console.log("")
console.log("Sample Workflow Created:")
console.log(`- ${sampleNodes.length} nodes with various types`)
console.log(`- ${sampleConnections.length} connections with branching logic`)
console.log("")
console.log("How to Use:")
console.log("1. Select a node to see its connectors")
console.log("2. Drag from output connectors to input connectors")
console.log("3. Decision nodes show True/False branch indicators")
console.log("4. Connections are color-coded and labeled")
console.log("5. Hover over connections to highlight them")

export { sampleNodes, sampleConnections }