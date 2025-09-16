import { useContext } from "react"
import { ApplicationsContext } from "@/lib/contexts/applications-context"

export function useApplications() {
  const context = useContext(ApplicationsContext)
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationsProvider')
  }
  return context
}