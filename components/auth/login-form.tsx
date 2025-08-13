"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfaCode: "",
  })
  const [showMFA, setShowMFA] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simulate authentication
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (!showMFA) {
        // First step - email/password
        if (formData.email === "admin@zinduka.com" && formData.password === "admin123") {
          setShowMFA(true)
        } else {
          setError("Invalid email or password")
        }
      } else {
        // Second step - MFA
        if (formData.mfaCode === "123456") {
          // Store user session (in real app, use proper auth)
          localStorage.setItem(
            "user",
            JSON.stringify({
              email: formData.email,
              role: "Super Admin",
              organization: "Zinduka Financial",
            }),
          )
          router.push("/dashboard")
        } else {
          setError("Invalid MFA code")
        }
      }
    } catch (err) {
      setError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!showMFA ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@zinduka.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="admin123"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20 w-fit mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mfaCode">Authentication Code</Label>
            <Input
              id="mfaCode"
              type="text"
              placeholder="123456"
              value={formData.mfaCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, mfaCode: e.target.value }))}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {showMFA ? "Verifying..." : "Signing In..."}
            </div>
          ) : showMFA ? (
            "Verify & Sign In"
          ) : (
            "Sign In"
          )}
        </Button>

        {showMFA && (
          <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => setShowMFA(false)}>
            Back to Login
          </Button>
        )}
      </div>

      {!showMFA && (
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Demo Credentials: admin@zinduka.com / admin123
              <br />
              MFA Code: 123456
            </p>
          </CardContent>
        </Card>
      )}
    </form>
  )
}
