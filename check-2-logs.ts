import { auditLoggingService } from './lib/services/audit-logging-service';

async function showRecentLogs() {
  try {
    console.log('📋 Fetching 2 most recent system logs...\n');
    
    const logs = await auditLoggingService.queryEvents({
      limit: 2,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    if (logs.length === 0) {
      console.log('No logs found.');
      return;
    }

    logs.forEach((log, index) => {
      console.log(`🔍 Log ${index + 1}:`);
      console.log(`   Timestamp: ${log.timestamp}`);
      console.log(`   User ID: ${log.userId}`);
      console.log(`   User Email: ${log.userEmail}`);
      console.log(`   Action: ${log.action}`);
      console.log(`   Resource: ${log.resource}`);
      console.log(`   Resource ID: ${log.resourceId}`);
      console.log(`   Severity: ${log.severity}`);
      console.log(`   Category: ${log.category}`);
      console.log(`   Outcome: ${log.outcome}`);
      console.log(`   Details: ${JSON.stringify(log.details, null, 2)}`);
      if (log.ipAddress) console.log(`   IP Address: ${log.ipAddress}`);
      if (log.sessionId) console.log(`   Session ID: ${log.sessionId}`);
      console.log('─'.repeat(50));
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
}

showRecentLogs();