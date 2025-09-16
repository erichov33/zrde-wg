import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { ApplicationsProvider } from "@/lib/contexts/applications-context"
import "@/app/globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Zinduka Decision Engine",
  description: "AI-Powered Risk and Identity Decision Platform for African Financial Institutions",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ApplicationsProvider>
              {children}
            </ApplicationsProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
