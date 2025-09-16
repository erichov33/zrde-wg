import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { DecisionStream } from "@/components/dashboard/decision-stream"
import { RiskDistribution } from "@/components/dashboard/risk-distribution"
import { GeographicAnalysis } from "@/components/dashboard/geographic-analysis"
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <DashboardHeader />

        {/* KPI Overview */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-2xl blur-3xl" />
          <div className="relative">
            <KPICards />
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Decision Stream */}
          <div className="lg:col-span-1">
            <DecisionStream />
          </div>

          {/* Right Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            <RiskDistribution />
            <div className="grid md:grid-cols-2 gap-8">
              <GeographicAnalysis />
              <PerformanceMetrics />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
