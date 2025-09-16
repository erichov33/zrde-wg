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
      return <CheckCircle className="h-5 w-5 text-emerald-600" />
    case "declined":
      return <XCircle className="h-5 w-5 text-red-600" />
    case "review":
      return <AlertTriangle className="h-5 w-5 text-amber-600" />
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />
  }
}

const getDecisionBadge = (decision: string) => {
  switch (decision) {
    case "approved":
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 shadow-sm">Approved</Badge>
    case "declined":
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200 shadow-sm">Declined</Badge>
    case "review":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 shadow-sm">
          Review
        </Badge>
      )
    default:
      return <Badge variant="secondary">Pending</Badge>
  }
}

const getDecisionGradient = (decision: string) => {
  switch (decision) {
    case "approved":
      return "from-emerald-50/50 to-green-50/50 border-emerald-200/50"
    case "declined":
      return "from-red-50/50 to-rose-50/50 border-red-200/50"
    case "review":
      return "from-amber-50/50 to-yellow-50/50 border-amber-200/50"
    default:
      return "from-muted/30 to-muted/10 border-border/50"
  }
}

export function DecisionStream() {
  return (
    <Card className="h-[600px] shadow-lg border-2 border-border/50 bg-gradient-to-br from-card to-card/95">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 rounded-full bg-primary/10">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-sm" />
          </div>
          Real-time Decision Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[520px] px-6">
          <div className="space-y-4 py-4">
            {decisions.map((decision, index) => (
              <div
                key={decision.id}
                className={`group relative overflow-hidden rounded-xl border-2 bg-gradient-to-r ${getDecisionGradient(decision.decision)} p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-full bg-white/50 backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {getDecisionIcon(decision.decision)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-base text-foreground group-hover:text-foreground/90 transition-colors">
                        {decision.applicant}
                      </p>
                      <span className="text-sm text-muted-foreground font-medium bg-white/50 px-2 py-1 rounded-md">
                        {decision.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {decision.type}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getDecisionBadge(decision.decision)}
                        <span className="text-sm text-muted-foreground font-medium bg-white/30 px-2 py-1 rounded-md">
                          Score: <span className="font-semibold">{decision.score}</span>
                        </span>
                      </div>
                      {decision.amount !== "-" && (
                        <span className="text-sm font-bold text-foreground bg-white/50 px-3 py-1 rounded-lg shadow-sm">
                          {decision.amount}
                        </span>
                      )}
                    </div>
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
