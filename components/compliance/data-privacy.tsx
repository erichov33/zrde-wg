import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Database, Clock, AlertTriangle, CheckCircle, Eye, Download } from "lucide-react"

const dataCategories = [
  {
    category: "Personal Identifiable Information (PII)",
    records: 125847,
    retention: "7 years",
    compliance: 98,
    lastAudit: "2024-01-10",
    status: "Compliant",
  },
  {
    category: "Financial Transaction Data",
    records: 2847392,
    retention: "10 years",
    compliance: 95,
    lastAudit: "2024-01-08",
    status: "Minor Issues",
  },
  {
    category: "Biometric Data",
    records: 45632,
    retention: "5 years",
    compliance: 100,
    lastAudit: "2024-01-12",
    status: "Compliant",
  },
  {
    category: "Communication Records",
    records: 89234,
    retention: "3 years",
    compliance: 92,
    lastAudit: "2024-01-05",
    status: "Action Required",
  },
]

const privacyRequests = [
  {
    id: "PR-2024-001",
    type: "Data Access Request",
    customer: "john.doe@email.com",
    submitted: "2024-01-14",
    status: "In Progress",
    dueDate: "2024-01-28",
    priority: "Medium",
  },
  {
    id: "PR-2024-002",
    type: "Data Deletion Request",
    customer: "mary.smith@email.com",
    submitted: "2024-01-13",
    status: "Completed",
    dueDate: "2024-01-27",
    priority: "High",
  },
  {
    id: "PR-2024-003",
    type: "Data Portability Request",
    customer: "alex.johnson@email.com",
    submitted: "2024-01-12",
    status: "Under Review",
    dueDate: "2024-01-26",
    priority: "Low",
  },
]

export function DataPrivacy() {
  return (
    <div className="space-y-6">
      {/* Privacy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Records</CardTitle>
            <Database className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.1M</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Privacy Score</CardTitle>
            <Shield className="h-4 w-4 text-lime-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lime-400">96.2%</div>
            <p className="text-xs text-muted-foreground">GDPR compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Privacy requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">0</div>
            <p className="text-xs text-muted-foreground">Last 12 months</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Privacy Management */}
      <Tabs defaultValue="data-inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data-inventory">Data Inventory</TabsTrigger>
          <TabsTrigger value="privacy-requests">Privacy Requests</TabsTrigger>
          <TabsTrigger value="retention-policies">Retention Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="data-inventory">
          <Card>
            <CardHeader>
              <CardTitle>Data Inventory & Classification</CardTitle>
              <CardDescription>Monitor data categories and compliance status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataCategories.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{item.category}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{item.records.toLocaleString()} records</span>
                          <span>•</span>
                          <span>Retention: {item.retention}</span>
                          <span>•</span>
                          <span>Last audit: {item.lastAudit}</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          item.status === "Compliant"
                            ? "default"
                            : item.status === "Minor Issues"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Compliance Score</span>
                        <span>{item.compliance}%</span>
                      </div>
                      <Progress value={item.compliance} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy-requests">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Requests</CardTitle>
              <CardDescription>Manage GDPR and data subject rights requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {privacyRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{request.type}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Customer: {request.customer}</span>
                          <span>•</span>
                          <span>Submitted: {request.submitted}</span>
                          <span>•</span>
                          <span>Due: {request.dueDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            request.priority === "High"
                              ? "destructive"
                              : request.priority === "Medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {request.priority}
                        </Badge>
                        <Badge variant={request.status === "Completed" ? "default" : "secondary"}>
                          {request.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention-policies">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
              <CardDescription>Automated data lifecycle management and retention schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Automatic Deletion</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Records scheduled for automatic deletion based on retention policies
                    </p>
                    <div className="text-2xl font-bold text-red-400">1,247</div>
                    <p className="text-xs text-muted-foreground">Records due for deletion</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Archive Ready</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Records ready to be moved to long-term archive storage
                    </p>
                    <div className="text-2xl font-bold text-blue-400">8,932</div>
                    <p className="text-xs text-muted-foreground">Records for archival</p>
                  </div>
                </div>

                <Button className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Execute Retention Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
