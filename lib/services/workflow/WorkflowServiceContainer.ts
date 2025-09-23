import { 
  IWorkflowDefinition, 
  ValidationResult, 
  ExecutionContext, 
  ExecutionResult,
  IWorkflowExecutionService 
} from '@/lib/interfaces/workflow-interfaces'

// CRUD Service Interface
export interface IWorkflowCRUDService {
  create(workflow: IWorkflowDefinition): Promise<IWorkflowDefinition>
  read(id: string): Promise<IWorkflowDefinition | null>
  update(id: string, workflow: Partial<IWorkflowDefinition>): Promise<IWorkflowDefinition>
  delete(id: string): Promise<boolean>
  list(): Promise<IWorkflowDefinition[]>
}

// Validation Service Interface
export interface IWorkflowValidationService {
  validate(workflow: IWorkflowDefinition): Promise<ValidationResult>
  validateNode(nodeId: string, workflow: IWorkflowDefinition): Promise<ValidationResult>
  validateConnection(connectionId: string, workflow: IWorkflowDefinition): Promise<ValidationResult>
}

export class WorkflowServiceContainer {
  constructor(
    private crudService: IWorkflowCRUDService,
    private validationService: IWorkflowValidationService,
    private executionService: IWorkflowExecutionService
  ) {}
  
  // Facade pattern for backward compatibility
  async createWorkflow(definition: IWorkflowDefinition) {
    const validationResult = await this.validationService.validate(definition)
    
    // Check if validation passed
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(error => error.message).join(', ')
      throw new Error(`Workflow validation failed: ${errorMessages}`)
    }
    
    // If validation passed, create the workflow
    return this.crudService.create(definition)
  }
}