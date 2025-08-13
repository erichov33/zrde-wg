import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Edit, Eye, Plus, Search, Clock, CheckCircle, AlertCircle } from "lucide-react"

const policies = [
  {
    id: "POL-001",
    title: "Know Your Customer (KYC) Policy",
    category: "Identity Verification",
    version: "2.1",
    status: "Active",
    lastReview: "2024-01-10",
    nextReview: "2024-04-10",
    owner: "Compliance Team",
    description: "Comprehensive KYC requirements for customer onboarding",
  },
  {
    id: "POL-002",
    title: "Anti-Money Laundering (AML) Policy",
    category: "Financial Crime",
    version: "1.8",
    status: "Under Review",
    lastReview: "2024-01-05",
    nextReview: "2024-02-05",
    owner: "Risk Management",
    description: "AML compliance procedures and monitoring requirements",
  },
  {
    id: "POL-003",
    title: "Data Privacy and Protection Policy",
    category: "Data Governance",
    version: "3.0",
    status: "Active",
    lastReview: "2024-01-12",
    nextReview: "2024-07-12",
    owner: "Data Protection Officer",
    description: "GDPR and local data protection compliance guidelines",
  },
  {
    id: "POL-004",
    title: "Credit Risk Assessment Policy",
    category: "Risk Management",
    version: "1.5",
    status: "Draft",
    lastReview: "2024-01-08",
    nextReview: "2024-02-08",
    owner: "Credit Risk Team",
    description: "Standardized credit risk evaluation procedures",
  },
]

export function PolicyManagement() {
  return (
    <div className="space-y-6">
      {/* Policy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <CheckCircle className="h-4 w-4 text-lime-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Currently enforced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Policy Management Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Policy Management</CardTitle>
              <CardDescription>Manage compliance policies and regulatory requirements</CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Policy
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search policies..." className="pl-8" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          {/* Policy Categories */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Policies</TabsTrigger>
              <TabsTrigger value="identity">Identity Verification</TabsTrigger>
              <TabsTrigger value="financial">Financial Crime</TabsTrigger>
              <TabsTrigger value="data">Data Governance</TabsTrigger>
              <TabsTrigger value="risk">Risk Management</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{policy.title}</h4>
                      <p className="text-sm text-muted-foreground">{policy.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Version {policy.version}</span>
                        <span>•</span>
                        <span>Owner: {policy.owner}</span>
                        <span>•</span>
                        <span>Next Review: {policy.nextReview}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{policy.category}</Badge>
                      <Badge
                        variant={
                          policy.status === "Active"
                            ? "default"
                            : policy.status === "Under Review"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {policy.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last reviewed: {policy.lastReview}</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
