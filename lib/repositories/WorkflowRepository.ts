import { WorkflowDefinition, WorkflowTemplate } from '@/lib/types/workflow'

export interface WorkflowFilters {
  status?: string
  category?: string
  tags?: string[]
  limit?: number
  offset?: number
}

export interface WorkflowRepository {
  // CRUD Operations
  create(workflow: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition>
  findById(id: string): Promise<WorkflowDefinition | null>
  findMany(filters?: WorkflowFilters): Promise<{ workflows: WorkflowDefinition[]; total: number }>
  update(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition>
  delete(id: string): Promise<void>

  // Template Operations
  getTemplates(): Promise<WorkflowTemplate[]>
  getTemplate(id: string): Promise<WorkflowTemplate | null>
  createTemplate(template: Omit<WorkflowTemplate, 'id'>): Promise<WorkflowTemplate>
}

// In-memory implementation for development
export class InMemoryWorkflowRepository implements WorkflowRepository {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private templates: Map<string, WorkflowTemplate> = new Map()
  private nextId = 1

  constructor() {
    this.initializeDefaultTemplates()
  }

  async create(workflow: Omit<WorkflowDefinition, 'id'>): Promise<WorkflowDefinition> {
    const id = `workflow_${this.nextId++}`
    const now = new Date()
    
    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      id,
      metadata: {
        ...workflow.metadata,
        createdAt: now,
        updatedAt: now,
        createdBy: workflow.metadata?.createdBy || 'system',
        updatedBy: workflow.metadata?.updatedBy || 'system',
        tags: workflow.metadata?.tags || [],
        category: workflow.metadata?.category || 'general',
        priority: workflow.metadata?.priority || 'medium',
        estimatedExecutionTime: workflow.metadata?.estimatedExecutionTime || 0,
        dependencies: workflow.metadata?.dependencies || []
      }
    }

    this.workflows.set(id, newWorkflow)
    return newWorkflow
  }

  async findById(id: string): Promise<WorkflowDefinition | null> {
    return this.workflows.get(id) || null
  }

  async findMany(filters?: WorkflowFilters): Promise<{ workflows: WorkflowDefinition[]; total: number }> {
    let workflows = Array.from(this.workflows.values())

    // Apply filters
    if (filters?.status) {
      workflows = workflows.filter(w => w.status === filters.status)
    }

    if (filters?.category) {
      workflows = workflows.filter(w => w.metadata?.category === filters.category)
    }

    if (filters?.tags && filters.tags.length > 0) {
      workflows = workflows.filter(w => 
        w.metadata?.tags && filters.tags!.some(tag => w.metadata.tags.includes(tag))
      )
    }

    const total = workflows.length

    // Apply pagination
    if (filters?.offset) {
      workflows = workflows.slice(filters.offset)
    }

    if (filters?.limit) {
      workflows = workflows.slice(0, filters.limit)
    }

    return { workflows, total }
  }

  async update(id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const existing = this.workflows.get(id)
    if (!existing) {
      throw new Error(`Workflow with id ${id} not found`)
    }

    const updated: WorkflowDefinition = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
        updatedBy: updates.metadata?.updatedBy || existing.metadata?.updatedBy || 'system'
      }
    }

    this.workflows.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    if (!this.workflows.has(id)) {
      throw new Error(`Workflow with id ${id} not found`)
    }

    this.workflows.delete(id)
  }

  async getTemplates(): Promise<WorkflowTemplate[]> {
    return Array.from(this.templates.values())
  }

  async getTemplate(id: string): Promise<WorkflowTemplate | null> {
    return this.templates.get(id) || null
  }

  async createTemplate(template: Omit<WorkflowTemplate, 'id'>): Promise<WorkflowTemplate> {
    const id = `template_${this.nextId++}`
    const newTemplate: WorkflowTemplate = {
      ...template,
      id
    }

    this.templates.set(id, newTemplate)
    return newTemplate
  }

  private initializeDefaultTemplates(): void {
    const basicTemplate: WorkflowTemplate = {
      id: 'basic_workflow',
      name: 'Basic Workflow',
      description: 'A simple workflow with start, action, and end nodes',
      category: 'general',
      tags: ['basic', 'starter'],
      nodes: [
        {
          id: 'start_1',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Start' }
        },
        {
          id: 'action_1',
          type: 'action',
          position: { x: 300, y: 100 },
          data: { 
            label: 'Process Data',
            businessLogic: { 
              functionName: 'processData', 
              parameters: {}, 
              returnType: 'object', 
              description: 'Process incoming data' 
            }
          }
        },
        {
          id: 'end_1',
          type: 'end',
          position: { x: 500, y: 100 },
          data: { label: 'End' }
        }
      ],
      connections: [
        {
          id: 'conn_1',
          source: 'start_1',
          target: 'action_1',
          label: ''
        },
        {
          id: 'conn_2',
          source: 'action_1',
          target: 'end_1',
          label: ''
        }
      ],
      metadata: {
          author: 'System',
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0
        }
    }

    const conditionalTemplate: WorkflowTemplate = {
      id: 'conditional_workflow',
      name: 'Conditional Workflow',
      description: 'A workflow with conditional branching',
      category: 'logic',
      tags: ['conditional', 'branching'],
      nodes: [
        {
          id: 'start_1',
          type: 'start',
          position: { x: 100, y: 200 },
          data: { label: 'Start' }
        },
        {
          id: 'condition_1',
          type: 'condition',
          position: { x: 300, y: 200 },
          data: { 
            label: 'Check Condition',
            conditions: [
              { 
                id: 'condition_check_1',
                expression: 'status === "active"',
                description: 'Check if status is active',
                variables: [
                  {
                    name: 'status',
                    dataType: 'string',
                    required: true
                  }
                ]
              }
            ]
          }
        },
        {
          id: 'action_1',
          type: 'action',
          position: { x: 500, y: 100 },
          data: { 
            label: 'Process Active',
            businessLogic: { 
              functionName: 'processActiveStatus',
              parameters: { status: 'active' },
              returnType: 'boolean',
              description: 'Process items with active status'
            }
          }
        },
        {
          id: 'action_2',
          type: 'action',
          position: { x: 500, y: 300 },
          data: { 
            label: 'Process Inactive',
            businessLogic: { 
              functionName: 'processInactiveStatus',
              parameters: { status: 'inactive' },
              returnType: 'boolean',
              description: 'Process items with inactive status'
            }
          }
        },
        {
          id: 'end_1',
          type: 'end',
          position: { x: 700, y: 200 },
          data: { label: 'End' }
        }
      ],
      connections: [
        {
          id: 'conn_1',
          source: 'start_1',
          target: 'condition_1',
          label: ''
        },
        {
          id: 'conn_2',
          source: 'condition_1',
          target: 'action_1',
          label: 'true'
        },
        {
          id: 'conn_3',
          source: 'condition_1',
          target: 'action_2',
          label: 'false'
        },
        {
          id: 'conn_4',
          source: 'action_1',
          target: 'end_1',
          label: ''
        },
        {
          id: 'conn_5',
          source: 'action_2',
          target: 'end_1',
          label: ''
        }
      ],
      metadata: {
        author: 'System',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      }
    }

    this.templates.set(basicTemplate.id, basicTemplate)
    this.templates.set(conditionalTemplate.id, conditionalTemplate)
  }
}