"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { auditLoggingService } from "@/lib/services/audit-logging-service"
import { Users, Filter, RefreshCw } from "lucide-react"

type Role = "Super Admin" | "Organization Admin" | "Risk Manager" | "Analyst" | "API User" | "Basic User"

interface ListedUser {
  id: string
  email: string
  role: Role
  organization: string
  lastLogin?: Date
  events: number
}

const roleColors: Record<Role, string> = {
  "Super Admin": "bg-purple-100 text-purple-800 border-purple-200",
  "Organization Admin": "bg-blue-100 text-blue-800 border-blue-200",
  "Risk Manager": "bg-amber-100 text-amber-800 border-amber-200",
  Analyst: "bg-green-100 text-green-800 border-green-200",
  "API User": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Basic User": "bg-gray-100 text-gray-800 border-gray-200",
}

export default function UsersPage() {
  const [users, setUsers] = useState<ListedUser[]>([])
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const summary = await auditLoggingService.generateSummary()
      const mapEmailToRole = (email: string): Role => {
        if (email.includes("admin")) return "Super Admin"
        if (email.includes("jane")) return "Organization Admin"
        if (email.includes("john")) return "Analyst"
        return "Basic User"
      }
      const listed: ListedUser[] = summary.topUsers.map(u => ({
        id: u.userId,
        email: u.userEmail,
        role: mapEmailToRole(u.userEmail),
        organization: "Company",
        lastLogin: new Date(),
        events: u.eventCount,
      }))
      setUsers(listed)
      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return users.filter(u => {
      const roleMatch = role === "all" || u.role === role
      const searchMatch = !search || u.email.toLowerCase().includes(search.toLowerCase())
      return roleMatch && searchMatch
    })
  }, [users, role, search])

  const refresh = async () => {
    setIsLoading(true)
    const summary = await auditLoggingService.generateSummary()
    const listed: ListedUser[] = summary.topUsers.map(u => ({
      id: u.userId,
      email: u.userEmail,
      role: users.find(x => x.email === u.userEmail)?.role || "Basic User",
      organization: "Company",
      lastLogin: new Date(),
      events: u.eventCount,
    }))
    setUsers(listed)
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-muted-foreground">Manage users, roles, and activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Input placeholder="Search by email" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Organization Admin">Organization Admin</SelectItem>
                  <SelectItem value="Risk Manager">Risk Manager</SelectItem>
                  <SelectItem value="Analyst">Analyst</SelectItem>
                  <SelectItem value="API User">API User</SelectItem>
                  <SelectItem value="Basic User">Basic User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[u.role]}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>{u.organization}</TableCell>
                  <TableCell>{u.events} events</TableCell>
                  <TableCell>{u.lastLogin?.toLocaleString() || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No users found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

