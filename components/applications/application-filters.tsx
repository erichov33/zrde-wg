"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X, Search, Filter, SortAsc, SortDesc } from "lucide-react"
import { format } from "date-fns"
import { useApplications } from "@/lib/contexts/applications-context"
import { Application } from "@/lib/types/application"

interface ApplicationFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void
  currentSort: { sortBy: string; sortOrder: "asc" | "desc" }
}

export interface FilterState {
  search: string
  statuses: string[]
  workflows: string[]
  riskLevels: string[]
  priorities: string[]
  assignees: string[]
  dateRange: { from?: Date; to?: Date }
  amountRange: { min?: number; max?: number }
}

const workflowOptions = [
  { value: "Personal Loan", label: "Personal Loan" },
  { value: "Business Loan", label: "Business Loan" },
  { value: "Emergency Loan", label: "Emergency Loan" },
  { value: "Mortgage", label: "Mortgage" },
  { value: "Auto Loan", label: "Auto Loan" },
]

const riskLevels = [
  { value: "low", label: "Low Risk (700-800)", min: 700, max: 800 },
  { value: "medium", label: "Medium Risk (500-699)", min: 500, max: 699 },
  { value: "high", label: "High Risk (0-499)", min: 0, max: 499 },
]

const priorityOptions = [
  { value: "high", label: "High Priority" },
  { value: "normal", label: "Normal Priority" },
  { value: "low", label: "Low Priority" },
]

const sortOptions = [
  { value: "submittedAt", label: "Submission Date" },
  { value: "lastActivity", label: "Last Activity" },
  { value: "applicantName", label: "Applicant Name" },
  { value: "amount", label: "Amount" },
  { value: "riskScore", label: "Risk Score" },
  { value: "status", label: "Status" },
]

