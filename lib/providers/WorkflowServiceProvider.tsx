"use client"

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { WorkflowService } from '@/lib/services/WorkflowService'
import { WorkflowValidator, DefaultWorkflowValidator } from '@/lib/validators/WorkflowValidator'
import { WorkflowExecutor, DefaultWorkflowExecutor } from '@/lib/executors/WorkflowExecutor'
import { WorkflowRepository, InMemoryWorkflowRepository } from '@/lib/repositories/WorkflowRepository'
import { BusinessLogicService } from '@/lib/services/BusinessLogicService'

// Service interfaces for better type safety
export interface IWorkflowServices {
  workflow: WorkflowService
  validator: WorkflowValidator
  executor: WorkflowExecutor
  repository: WorkflowRepository
  businessLogic: BusinessLogicService
}

// Create the context
const WorkflowServiceContext = createContext<IWorkflowServices | null>(null)

interface WorkflowServiceProviderProps {
  children: ReactNode
}

export const WorkflowServiceProvider: React.FC<WorkflowServiceProviderProps> = ({ children }) => {
  const services = useMemo(() => {
    // Initialize repository
    const repository = new InMemoryWorkflowRepository()
    
    // Initialize validator
    const validator = new DefaultWorkflowValidator()
    
    // Initialize executor
    const executor = new DefaultWorkflowExecutor()
    
    // Initialize business logic service
    const businessLogic = new BusinessLogicService()
    
    // Initialize main workflow service with dependencies
    const workflow = new WorkflowService({
      repository,
      validator,
      executor,
      businessLogic
    })

    return {
      workflow,
      validator,
      executor,
      repository,
      businessLogic
    }
  }, [])
  
  return (
    <WorkflowServiceContext.Provider value={services}>
      {children}
    </WorkflowServiceContext.Provider>
  )
}

// Custom hook to use workflow services
export const useWorkflowServices = (): IWorkflowServices => {
  const context = useContext(WorkflowServiceContext)
  if (!context) {
    throw new Error('useWorkflowServices must be used within a WorkflowServiceProvider')
  }
  return context
}

// Individual service hooks for convenience
export const useWorkflowService = () => useWorkflowServices().workflow
export const useWorkflowValidator = () => useWorkflowServices().validator
export const useWorkflowExecutor = () => useWorkflowServices().executor
export const useWorkflowRepository = () => useWorkflowServices().repository
export const useBusinessLogicService = () => useWorkflowServices().businessLogic