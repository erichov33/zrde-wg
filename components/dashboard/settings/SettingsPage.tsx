"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { getCurrentUser, User } from "@/lib/auth"

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone)

  useEffect(() => {
    const u = getCurrentUser()
    setUser(u)
    const en = localStorage.getItem("settings_emailNotifications")
    const pn = localStorage.getItem("settings_pushNotifications")
    const tz = localStorage.getItem("settings_timezone")
    if (en) setEmailNotifications(en === "true")
    if (pn) setPushNotifications(pn === "true")
    if (tz) setTimezone(tz)
  }, [])

  const savePreferences = () => {
    localStorage.setItem("settings_emailNotifications", String(emailNotifications))
    localStorage.setItem("settings_pushNotifications", String(pushNotifications))
    localStorage.setItem("settings_timezone", timezone)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Personal preferences and account configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email || ""} readOnly />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <div className="mt-2">
                {user?.role && <Badge variant="outline">{user.role}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Theme</label>
              <Select value={theme || resolvedTheme || "system"} onValueChange={(v) => setTheme(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email notifications</div>
              <div className="text-sm text-muted-foreground">Receive updates and alerts by email</div>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Push notifications</div>
              <div className="text-sm text-muted-foreground">Show real-time notifications in the app</div>
            </div>
            <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={savePreferences}>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

