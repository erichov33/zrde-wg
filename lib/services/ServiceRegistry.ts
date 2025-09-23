/**
 * Service Registry - Dependency Injection Container
 * 
 * Manages service dependencies and enforces proper separation of concerns
 * following the Dependency Inversion Principle.
 */

import type {
  IWorkflowService,
  IBusinessLogicService,
  IConfigurationService,
  IWorkflowExecutionService,
  IDataSourceService
} from '@/lib/interfaces/workflow-interfaces'

import { UnifiedWorkflowService } from './unified-workflow-service'
import { WorkflowBusinessLogicService } from './workflow-business-logic-service'
import { EnhancedDecisionService } from './enhanced-decision-service'

export interface ServiceContainer {
  workflowService: IWorkflowService
  businessLogicService: IBusinessLogicService
  configurationService: IConfigurationService
  executionService: IWorkflowExecutionService
  dataSourceService: IDataSourceService
}

export class ServiceRegistry {
  private static instance: ServiceRegistry
  private services: Map<string, any> = new Map()
  private initialized = false

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry()
    }
    return ServiceRegistry.instance
  }

  /**
   * Initialize all services with proper dependency injection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize core services in dependency order
      await this.initializeCoreServices()
      await this.initializeBusinessServices()
      await this.initializeIntegrationServices()

      this.initialized = true
    } catch (error) {
      throw new Error(`Service initialization failed: ${error}`)
    }
  }

  /**
   * Get a service by interface type
   */
  getService<T>(serviceType: string): T {
    if (!this.initialized) {
      throw new Error('ServiceRegistry not initialized. Call initialize() first.')
    }

    const service = this.services.get(serviceType)
    if (!service) {
      throw new Error(`Service not found: ${serviceType}`)
    }

    return service as T
  }

  /**
   * Register a service implementation
   */
  registerService<T>(serviceType: string, implementation: T): void {
    this.services.set(serviceType, implementation)
  }

  /**
   * Get all services as a container
   */
  getContainer(): ServiceContainer {
    return {
      workflowService: this.getService<IWorkflowService>('IWorkflowService'),
      businessLogicService: this.getService<IBusinessLogicService>('IBusinessLogicService'),
      configurationService: this.getService<IConfigurationService>('IConfigurationService'),
      executionService: this.getService<IWorkflowExecutionService>('IWorkflowExecutionService'),
      dataSourceService: this.getService<IDataSourceService>('IDataSourceService')
    }
  }

  private async initializeCoreServices(): Promise<void> {
    // Register workflow service
    const workflowService = new UnifiedWorkflowService()
    this.registerService('IWorkflowService', workflowService)

    // Register business logic service
    const businessLogicService = WorkflowBusinessLogicService
    this.registerService('IBusinessLogicService', businessLogicService)
  }

  private async initializeBusinessServices(): Promise<void> {
    // Register enhanced decision service
    const decisionService = EnhancedDecisionService
    this.registerService('IDecisionService', decisionService)
  }

  private async initializeIntegrationServices(): Promise<void> {
    // Initialize integration services here
    // This is where external service connections would be established
  }

  /**
   * Clean shutdown of all services
   */
  async shutdown(): Promise<void> {
    // Cleanup services in reverse order
    for (const [serviceType, service] of this.services.entries()) {
      if (service && typeof service.shutdown === 'function') {
        try {
          await service.shutdown()
        } catch (error) {
          console.error(`Error shutting down ${serviceType}:`, error)
        }
      }
    }

    this.services.clear()
    this.initialized = false
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}

    for (const [serviceType, service] of this.services.entries()) {
      try {
        if (service && typeof service.healthCheck === 'function') {
          health[serviceType] = await service.healthCheck()
        } else {
          health[serviceType] = true // Assume healthy if no health check method
        }
      } catch (error) {
        health[serviceType] = false
      }
    }

    return health
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance()