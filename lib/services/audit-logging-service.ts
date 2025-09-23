export interface AuditEvent {
  id: string
  timestamp: Date
  userId: string
  userEmail: string
  action: AuditAction
  resource: AuditResource
  resourceId: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: AuditCategory
  outcome: 'success' | 'failure' | 'error'
  metadata?: Record<string, any>
}

export type AuditAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'execute' | 'approve' | 'reject' | 'review'
  | 'login' | 'logout' | 'access_denied'
  | 'export' | 'import' | 'backup' | 'restore'
  | 'configure' | 'deploy' | 'test' | 'simulate'

export type AuditResource = 
  | 'workflow' | 'rule' | 'decision' | 'application'
  | 'user' | 'role' | 'permission' | 'integration'
  | 'data_source' | 'test_case' | 'execution'
  | 'configuration' | 'system'

export type AuditCategory = 
  | 'security' | 'compliance' | 'data_access' | 'system_change'
  | 'business_logic' | 'user_activity' | 'integration'
  | 'performance' | 'error' | 'configuration'

export interface AuditQuery {
  userId?: string
  action?: AuditAction
  resource?: AuditResource
  resourceId?: string
  category?: AuditCategory
  severity?: string[]
  outcome?: string[]
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'severity' | 'action'
  sortOrder?: 'asc' | 'desc'
}

export interface AuditSummary {
  totalEvents: number
  eventsByAction: Record<AuditAction, number>
  eventsByResource: Record<AuditResource, number>
  eventsByCategory: Record<AuditCategory, number>
  eventsBySeverity: Record<string, number>
  eventsByOutcome: Record<string, number>
  topUsers: Array<{ userId: string; userEmail: string; eventCount: number }>
  recentActivity: AuditEvent[]
}

export interface ComplianceReport {
  id: string
  generatedAt: Date
  period: { start: Date; end: Date }
  totalEvents: number
  criticalEvents: number
  securityEvents: number
  dataAccessEvents: number
  failedOperations: number
  complianceScore: number
  violations: ComplianceViolation[]
  recommendations: string[]
}

export interface ComplianceViolation {
  id: string
  type: 'security' | 'data_access' | 'unauthorized_action' | 'policy_breach'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  events: AuditEvent[]
  recommendation: string
}

export class AuditLoggingService {
  private events: Map<string, AuditEvent> = new Map()
  private eventsByUser: Map<string, string[]> = new Map()
  private eventsByResource: Map<string, string[]> = new Map()
  private retentionPeriodDays: number = 2555 // 7 years for compliance

  constructor() {
    this.initializeMockData()
  }

  private initializeMockData() {
    // Generate some sample audit events
    const sampleEvents: Omit<AuditEvent, 'id' | 'timestamp'>[] = [
      {
        userId: 'user1',
        userEmail: 'john.doe@company.com',
        action: 'create',
        resource: 'workflow',
        resourceId: 'loan-approval-v1',
        details: { workflowName: 'Loan Approval Workflow', version: '1.0.0' },
        severity: 'medium',
        category: 'business_logic',
        outcome: 'success',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        sessionId: 'sess_123'
      },
      {
        userId: 'user2',
        userEmail: 'jane.smith@company.com',
        action: 'execute',
        resource: 'workflow',
        resourceId: 'loan-approval-v1',
        details: { 
          applicationId: 'app_456', 
          decision: 'approved', 
          riskScore: 0.25,
          executionTime: 1250
        },
        severity: 'low',
        category: 'business_logic',
        outcome: 'success',
        ipAddress: '192.168.1.101',
        sessionId: 'sess_124'
      },
      {
        userId: 'user3',
        userEmail: 'admin@company.com',
        action: 'update',
        resource: 'rule',
        resourceId: 'credit-score-rule',
        details: { 
          oldThreshold: 700, 
          newThreshold: 750,
          reason: 'Updated risk assessment criteria'
        },
        severity: 'high',
        category: 'configuration',
        outcome: 'success',
        ipAddress: '192.168.1.102',
        sessionId: 'sess_125'
      },
      {
        userId: 'user1',
        userEmail: 'john.doe@company.com',
        action: 'access_denied',
        resource: 'configuration',
        resourceId: 'system-settings',
        details: { 
          reason: 'Insufficient permissions',
          attemptedAction: 'modify_system_settings'
        },
        severity: 'critical',
        category: 'security',
        outcome: 'failure',
        ipAddress: '192.168.1.100',
        sessionId: 'sess_126'
      }
    ]

    sampleEvents.forEach((event, index) => {
      const auditEvent: AuditEvent = {
        ...event,
        id: `audit_${Date.now()}_${index}`,
        timestamp: new Date(Date.now() - (index * 3600000)) // Spread events over hours
      }
      this.logEvent(auditEvent)
    })
  }

