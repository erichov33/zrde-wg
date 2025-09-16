"use client"

import { useState } from "react"
import { ApplicationHeader } from "@/components/applications/application-header"
import { ApplicationPipeline } from "@/components/applications/application-pipeline"
import { ApplicationFilters, FilterState } from "@/components/applications/application-filters"
import { ApplicationList } from "@/components/applications/application-list"

export default function ApplicationsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    statuses: [],
    workflows: [],
    riskLevels: [],
    priorities: [],
    assignees: [],
    dateRange: {},
    amountRange: {}
  })

  const [currentSort, setCurrentSort] = useState({
    sortBy: "submittedAt",
    sortOrder: "desc" as "asc" | "desc"
  })

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    setCurrentSort({ sortBy, sortOrder })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 rounded-3xl blur-3xl" />
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl">
            <ApplicationHeader />
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-3xl blur-3xl" />
          <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-xl">
            <ApplicationPipeline />
          </div>
        </div>
        
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-rose-500/5 rounded-2xl blur-2xl" />
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-xl p-6 shadow-lg">
                <ApplicationFilters 
                  onFiltersChange={handleFiltersChange}
                  onSortChange={handleSortChange}
                  currentSort={currentSort}
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <ApplicationList 
              filters={filters}
              sortBy={currentSort.sortBy}
              sortOrder={currentSort.sortOrder}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
