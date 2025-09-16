// Simple script to show recent logs
const { auditLoggingService } = require('./lib/services/audit-logging-service.ts');

async function displayRecentLogs() {
  console.log('\n📋 2 Most Recent Audit Logs:\n');
  
  try {
    // Get the 2 most recent events
    const events = await auditLoggingService.queryEvents({
      limit: 2,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    if (events.length === 0) {
      console.log('No logs found.');
      return;
    }

    events.forEach((event, index) => {
      const logNumber = index + 1;
      console.log(`🔸 Log ${logNumber}:`);
      console.log(`   📅 Time: ${event.timestamp.toLocaleString()}`);
      console.log(`   👤 User: ${event.userEmail}`);
      console.log(`   🎯 Action: ${event.action.toUpperCase()}`);
      console.log(`   📦 Resource: ${event.resource} (${event.resourceId})`);
      console.log(`   ⚠️  Severity: ${event.severity.toUpperCase()}`);
      console.log(`   📂 Category: ${event.category}`);
      console.log(`   ✅ Result: ${event.outcome.toUpperCase()}`);
      
      if (event.details && Object.keys(event.details).length > 0) {
        console.log(`   📋 Details:`);
        Object.entries(event.details).forEach(([key, value]) => {
          console.log(`      ${key}: ${JSON.stringify(value)}`);
        });
      }
      
      if (event.ipAddress) {
        console.log(`   🌐 IP: ${event.ipAddress}`);
      }
      
      console.log(`   ${'─'.repeat(60)}\n`);
    });

    // Show quick summary
    const summary = await auditLoggingService.generateSummary();
    console.log('📊 Quick Summary:');
    console.log(`   Total Events: ${summary.totalEvents}`);
    console.log(`   Critical: ${summary.eventsBySeverity.critical || 0}`);
    console.log(`   Failed: ${summary.eventsByOutcome.failure || 0}`);
    
  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
  }
}

displayRecentLogs();