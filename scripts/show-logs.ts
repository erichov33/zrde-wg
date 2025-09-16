/**
 * Script to display recent logs from the audit logging service
 */

import { auditLoggingService } from '../lib/services/audit-logging-service'

async function showRecentLogs(count: number = 2) {
  try {
    console.log(`\n📋 Showing ${count} most recent logs:\n`)
    
    // Query recent events
    const recentEvents = await auditLoggingService.queryEvents({
      limit: count,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    })

    if (recentEvents.length === 0) {
      console.log("No logs found.")
      return
    }

    recentEvents.forEach((event, index) => {
      console.log(`🔸 Log ${index + 1}:`)
      console.log(`   ID: ${event.id}`)
      console.log(`   Timestamp: ${event.timestamp.toISOString()}`)
      console.log(`   User: ${event.userEmail} (${event.userId})`)
      console.log(`   Action: ${event.action}`)
      console.log(`   Resource: ${event.resource} (${event.resourceId})`)
      console.log(`   Severity: ${event.severity.toUpperCase()}`)
      console.log(`   Category: ${event.category}`)
      console.log(`   Outcome: ${event.outcome.toUpperCase()}`)
      console.log(`   Details: ${JSON.stringify(event.details, null, 2)}`)
      
      if (event.ipAddress) {
        console.log(`   IP Address: ${event.ipAddress}`)
      }
      
      if (event.sessionId) {
        console.log(`   Session: ${event.sessionId}`)
      }
      
      console.log(`   ${'─'.repeat(60)}`)
    })

    // Show summary
    const summary = await auditLoggingService.generateSummary()
    console.log(`\n📊 Summary:`)
    console.log(`   Total Events: ${summary.totalEvents}`)
    console.log(`   Critical Events: ${summary.eventsBySeverity.critical || 0}`)
    console.log(`   Failed Operations: ${summary.eventsByOutcome.failure || 0}`)
    
  } catch (error) {
    console.error("❌ Error retrieving logs:", error)
  }
}

// Run the script
showRecentLogs(2)