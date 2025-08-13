"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Settings,
  Shield,
  Users,
  Workflow,
  Database,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { name: "Applications", href: "/dashboard/applications", icon: FileText },
  { name: "Integrations", href: "/dashboard/integrations", icon: Database },
  { name: "Analytics", href: "/dashboard/analytics", icon: Activity },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Compliance", href: "/dashboard/compliance", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <Card
      className={cn(
        "h-screen rounded-none border-r border-l-0 border-t-0 border-b-0 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg">Zinduka</h2>
                  <p className="text-xs text-muted-foreground">Decision Engine</p>
                </div>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    collapsed && "px-2 justify-center",
                    isActive && "bg-primary/10 text-primary border border-primary/20",
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Status Indicator */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">System Online</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                99.9% Uptime
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