  // Core logging functionality
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'> | AuditEvent): Promise<string> {
    const auditEvent: AuditEvent = 'id' in event ? event : {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    // Store the event
    this.events.set(auditEvent.id, auditEvent)

    // Index by user
    if (!this.eventsByUser.has(auditEvent.userId)) {
      this.eventsByUser.set(auditEvent.userId, [])
    }
    this.eventsByUser.get(auditEvent.userId)!.push(auditEvent.id)

    // Index by resource
    const resourceKey = `${auditEvent.resource}:${auditEvent.resourceId}`
    if (!this.eventsByResource.has(resourceKey)) {
      this.eventsByResource.set(resourceKey, [])
    }
    this.eventsByResource.get(resourceKey)!.push(auditEvent.id)

    // In a real implementation, you would also:
    // - Send to external logging service (e.g., CloudWatch, Splunk)
    // - Store in database
    // - Trigger alerts for critical events
    // - Apply data retention policies

    if (auditEvent.severity === 'critical') {
      await this.handleCriticalEvent(auditEvent)
    }

    return auditEvent.id
  }

  // Convenience methods for common audit events
  async logWorkflowExecution(
    userId: string,
    userEmail: string,
    workflowId: string,
    executionDetails: Record<string, any>,
    outcome: 'success' | 'failure' | 'error',
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      userEmail,
      action: 'execute',
      resource: 'workflow',
      resourceId: workflowId,
      details: executionDetails,
      severity: outcome === 'success' ? 'low' : 'medium',
      category: 'business_logic',
      outcome,
      metadata
    })
  }

  async logDecisionMade(
    userId: string,
    userEmail: string,
    applicationId: string,
    decision: string,
    details: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      userEmail,
      action: 'approve',
      resource: 'decision',
      resourceId: applicationId,
      details: { decision, ...details },
      severity: 'medium',
      category: 'business_logic',
      outcome: 'success',
      metadata
    })
  }

  async logSecurityEvent(
    userId: string,
    userEmail: string,
    action: AuditAction,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high',
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      userEmail,
      action,
      resource: 'system',
      resourceId: 'security',
      details,
      severity,
      category: 'security',
      outcome: action === 'access_denied' ? 'failure' : 'success',
      metadata
    })
  }

  async logConfigurationChange(
    userId: string,
    userEmail: string,
    resourceType: AuditResource,
    resourceId: string,
    changes: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      userEmail,
      action: 'update',
      resource: resourceType,
      resourceId,
      details: { changes },
      severity: 'high',
      category: 'configuration',
      outcome: 'success',
      metadata
    })
  }

  // Query and retrieval methods
  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    let events = Array.from(this.events.values())

    // Apply filters
    if (query.userId) {
      events = events.filter(e => e.userId === query.userId)
    }
    if (query.action) {
      events = events.filter(e => e.action === query.action)
    }
    if (query.resource) {
      events = events.filter(e => e.resource === query.resource)
    }
    if (query.resourceId) {
      events = events.filter(e => e.resourceId === query.resourceId)
    }
    if (query.category) {
      events = events.filter(e => e.category === query.category)
    }
    if (query.severity) {
      events = events.filter(e => query.severity!.includes(e.severity))
    }
    if (query.outcome) {
      events = events.filter(e => query.outcome!.includes(e.outcome))
    }
    if (query.startDate) {
      events = events.filter(e => e.timestamp >= query.startDate!)
    }
    if (query.endDate) {
      events = events.filter(e => e.timestamp <= query.endDate!)
    }

    // Sort
    const sortBy = query.sortBy || 'timestamp'
    const sortOrder = query.sortOrder || 'desc'
    events.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortBy) {
        case 'timestamp':
          aVal = a.timestamp.getTime()
          bVal = b.timestamp.getTime()
          break
        case 'severity':
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
          aVal = severityOrder[a.severity]
          bVal = severityOrder[b.severity]
          break
        case 'action':
          aVal = a.action
          bVal = b.action
          break
        default:
          aVal = a.timestamp.getTime()
          bVal = b.timestamp.getTime()
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || 100
    return events.slice(offset, offset + limit)
  }

  async getEventById(eventId: string): Promise<AuditEvent | null> {
    return this.events.get(eventId) || null
  }

  async getEventsByUser(userId: string, limit: number = 100): Promise<AuditEvent[]> {
    const eventIds = this.eventsByUser.get(userId) || []
    return eventIds
      .slice(-limit)
      .map(id => this.events.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  async getEventsByResource(resource: AuditResource, resourceId: string, limit: number = 100): Promise<AuditEvent[]> {
    const resourceKey = `${resource}:${resourceId}`
    const eventIds = this.eventsByResource.get(resourceKey) || []
    return eventIds
      .slice(-limit)
      .map(id => this.events.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Analytics and reporting
  async generateSummary(startDate?: Date, endDate?: Date): Promise<AuditSummary> {
    const events = await this.queryEvents({ startDate, endDate, limit: 10000 })
    
    const eventsByAction: Record<string, number> = {}
    const eventsByResource: Record<string, number> = {}
    const eventsByCategory: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    const eventsByOutcome: Record<string, number> = {}
    const userEventCounts: Record<string, { email: string; count: number }> = {}

    events.forEach(event => {
      // Count by action
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1
      
      // Count by resource
      eventsByResource[event.resource] = (eventsByResource[event.resource] || 0) + 1
      
      // Count by category
      eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
      
      // Count by outcome
      eventsByOutcome[event.outcome] = (eventsByOutcome[event.outcome] || 0) + 1
      
      // Count by user
      if (!userEventCounts[event.userId]) {
        userEventCounts[event.userId] = { email: event.userEmail, count: 0 }
      }
      const userCount = userEventCounts[event.userId]
      if (userCount) {
        userCount.count++
      }
    })

    const topUsers = Object.entries(userEventCounts)
      .map(([userId, data]) => ({ userId, userEmail: data.email, eventCount: data.count }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10)

    const recentActivity = events.slice(0, 20)

    return {
      totalEvents: events.length,
      eventsByAction: eventsByAction as Record<AuditAction, number>,
      eventsByResource: eventsByResource as Record<AuditResource, number>,
      eventsByCategory: eventsByCategory as Record<AuditCategory, number>,
      eventsBySeverity,
      eventsByOutcome,
      topUsers,
      recentActivity
    }
  }

  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    const events = await this.queryEvents({ startDate, endDate, limit: 10000 })
    
    const criticalEvents = events.filter(e => e.severity === 'critical')
    const securityEvents = events.filter(e => e.category === 'security')
    const dataAccessEvents = events.filter(e => e.category === 'data_access')
    const failedOperations = events.filter(e => e.outcome === 'failure' || e.outcome === 'error')
    
    // Calculate compliance score (simplified)
    const totalEvents = events.length
    const negativeEvents = criticalEvents.length + failedOperations.length
    const complianceScore = totalEvents > 0 ? Math.max(0, 100 - (negativeEvents / totalEvents) * 100) : 100

    // Detect violations
    const violations = await this.detectComplianceViolations(events)
    
    // Generate recommendations
    const recommendations = this.generateComplianceRecommendations(violations, events)

    return {
      id: `compliance_${Date.now()}`,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      totalEvents: totalEvents,
      criticalEvents: criticalEvents.length,
      securityEvents: securityEvents.length,
      dataAccessEvents: dataAccessEvents.length,
      failedOperations: failedOperations.length,
      complianceScore: Math.round(complianceScore),
      violations,
      recommendations
    }
  }

  private async detectComplianceViolations(events: AuditEvent[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = []

    // Detect multiple failed login attempts
    const failedLogins = events.filter(e => 
      e.action === 'login' && e.outcome === 'failure'
    )
    const failedLoginsByUser = new Map<string, AuditEvent[]>()
    
    failedLogins.forEach(event => {
      if (!failedLoginsByUser.has(event.userId)) {
        failedLoginsByUser.set(event.userId, [])
      }
      failedLoginsByUser.get(event.userId)!.push(event)
    })

    failedLoginsByUser.forEach((userFailedLogins, userId) => {
      if (userFailedLogins.length >= 5) {
        violations.push({
          id: `violation_${Date.now()}_${userId}`,
          type: 'security',
          severity: 'high',
          description: `Multiple failed login attempts detected for user ${userId}`,
          events: userFailedLogins,
          recommendation: 'Review user account security and consider implementing account lockout policies'
        })
      }
    })

    // Detect unauthorized access attempts
    const accessDeniedEvents = events.filter(e => e.action === 'access_denied')
    if (accessDeniedEvents.length > 10) {
      violations.push({
        id: `violation_${Date.now()}_access_denied`,
        type: 'unauthorized_action',
        severity: 'medium',
        description: `High number of access denied events (${accessDeniedEvents.length})`,
        events: accessDeniedEvents.slice(0, 10),
        recommendation: 'Review user permissions and access control policies'
      })
    }

    // Detect critical configuration changes without approval
    const criticalConfigChanges = events.filter(e => 
      e.action === 'update' && 
      e.severity === 'critical' && 
      !e.details.approvalId
    )
    
    if (criticalConfigChanges.length > 0) {
      violations.push({
        id: `violation_${Date.now()}_config`,
        type: 'policy_breach',
        severity: 'critical',
        description: 'Critical configuration changes made without proper approval',
        events: criticalConfigChanges,
        recommendation: 'Implement approval workflow for critical configuration changes'
      })
    }

    return violations
  }

  private generateComplianceRecommendations(violations: ComplianceViolation[], events: AuditEvent[]): string[] {
    const recommendations: string[] = []

    if (violations.some(v => v.type === 'security')) {
      recommendations.push('Strengthen authentication and access control mechanisms')
      recommendations.push('Implement multi-factor authentication for sensitive operations')
    }

    if (violations.some(v => v.type === 'unauthorized_action')) {
      recommendations.push('Review and update user role assignments and permissions')
      recommendations.push('Implement principle of least privilege access')
    }

    if (violations.some(v => v.type === 'policy_breach')) {
      recommendations.push('Establish formal approval workflows for critical changes')
      recommendations.push('Implement automated policy compliance checks')
    }

    const errorRate = events.filter(e => e.outcome === 'error').length / events.length
    if (errorRate > 0.05) {
      recommendations.push('Investigate and address high error rates in system operations')
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring and maintaining current security practices')
      recommendations.push('Regular review of audit logs and compliance metrics')
    }

    return recommendations
  }

  private async handleCriticalEvent(event: AuditEvent): Promise<void> {
    // In a real implementation, this would:
    // - Send immediate alerts to security team
    // - Trigger automated response procedures
    // - Log to high-priority monitoring systems
    // - Potentially trigger incident response workflows
    
    console.warn('CRITICAL AUDIT EVENT:', {
      id: event.id,
      action: event.action,
      resource: event.resource,
      userId: event.userId,
      details: event.details
    })
  }

  // Data retention and cleanup
  async cleanupOldEvents(): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPeriodDays)
    
    let deletedCount = 0
    
    for (const [eventId, event] of this.events.entries()) {
      if (event.timestamp < cutoffDate) {
        this.events.delete(eventId)
        deletedCount++
        
        // Clean up indexes
        const userEvents = this.eventsByUser.get(event.userId)
        if (userEvents) {
          const index = userEvents.indexOf(eventId)
          if (index > -1) {
            userEvents.splice(index, 1)
          }
        }
        
        const resourceKey = `${event.resource}:${event.resourceId}`
        const resourceEvents = this.eventsByResource.get(resourceKey)
        if (resourceEvents) {
          const index = resourceEvents.indexOf(eventId)
          if (index > -1) {
            resourceEvents.splice(index, 1)
          }
        }
      }
    }
    
    return deletedCount
  }

  // Export functionality
  async exportEvents(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    const events = await this.queryEvents(query)
    
    if (format === 'csv') {
      const headers = [
        'ID', 'Timestamp', 'User ID', 'User Email', 'Action', 'Resource', 
        'Resource ID', 'Severity', 'Category', 'Outcome', 'Details'
      ]
      
      const csvRows = [
        headers.join(','),
        ...events.map(event => [
          event.id,
          event.timestamp.toISOString(),
          event.userId,
          event.userEmail,
          event.action,
          event.resource,
          event.resourceId,
          event.severity,
          event.category,
          event.outcome,
          JSON.stringify(event.details).replace(/"/g, '""')
        ].map(field => `"${field}"`).join(','))
      ]
      
      return csvRows.join('\n')
    } else {
      return JSON.stringify(events, null, 2)
    }
  }
}

// Export singleton instance
export const auditLoggingService = new AuditLoggingService()