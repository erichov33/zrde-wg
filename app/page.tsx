import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, TrendingUp, Users, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Zinduka Decision Engine</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empowering Financial Decisions with Real-Time Insights
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mt-1">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Risk Assessment</h3>
                  <p className="text-muted-foreground">
                    Multi-dimensional risk scoring with real-time decision orchestration and predictive modeling.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mt-1">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Identity Verification</h3>
                  <p className="text-muted-foreground">
                    Biometric verification, KYC/AML compliance automation, and contextual identity validation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mt-1">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Automated Workflows</h3>
                  <p className="text-muted-foreground">
                    Visual workflow builder with custom decision trees and real-time execution.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 mt-1">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
                  <p className="text-muted-foreground">
                    Comprehensive user management with multi-factor authentication and SSO integration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md border-border/50 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to access your decision engine dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
