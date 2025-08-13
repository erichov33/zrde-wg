import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { DecisionStream } from "@/components/dashboard/decision-stream"
import { RiskDistribution } from "@/components/dashboard/risk-distribution"
import { GeographicAnalysis } from "@/components/dashboard/geographic-analysis"
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />

      {/* KPI Overview */}
      <KPICards />

      {/* Main Analytics Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Decision Stream */}
        <div className="lg:col-span-1">
          <DecisionStream />
        </div>

        {/* Right Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <RiskDistribution />
          <div className="grid md:grid-cols-2 gap-6">
            <GeographicAnalysis />
            <PerformanceMetrics />
          </div>
        </div>
      </div>
    </div>
  )
}
