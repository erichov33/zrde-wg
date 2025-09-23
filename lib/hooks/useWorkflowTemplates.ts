import { useMemo } from 'react'
import { WorkflowNodeType, CreateNodeData } from '@/lib/types/workflow'

export interface NodeTemplate {
  id: string
  type: WorkflowNodeType
  label: string
  description: string
  icon: string
  category: NodeCategory
  defaultData: Omit<CreateNodeData, 'position'>
  configurable: boolean
  requiredFields: string[]
}

export type NodeCategory = 
  | 'flow_control'
  | 'data_processing'
  | 'business_logic'
  | 'integration'
  | 'validation'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: CreateNodeData[]
  connections: Array<{
    source: string
    target: string
    label?: string
  }>
  tags: string[]
}

export function useWorkflowTemplates() {
  const nodeTemplates = useMemo((): NodeTemplate[] => [
    {
      id: 'start',
      type: 'start',
      label: 'Start',
      description: 'Entry point for the workflow',
      icon: '▶️',
      category: 'flow_control',
      defaultData: {
        type: 'start',
        data: {
          label: 'Start',
          description: 'Workflow entry point'
        }
      },
      configurable: false,
      requiredFields: []
    },
    {
      id: 'condition',
      type: 'condition',
      label: 'Condition',
      description: 'Conditional branching based on data evaluation',
      icon: '🔀',
      category: 'flow_control',
      defaultData: {
        type: 'condition',
        data: {
          label: 'Condition',
          description: 'Evaluate condition and branch',
          conditions: [{
            id: 'default',
            expression: '',
            description: 'Default condition',
            variables: []
          }]
        }
      },
      configurable: true,
      requiredFields: ['conditions']
    },
    {
      id: 'action',
      type: 'action',
      label: 'Action',
      description: 'Execute an action or transformation',
      icon: '⚡',
      category: 'business_logic',
      defaultData: {
        type: 'action',
        data: {
          label: 'Action',
          description: 'Execute business logic',
          businessLogic: {
            functionName: '',
            parameters: {},
            returnType: 'object',
            description: ''
          }
        }
      },
      configurable: true,
      requiredFields: ['businessLogic']
    },
    {
      id: 'data_source',
      type: 'data_source',
      label: 'Data Source',
      description: 'Fetch data from external sources',
      icon: '🔌',
      category: 'integration',
      defaultData: {
        type: 'data_source',
        data: {
          label: 'Data Source',
          description: 'Fetch external data',
          dataSource: {
            id: '',
            name: '',
            type: 'custom_api',
            endpoint: '',
            timeout: 5000,
            fieldMapping: []
          }
        }
      },
      configurable: true,
      requiredFields: ['dataSource']
    },
    {
      id: 'rule_set',
      type: 'rule_set',
      label: 'Rule Set',
      description: 'Apply business rules and validations',
      icon: '📋',
      category: 'business_logic',
      defaultData: {
        type: 'rule_set',
        data: {
          label: 'Rule Set',
          description: 'Apply business rules',
          rules: []
        }
      },
      configurable: true,
      requiredFields: ['rules']
    },
    {
      id: 'decision',
      type: 'decision',
      label: 'Decision',
      description: 'Make final decision based on workflow results',
      icon: '⚖️',
      category: 'business_logic',
      defaultData: {
        type: 'decision',
        data: {
          label: 'Decision',
          description: 'Final decision point',
          businessLogic: {
            functionName: 'makeDecision',
            parameters: {},
            returnType: 'object',
            description: 'Make final decision'
          }
        }
      },
      configurable: true,
      requiredFields: ['businessLogic']
    },
    {
      id: 'validation',
      type: 'validation',
      label: 'Validation',
      description: 'Validate data against defined rules',
      icon: '✅',
      category: 'validation',
      defaultData: {
        type: 'validation',
        data: {
          label: 'Validation',
          description: 'Validate input data',
          validation: {
            rules: [],
            onFailure: 'stop_execution'
          }
        }
      },
      configurable: true,
      requiredFields: ['validation']
    },
    {
      id: 'end',
      type: 'end',
      label: 'End',
      description: 'Workflow completion point',
      icon: '🏁',
      category: 'flow_control',
      defaultData: {
        type: 'end',
        data: {
          label: 'End',
          description: 'Workflow completion'
        }
      },
      configurable: false,
      requiredFields: []
    }
  ], [])

  const workflowTemplates = useMemo((): WorkflowTemplate[] => [
    {
      id: 'simple_approval',
      name: 'Simple Approval',
      description: 'Basic approval workflow with single condition',
      category: 'Credit Decision',
      nodes: [
        {
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Start', description: 'Begin application review' }
        },
        {
          type: 'data_source',
          position: { x: 300, y: 100 },
          data: { 
            label: 'Credit Check',
            description: 'Fetch credit score',
            dataSource: {
              id: 'credit_bureau',
              name: 'Credit Bureau API',
              type: 'credit_bureau',
              endpoint: '/api/credit-score',
              timeout: 5000,
              fieldMapping: [
                { sourceField: 'ssn', targetField: 'social_security_number' },
                { sourceField: 'score', targetField: 'credit_score' }
              ]
            }
          }
        },
        {
          type: 'condition',
          position: { x: 500, y: 100 },
          data: {
            label: 'Credit Score Check',
            description: 'Check if credit score meets minimum',
            conditions: [{
              id: 'credit_check',
              expression: 'credit_score >= 650',
              description: 'Minimum credit score requirement',
              variables: [
                { name: 'credit_score', dataType: 'number', required: true }
              ]
            }]
          }
        },
        {
          type: 'end',
          position: { x: 700, y: 50 },
          data: { label: 'Approved', description: 'Application approved' }
        },
        {
          type: 'end',
          position: { x: 700, y: 150 },
          data: { label: 'Declined', description: 'Application declined' }
        }
      ],
      connections: [
        { source: 'start', target: 'data_source' },
        { source: 'data_source', target: 'condition' },
        { source: 'condition', target: 'approved_end', label: 'Approved' },
        { source: 'condition', target: 'declined_end', label: 'Declined' }
      ],
      tags: ['simple', 'credit', 'approval']
    },
    {
      id: 'comprehensive_underwriting',
      name: 'Comprehensive Underwriting',
      description: 'Full underwriting process with multiple data sources and rules',
      category: 'Credit Decision',
      nodes: [
        {
          type: 'start',
          position: { x: 100, y: 200 },
          data: { label: 'Start', description: 'Begin comprehensive underwriting' }
        },
        {
          type: 'data_source',
          position: { x: 250, y: 100 },
          data: { 
            label: 'Credit Bureau',
            description: 'Fetch credit report and score',
            dataSource: {
              id: 'credit_bureau',
              name: 'Credit Bureau API',
              type: 'credit_bureau',
              endpoint: '/api/credit-report',
              timeout: 10000,
              fieldMapping: []
            }
          }
        },
        {
          type: 'data_source',
          position: { x: 250, y: 200 },
          data: { 
            label: 'Income Verification',
            description: 'Verify income and employment',
            dataSource: {
              id: 'income_verification',
              name: 'Income Verification Service',
              type: 'income_verification',
              endpoint: '/api/income-verify',
              timeout: 15000,
              fieldMapping: []
            }
          }
        },
        {
          type: 'data_source',
          position: { x: 250, y: 300 },
          data: { 
            label: 'Fraud Check',
            description: 'Check for fraud indicators',
            dataSource: {
              id: 'fraud_detection',
              name: 'Fraud Detection Service',
              type: 'fraud_detection',
              endpoint: '/api/fraud-check',
              timeout: 8000,
              fieldMapping: []
            }
          }
        },
        {
          type: 'rule_set',
          position: { x: 450, y: 200 },
          data: {
            label: 'Underwriting Rules',
            description: 'Apply comprehensive underwriting rules',
            rules: []
          }
        },
        {
          type: 'decision',
          position: { x: 650, y: 200 },
          data: {
            label: 'Final Decision',
            description: 'Make final underwriting decision',
            businessLogic: {
              functionName: 'makeUnderwritingDecision',
              parameters: {},
              returnType: 'object',
              description: 'Comprehensive decision logic'
            }
          }
        },
        {
          type: 'end',
          position: { x: 850, y: 200 },
          data: { label: 'Complete', description: 'Underwriting complete' }
        }
      ],
      connections: [
        { source: 'start', target: 'credit_bureau' },
        { source: 'start', target: 'income_verification' },
        { source: 'start', target: 'fraud_check' },
        { source: 'credit_bureau', target: 'rule_set' },
        { source: 'income_verification', target: 'rule_set' },
        { source: 'fraud_check', target: 'rule_set' },
        { source: 'rule_set', target: 'decision' },
        { source: 'decision', target: 'end' }
      ],
      tags: ['comprehensive', 'underwriting', 'multi-source']
    }
  ], [])

  const getTemplatesByCategory = useMemo(() => {
    return (category: NodeCategory) => 
      nodeTemplates.filter(template => template.category === category)
  }, [nodeTemplates])

  const getTemplateById = useMemo(() => {
    return (id: string) => 
      nodeTemplates.find(template => template.id === id)
  }, [nodeTemplates])

  const getWorkflowTemplateById = useMemo(() => {
    return (id: string) => 
      workflowTemplates.find(template => template.id === id)
  }, [workflowTemplates])

  const createNodeFromTemplate = useMemo(() => {
    return (templateId: string, position: { x: number; y: number }): CreateNodeData | null => {
      const template = getTemplateById(templateId)
      if (!template) return null

      return {
        ...template.defaultData,
        position
      }
    }
  }, [getTemplateById])

  return {
    nodeTemplates,
    workflowTemplates,
    getTemplatesByCategory,
    getTemplateById,
    getWorkflowTemplateById,
    createNodeFromTemplate
  }
}