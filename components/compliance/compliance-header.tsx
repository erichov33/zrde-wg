import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Shield } from "lucide-react"

export function ComplianceHeader() {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-serif">Compliance & Audit</h1>
        <p className="text-muted-foreground">Monitor regulatory compliance and maintain comprehensive audit trails</p>
      </div>

      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="text-lime-400 border-lime-400">
          <Shield className="w-3 h-3 mr-1" />
          Compliant
        </Badge>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
        <Button size="sm">Generate Audit</Button>
      </div>
    </div>
  )
}