export function ApplicationFilters({ onFiltersChange, onSortChange, currentSort }: ApplicationFiltersProps) {
  const { applications } = useApplications()
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    statuses: [],
    workflows: [],
    riskLevels: [],
    priorities: [],
    assignees: [],
    dateRange: {},
    amountRange: {},
  })

  // Calculate dynamic counts and options
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const workflowCounts = applications.reduce((acc, app) => {
    acc[app.workflow] = (acc[app.workflow] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const uniqueAssignees = Array.from(new Set(applications.map(app => app.assignedTo).filter(Boolean)))

  const statusOptions = [
    { value: "submitted", label: "Submitted", count: statusCounts.submitted || 0 },
    { value: "processing", label: "Processing", count: statusCounts.processing || 0 },
    { value: "review", label: "Review Required", count: statusCounts.review || 0 },
    { value: "approved", label: "Approved", count: statusCounts.approved || 0 },
    { value: "declined", label: "Declined", count: statusCounts.declined || 0 },
  ]

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleStatusChange = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      statuses: checked 
        ? [...prev.statuses, status]
        : prev.statuses.filter(s => s !== status)
    }))
  }

  const handleWorkflowChange = (workflow: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      workflows: checked 
        ? [...prev.workflows, workflow]
        : prev.workflows.filter(w => w !== workflow)
    }))
  }

  const handleRiskLevelChange = (level: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      riskLevels: checked 
        ? [...prev.riskLevels, level]
        : prev.riskLevels.filter(l => l !== level)
    }))
  }

  const handlePriorityChange = (priority: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      priorities: checked 
        ? [...prev.priorities, priority]
        : prev.priorities.filter(p => p !== priority)
    }))
  }

  const handleAssigneeChange = (assignee: string) => {
    setFilters(prev => ({
      ...prev,
      assignees: prev.assignees.includes(assignee)
        ? prev.assignees.filter(a => a !== assignee)
        : [...prev.assignees, assignee]
    }))
  }

  const handleDateRangeChange = (dateRange: { from?: Date; to?: Date } | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      dateRange: dateRange || { from: undefined, to: undefined }
    }))
  }

  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : undefined
    setFilters(prev => ({
      ...prev,
      amountRange: { ...prev.amountRange, [field]: numValue }
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      search: "",
      statuses: [],
      workflows: [],
      riskLevels: [],
      priorities: [],
      assignees: [],
      dateRange: {},
      amountRange: {},
    })
  }

  const activeFiltersCount = 
    (filters.search ? 1 : 0) +
    filters.statuses.length + 
    filters.workflows.length +
    filters.riskLevels.length + 
    filters.priorities.length +
    filters.assignees.length +
    (filters.dateRange.from ? 1 : 0) +
    (filters.amountRange.min || filters.amountRange.max ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications by name, email, ID, or phone..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-transparent border-white/20 dark:border-slate-700/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sort Controls */}
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sort by:</span>
            </div>
            <Select value={currentSort.sortBy} onValueChange={(value) => onSortChange(value, currentSort.sortOrder)}>
              <SelectTrigger className="w-48 bg-transparent border-white/20 dark:border-slate-700/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSortChange(currentSort.sortBy, currentSort.sortOrder === "asc" ? "desc" : "asc")}
              className="gap-2 bg-transparent border-white/20 dark:border-slate-700/50"
            >
              {currentSort.sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              {currentSort.sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters} 
                className="gap-2 hover:bg-destructive/10 text-destructive hover:text-destructive-foreground"
              >
                <X className="h-3 w-3" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Filter */}
          <div>
            <h4 className="font-semibold mb-3">Status</h4>
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <div key={status.value} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={status.value}
                      checked={filters.statuses.includes(status.value)}
                      onCheckedChange={(checked) => handleStatusChange(status.value, checked as boolean)}
                    />
                    <label htmlFor={status.value} className="text-sm font-medium cursor-pointer">
                      {status.label}
                    </label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {status.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Filter */}
          <div>
            <h4 className="font-semibold mb-3">Workflow Type</h4>
            <div className="space-y-2">
              {workflowOptions.map((workflow) => (
                <div key={workflow.value} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={workflow.value}
                      checked={filters.workflows.includes(workflow.value)}
                      onCheckedChange={(checked) => handleWorkflowChange(workflow.value, checked as boolean)}
                    />
                    <label htmlFor={workflow.value} className="text-sm font-medium cursor-pointer">
                      {workflow.label}
                    </label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {workflowCounts[workflow.value] || 0}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Level Filter */}
          <div>
            <h4 className="font-semibold mb-3">Risk Level</h4>
            <div className="space-y-2">
              {riskLevels.map((level) => (
                <div key={level.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={level.value}
                    checked={filters.riskLevels.includes(level.value)}
                    onCheckedChange={(checked) => handleRiskLevelChange(level.value, checked as boolean)}
                  />
                  <label htmlFor={level.value} className="text-sm font-medium cursor-pointer">
                    {level.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <h4 className="font-semibold mb-3">Priority</h4>
            <div className="space-y-2">
              {priorityOptions.map((priority) => (
                <div key={priority.value} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={priority.value}
                    checked={filters.priorities.includes(priority.value)}
                    onCheckedChange={(checked) => handlePriorityChange(priority.value, checked as boolean)}
                  />
                  <label htmlFor={priority.value} className="text-sm font-medium cursor-pointer">
                    {priority.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          {uniqueAssignees.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Assigned To</h4>
              <Select value="" onValueChange={handleAssigneeChange}>
                <SelectTrigger className="bg-transparent border-white/20 dark:border-slate-700/50">
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueAssignees.map((assignee) => (
                    <SelectItem key={assignee} value={assignee}>
                      {assignee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.assignees.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {filters.assignees.map((assignee) => (
                    <Badge key={assignee} variant="secondary" className="gap-1">
                      {assignee}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleAssigneeChange(assignee)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Amount Range Filter */}
          <div>
            <h4 className="font-semibold mb-3">Amount Range (KES)</h4>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min amount"
                value={filters.amountRange.min || ""}
                onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                className="bg-transparent border-white/20 dark:border-slate-700/50"
              />
              <Input
                type="number"
                placeholder="Max amount"
                value={filters.amountRange.max || ""}
                onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                className="bg-transparent border-white/20 dark:border-slate-700/50"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4 className="font-semibold mb-3">Submission Date</h4>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 bg-transparent border-white/20 dark:border-slate-700/50"
                >
                  <CalendarIcon className="h-4 w-4" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange?.from}
                  selected={filters.dateRange?.from && filters.dateRange?.to ? {
                    from: filters.dateRange.from,
                    to: filters.dateRange.to
                  } : undefined}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                  className="rounded-md border-0"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
