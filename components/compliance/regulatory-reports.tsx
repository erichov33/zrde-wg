import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Download, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react"

const reports = [
  {
    id: "REP-2024-001",
    title: "Central Bank of Kenya - Monthly Risk Report",
    type: "Risk Assessment",
    dueDate: "2024-01-31",
    status: "Draft",
    progress: 85,
    lastUpdated: "2024-01-15",
    priority: "High",
  },
  {
    id: "REP-2024-002",
    title: "Nigerian Financial Intelligence Unit - Suspicious Activity",
    type: "AML/CFT",
    dueDate: "2024-01-25",
    status: "Submitted",
    progress: 100,
    lastUpdated: "2024-01-12",
    priority: "Critical",
  },
  {
    id: "REP-2024-003",
    title: "South African Reserve Bank - Quarterly Compliance",
    type: "Regulatory Compliance",
    dueDate: "2024-02-15",
    status: "In Progress",
    progress: 45,
    lastUpdated: "2024-01-10",
    priority: "Medium",
  },
  {
    id: "REP-2024-004",
    title: "Bank of Ghana - Digital Lending Report",
    type: "Digital Finance",
    dueDate: "2024-02-28",
    status: "Not Started",
    progress: 0,
    lastUpdated: "2024-01-01",
    priority: "Low",
  },
]

export function RegulatoryReports() {
  return (
    <div className="space-y-6">
      {/* Report Generation Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
          <CardDescription>Create regulatory reports for various African financial authorities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <FileText className="w-6 h-6 mb-2" />
              Risk Assessment Report
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <AlertTriangle className="w-6 h-6 mb-2" />
              AML/CFT Report
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <CheckCircle className="w-6 h-6 mb-2" />
              Compliance Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Active Reports</CardTitle>
          <CardDescription>Track progress and manage regulatory reporting deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{report.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{report.type}</span>
                      <span>•</span>
                      <span>ID: {report.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        report.priority === "Critical"
                          ? "destructive"
                          : report.priority === "High"
                            ? "default"
                            : report.priority === "Medium"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {report.priority}
                    </Badge>
                    <Badge
                      variant={
                        report.status === "Submitted" ? "default" : report.status === "Draft" ? "secondary" : "outline"
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{report.progress}%</span>
                  </div>
                  <Progress value={report.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {report.dueDate}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Updated: {report.lastUpdated}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
