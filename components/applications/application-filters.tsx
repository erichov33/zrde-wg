"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

const statusOptions = [
  { value: "submitted", label: "Submitted", count: 247 },
  { value: "processing", label: "Processing", count: 89 },
  { value: "review", label: "Review Required", count: 34 },
  { value: "approved", label: "Approved", count: 1247 },
  { value: "declined", label: "Declined", count: 156 },
]

const workflowOptions = [
  { value: "wf-001", label: "Credit Application Review" },
  { value: "wf-002", label: "Identity Verification" },
  { value: "wf-003", label: "Fraud Detection Pipeline" },
]

const riskLevels = [
  { value: "low", label: "Low Risk (700-1000)" },
  { value: "medium", label: "Medium Risk (400-699)" },
  { value: "high", label: "High Risk (0-399)" },
]

export function ApplicationFilters() {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("")
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      setSelectedStatuses([...selectedStatuses, status])
    } else {
      setSelectedStatuses(selectedStatuses.filter((s) => s !== status))
    }
  }

  const handleRiskLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setSelectedRiskLevels([...selectedRiskLevels, level])
    } else {
      setSelectedRiskLevels(selectedRiskLevels.filter((l) => l !== level))
    }
  }

  const clearAllFilters = () => {
    setSelectedStatuses([])
    setSelectedWorkflow("")
    setSelectedRiskLevels([])
    setDateRange({})
  }

  const activeFiltersCount =
    selectedStatuses.length + selectedRiskLevels.length + (selectedWorkflow ? 1 : 0) + (dateRange.from ? 1 : 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
                <X className="h-3 w-3" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Filter */}
          <div>
            <h4 className="font-medium mb-3">Status</h4>
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <div key={status.value} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={status.value}
                      checked={selectedStatuses.includes(status.value)}
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
            <h4 className="font-medium mb-3">Workflow</h4>
            <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
              <SelectTrigger>
                <SelectValue placeholder="Select workflow" />
              </SelectTrigger>
              <SelectContent>
                {workflowOptions.map((workflow) => (
                  <SelectItem key={workflow.value} value={workflow.value}>
                    {workflow.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <h4 className="font-medium mb-3">Risk Level</h4>
            <div className="space-y-2">
              {riskLevels.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={level.value}
                    checked={selectedRiskLevels.includes(level.value)}
                    onCheckedChange={(checked) => handleRiskLevelChange(level.value, checked as boolean)}
                  />
                  <label htmlFor={level.value} className="text-sm font-medium cursor-pointer">
                    {level.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4 className="font-medium mb-3">Date Range</h4>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
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
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange(range || {})}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            Review Queue (34)
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            High Risk Applications
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            Pending Documents
          </Button>
          <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
            Expired Applications
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
