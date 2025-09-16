import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Workflow, Activity } from "lucide-react"
import Link from "next/link"

/**
 * Statistics data for the workflow dashboard
 */
const WORKFLOW_STATS = [
  {
    id: "active-workflows",
    title: "Active Workflows",
    value: "12",
    icon: Workflow,
    gradient: {
      card: "from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50",
      border: "border-blue-200/50 dark:border-blue-800/50",
      icon: "from-blue-500 to-indigo-500"
    }
  },
  {
    id: "decisions-today",
    title: "Decisions Today",
    value: "1.2M",
    icon: Activity,
    gradient: {
      card: "from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50",
      border: "border-emerald-200/50 dark:border-emerald-800/50",
      icon: "from-emerald-500 to-teal-500"
    }
  },
  {
    id: "accuracy",
    title: "Average Accuracy",
    value: "99.2%",
    icon: null, // Special case for badge display
    gradient: {
      card: "from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50",
      border: "border-purple-200/50 dark:border-purple-800/50",
      icon: "from-purple-500 to-pink-500"
    }
  }
] as const

/**
 * CSS classes for consistent styling
 */
const STYLES = {
  title: "text-4xl font-serif font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent",
  subtitle: "text-lg text-slate-600 dark:text-slate-300 mt-2",
  createButton: "gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3",
  statCard: "group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl",
  statIcon: "p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300",
  statValue: "text-3xl font-bold text-slate-900 dark:text-slate-100",
  statLabel: "text-sm text-slate-600 dark:text-slate-400 font-medium",
  accuracyBadge: "bg-white/90 text-purple-700 border-purple-200 font-semibold px-3 py-1"
} as const

/**
 * WorkflowHeader component displays the main header for the workflows dashboard
 * Includes title, description, create button, and key statistics
 */
export function WorkflowHeader() {
  /**
   * Renders the header section with title and create button
   */
  const renderHeaderSection = () => (
    <div className="flex items-center justify-between">
      <div>
        <h1 className={STYLES.title}>
          Decision Workflows
        </h1>
        <p className={STYLES.subtitle}>
          Design and manage automated decision processes
        </p>
      </div>
      <Link href="/dashboard/workflows/builder">
        <Button className={STYLES.createButton}>
          <Plus className="h-4 w-4" />
          Create Workflow
        </Button>
      </Link>
    </div>
  )

  /**
   * Renders the icon for a stat card
   */
  const renderStatIcon = (stat: typeof WORKFLOW_STATS[number]) => {
    if (!stat.icon) {
      // Special case for accuracy badge
      return (
        <div className={`${STYLES.statIcon} bg-gradient-to-br ${stat.gradient.icon}`}>
          <Badge className={STYLES.accuracyBadge}>
            {stat.value}
          </Badge>
        </div>
      )
    }

    const IconComponent = stat.icon
    return (
      <div className={`${STYLES.statIcon} bg-gradient-to-br ${stat.gradient.icon}`}>
        <IconComponent className="h-5 w-5 text-white" />
      </div>
    )
  }

  /**
   * Renders the content for a stat card
   */
  const renderStatContent = (stat: typeof WORKFLOW_STATS[number]) => {
    // Special layout for accuracy stat
    if (stat.id === "accuracy") {
      return (
        <div className="flex items-center gap-4">
          {renderStatIcon(stat)}
          <div>
            <p className={STYLES.statLabel}>{stat.title}</p>
          </div>
        </div>
      )
    }

    // Standard layout for other stats
    return (
      <div className="flex items-center gap-4">
        {renderStatIcon(stat)}
        <div>
          <p className={STYLES.statValue}>{stat.value}</p>
          <p className={STYLES.statLabel}>{stat.title}</p>
        </div>
      </div>
    )
  }

  /**
   * Renders a single statistics card
   */
  const renderStatCard = (stat: typeof WORKFLOW_STATS[number]) => (
    <Card 
      key={stat.id}
      className={`${STYLES.statCard} bg-gradient-to-br ${stat.gradient.card} ${stat.gradient.border}`}
    >
      <CardContent className="p-6">
        {renderStatContent(stat)}
      </CardContent>
    </Card>
  )

  /**
   * Renders the statistics grid
   */
  const renderStatsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {WORKFLOW_STATS.map(renderStatCard)}
    </div>
  )

  return (
    <div className="space-y-6">
      {renderHeaderSection()}
      {renderStatsGrid()}
    </div>
  )
}
