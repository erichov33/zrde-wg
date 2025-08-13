import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Download, Eye } from "lucide-react"

const auditEvents = [
  {
    id: "AUD-2024-001",
    timestamp: "2024-01-15 14:32:15",
    user: "john.doe@bank.co.ke",
    action: "Decision Override",
    resource: "Application #APP-2024-0156",
    details: "Manual approval for high-value loan application",
    riskLevel: "High",
    status: "Completed",
  },
  {
    id: "AUD-2024-002",
    timestamp: "2024-01-15 14:28:42",
    user: "system@zinduka.ai",
    action: "Workflow Execution",
    resource: "Credit Assessment Workflow",
    details: "Automated risk scoring completed",
    riskLevel: "Low",
    status: "Completed",
  },
  {
    id: "AUD-2024-003",
    timestamp: "2024-01-15 14:25:18",
    user: "mary.smith@fintech.ng",
    action: "Data Access",
    resource: "Customer Profile #CUST-789",
    details: "Accessed customer financial history",
    riskLevel: "Medium",
    status: "Completed",
  },
  {
    id: "AUD-2024-004",
    timestamp: "2024-01-15 14:20:33",
    user: "admin@zinduka.ai",
    action: "Policy Update",
    resource: "KYC Verification Policy",
    details: "Updated identity verification requirements",
    riskLevel: "High",
    status: "Pending Review",
  },
]

export function AuditTrail() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <CardDescription>Complete log of all system activities and user actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search audit events..." className="pl-8" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="decision">Decision Override</SelectItem>
              <SelectItem value="workflow">Workflow Execution</SelectItem>
              <SelectItem value="access">Data Access</SelectItem>
              <SelectItem value="policy">Policy Update</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Audit Events Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono text-sm">{event.id}</TableCell>
                  <TableCell className="text-sm">{event.timestamp}</TableCell>
                  <TableCell className="text-sm">{event.user}</TableCell>
                  <TableCell className="text-sm font-medium">{event.action}</TableCell>
                  <TableCell className="text-sm">{event.resource}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.riskLevel === "High"
                          ? "destructive"
                          : event.riskLevel === "Medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {event.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.status === "Completed" ? "default" : "secondary"}>{event.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
