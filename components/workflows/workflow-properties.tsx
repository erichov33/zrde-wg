"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import type { WorkflowNode } from "./workflow-builder"

interface WorkflowPropertiesProps {
  selectedNode: WorkflowNode | null
  onNodeUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void
}

export function WorkflowProperties({ selectedNode, onNodeUpdate }: WorkflowPropertiesProps) {
  if (!selectedNode) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">Select a node to edit its properties</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const updateNodeData = (key: string, value: any) => {
    onNodeUpdate(selectedNode.id, {
      data: {
        ...selectedNode.data,
        [key]: value,
      },
    })
  }

  const renderNodeSpecificProperties = () => {
    switch (selectedNode.type) {
      case "condition":
        return (
          <div className="space-y-4">
            <div>
              <Label>Condition Type</Label>
              <Select defaultValue="risk-score">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk-score">Risk Score</SelectItem>
                  <SelectItem value="credit-score">Credit Score</SelectItem>
                  <SelectItem value="income">Income Level</SelectItem>
                  <SelectItem value="age">Age Range</SelectItem>
                  <SelectItem value="location">Geographic Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Risk Score Threshold</Label>
              <div className="space-y-2">
                <Slider defaultValue={[650]} max={1000} min={0} step={10} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 (High Risk)</span>
                  <span>650</span>
                  <span>1000 (Low Risk)</span>
                </div>
              </div>
            </div>

            <div>
              <Label>Operator</Label>
              <Select defaultValue="greater-than">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater-than">Greater than</SelectItem>
                  <SelectItem value="less-than">Less than</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="between">Between</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "action":
        return (
          <div className="space-y-4">
            <div>
              <Label>Action Type</Label>
              <Select defaultValue="verify-identity">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verify-identity">Verify Identity</SelectItem>
                  <SelectItem value="check-credit">Check Credit Bureau</SelectItem>
                  <SelectItem value="fraud-check">Fraud Detection</SelectItem>
                  <SelectItem value="income-verification">Income Verification</SelectItem>
                  <SelectItem value="send-notification">Send Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Integration</Label>
              <Select defaultValue="smile-identity">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smile-identity">Smile Identity</SelectItem>
                  <SelectItem value="transunion">TransUnion Africa</SelectItem>
                  <SelectItem value="experian">Experian Africa</SelectItem>
                  <SelectItem value="mpesa">M-Pesa API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Timeout (seconds)</Label>
              <Input type="number" defaultValue="30" min="1" max="300" />
            </div>
          </div>
        )

      case "end":
        return (
          <div className="space-y-4">
            <div>
              <Label>Decision Outcome</Label>
              <Select defaultValue="approved">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="review">Manual Review</SelectItem>
                  <SelectItem value="pending">Pending Information</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Reason Code</Label>
              <Input placeholder="e.g., INSUFFICIENT_CREDIT_HISTORY" />
            </div>

            <div>
              <Label>Customer Message</Label>
              <Textarea
                placeholder="Message to display to the customer"
                defaultValue="Your application has been approved. You will receive further instructions via email."
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Properties
            <Badge variant="outline" className="text-xs">
              {selectedNode.type}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Node Label</Label>
            <Input
              value={selectedNode.data.label}
              onChange={(e) => updateNodeData("label", e.target.value)}
              placeholder="Enter node label"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Describe what this node does"
              defaultValue={selectedNode.data.description || ""}
              onChange={(e) => updateNodeData("description", e.target.value)}
            />
          </div>

          {renderNodeSpecificProperties()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full bg-transparent" size="sm">
            Test This Node
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
