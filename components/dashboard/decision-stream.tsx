import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

const decisions = [
  {
    id: "DEC-2024-001247",
    applicant: "John Doe",
    type: "Credit Application",
    decision: "approved",
    score: 847,
    timestamp: "2 min ago",
    amount: "$5,000",
  },
  {
    id: "DEC-2024-001246",
    applicant: "Sarah Wilson",
    type: "Identity Verification",
    decision: "approved",
    score: 923,
    timestamp: "3 min ago",
    amount: "-",
  },
  {
    id: "DEC-2024-001245",
    applicant: "Michael Chen",
    type: "Fraud Check",
    decision: "declined",
    score: 234,
    timestamp: "5 min ago",
    amount: "$12,000",
  },
  {
    id: "DEC-2024-001244",
    applicant: "Emma Johnson",
    type: "Credit Application",
    decision: "review",
    score: 567,
    timestamp: "7 min ago",
    amount: "$8,500",
  },
  {
    id: "DEC-2024-001243",
    applicant: "David Brown",
    type: "KYC Verification",
    decision: "approved",
    score: 789,
    timestamp: "9 min ago",
    amount: "-",
  },
]

const getDecisionIcon = (decision: string) => {
  switch (decision) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-accent" />
    case "declined":
      return <XCircle className="h-4 w-4 text-destructive" />
    case "review":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

const getDecisionBadge = (decision: string) => {
  switch (decision) {
    case "approved":
      return <Badge className="bg-accent/10 text-accent border-accent/20">Approved</Badge>
    case "declined":
      return <Badge variant="destructive">Declined</Badge>
    case "review":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          Review
        </Badge>
      )
    default:
      return <Badge variant="secondary">Pending</Badge>
  }
}

export function DecisionStream() {
  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          Real-time Decision Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[520px] px-6">
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="mt-1">{getDecisionIcon(decision.decision)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{decision.applicant}</p>
                    <span className="text-xs text-muted-foreground">{decision.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{decision.type}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDecisionBadge(decision.decision)}
                      <span className="text-xs text-muted-foreground">Score: {decision.score}</span>
                    </div>
                    {decision.amount !== "-" && <span className="text-xs font-medium">{decision.amount}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
