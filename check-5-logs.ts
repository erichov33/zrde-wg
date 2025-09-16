import { auditLoggingService } from './lib/services/audit-logging-service'

async function show5Logs() {
  const events = await auditLoggingService.queryEvents({
    limit: 5,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  })

  console.log('\n📋 5 Most Recent Logs:\n')
  
  events.forEach((event, i) => {
    console.log(`🔸 Log ${i + 1}:`)
    console.log(`   Time: ${event.timestamp.toISOString()}`)
    console.log(`   User: ${event.userEmail}`)
    console.log(`   Action: ${event.action}`)
    console.log(`   Resource: ${event.resource} (${event.resourceId})`)
    console.log(`   Severity: ${event.severity}`)
    console.log(`   Result: ${event.outcome}`)
    console.log(`   Details: ${JSON.stringify(event.details, null, 2)}`)
    console.log(`   ${'─'.repeat(50)}`)
  })
}

show5Logs().catch(console.error)