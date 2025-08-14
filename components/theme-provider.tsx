"use client"

import * as React from "react"

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({ children, attribute = "class", defaultTheme = "dark", ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Set the default theme on the document
    if (typeof document !== "undefined") {
      document.documentElement.classList.add(defaultTheme)
    }
  }, [defaultTheme])

  return <>{children}</>
}
