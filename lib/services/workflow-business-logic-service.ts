/**
 * Workflow Business Logic Service
 * Centralizes all business logic for workflow components, removing hardcoded rules from UI
 */

import { DecisionEngine, type ApplicantData, type DecisionResult } from '@/lib/business/decision-engine';
import { 
  CREDIT_SCORE_THRESHOLDS, 
  DEBT_TO_INCOME_THRESHOLDS, 
  RISK_SCORE_THRESHOLDS,
  INCOME_THRESHOLDS,
  DECISION_RULES 
} from '@/lib/config/business-rules';

export interface WorkflowNodeTemplate {
  id: string;
  type: 'start' | 'decision' | 'action' | 'end' | 'data_source' | 'rule_set';
  data: {
    label: string;
    description: string;
    config: any;
  };
  position?: { x: number; y: number };
}

export interface BusinessLogicTemplate {
  id: string;
  name: string;
  description: string;
  businessLogic: string;
  requiredFields: string[];
  category: 'credit' | 'income' | 'risk' | 'general';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNodeTemplate[];
  connections: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

export interface WorkflowRule {
  condition: string;
  action: string;
  priority: number;
  threshold?: number;
  operator?: '>=' | '<=' | '>' | '<' | '==' | '!=';
}

export class WorkflowBusinessLogicService {
  /**
   * Get all available node templates with business logic
   */
  static getNodeTemplates(): Record<string, WorkflowNodeTemplate> {
    return {
      start: {
        id: 'start',
        type: 'start',
        data: {
          label: 'Start Process',
          description: 'Beginning of the workflow',
          config: {},
        },
      },
      credit_check: {
        id: 'credit_check',
        type: 'decision',
        data: {
          label: 'Credit Score Check',
          description: 'Evaluate applicant credit score',
          config: {
            rules: this.getCreditScoreRules(),
          },
        },
      },
      income_verification: {
        id: 'income_verification',
        type: 'action',
        data: {
          label: 'Income Verification',
          description: 'Verify applicant income sources',
          config: {
            dataSources: ['payroll_system', 'bank_statements'],
            timeout: 30000,
            rules: this.getIncomeVerificationRules(),
          },
        },
      },
      debt_to_income_check: {
        id: 'debt_to_income_check',
        type: 'decision',
        data: {
          label: 'Debt-to-Income Check',
          description: 'Evaluate debt-to-income ratio',
          config: {
            rules: this.getDebtToIncomeRules(),
          },
        },
      },
      risk_assessment: {
        id: 'risk_assessment',
        type: 'decision',
        data: {
          label: 'Risk Assessment',
          description: 'Calculate overall risk score',
          config: {
            rules: this.getRiskAssessmentRules(),
          },
        },
      },
      manual_review: {
        id: 'manual_review',
        type: 'action',
        data: {
          label: 'Manual Review',
          description: 'Human review required',
          config: {
            assignTo: 'underwriting_team',
            priority: 'high',
          },
        },
      },
      approve_loan: {
        id: 'approve_loan',
        type: 'end',
        data: {
          label: 'Approve Loan',
          description: 'Loan application approved',
          config: {
            actions: ['send_approval_email', 'create_loan_account'],
          },
        },
      },
      decline_loan: {
        id: 'decline_loan',
        type: 'end',
        data: {
          label: 'Decline Loan',
          description: 'Loan application declined',
          config: {
            actions: ['send_decline_email', 'log_decision'],
          },
        },
      },
      data_source: {
        id: 'data_source',
        type: 'data_source',
        data: {
          label: 'External Data Source',
          description: 'Connect to external data',
          config: {
            endpoint: '',
            authentication: 'api_key',
            timeout: 10000,
          },
        },
      },
      rule_set: {
        id: 'rule_set',
        type: 'rule_set',
        data: {
          label: 'Business Rules',
          description: 'Apply business logic rules',
          config: {
            rules: [],
            mode: 'all_must_pass',
          },
        },
      },
    };
  }

  /**
   * Get business logic templates integrated with decision engine
   */
  static getBusinessLogicTemplates(): BusinessLogicTemplate[] {
    return [
      {
        id: 'credit_evaluation',
        name: 'Credit Score Evaluation',
        description: 'Evaluate applicant credit score using business rules',
        businessLogic: 'DecisionEngine.evaluateCreditScore',
        requiredFields: ['creditScore'],
        category: 'credit',
      },
      {
        id: 'income_verification',
        name: 'Income Verification',
        description: 'Verify and evaluate applicant income',
        businessLogic: 'DecisionEngine.evaluateIncome',
        requiredFields: ['income'],
        category: 'income',
      },
      {
        id: 'debt_to_income',
        name: 'Debt-to-Income Analysis',
        description: 'Analyze debt-to-income ratio',
        businessLogic: 'DecisionEngine.evaluateDebtToIncome',
        requiredFields: ['debtToIncomeRatio'],
        category: 'risk',
      },
      {
        id: 'full_evaluation',
        name: 'Complete Applicant Evaluation',
        description: 'Full evaluation using all business rules',
        businessLogic: 'DecisionEngine.evaluateApplicant',
        requiredFields: ['creditScore', 'income', 'debtToIncomeRatio'],
        category: 'general',
      },
      {
        id: 'risk_calculation',
        name: 'Risk Score Calculation',
        description: 'Calculate comprehensive risk score',
        businessLogic: 'DecisionEngine.calculateRiskLevel',
        requiredFields: ['creditScore', 'income', 'debtToIncomeRatio'],
        category: 'risk',
      },
    ];
  }

  private static withPosition(
    template: WorkflowNodeTemplate | undefined,
    id: string,
    position: { x: number; y: number }
  ): WorkflowNodeTemplate {
    if (!template) {
      throw new Error(`Template not found for id: ${id}`);
    }
    return { ...template, id, position };
  }

  /**
   * Get predefined workflow templates
   */
  static getWorkflowTemplates(): WorkflowTemplate[] {
    const nodeTemplates = this.getNodeTemplates();
    
    return [
      {
        id: 'loan_approval',
        name: 'Loan Approval Process',
        description: 'Complete loan application review workflow',
        category: 'financial',
        nodes: [
          this.withPosition(nodeTemplates.start, 'start_1', { x: 100, y: 200 }),
          this.withPosition(nodeTemplates.credit_check, 'credit_1', { x: 400, y: 150 }),
          this.withPosition(nodeTemplates.income_verification, 'income_1', { x: 400, y: 250 }),
          this.withPosition(nodeTemplates.debt_to_income_check, 'dti_1', { x: 700, y: 150 }),
          this.withPosition(nodeTemplates.risk_assessment, 'risk_1', { x: 700, y: 250 }),
          this.withPosition(nodeTemplates.manual_review, 'review_1', { x: 1000, y: 100 }),
          this.withPosition(nodeTemplates.approve_loan, 'approve_1', { x: 1300, y: 150 }),
          this.withPosition(nodeTemplates.decline_loan, 'decline_1', { x: 1300, y: 250 }),
        ],
        connections: this.getLoanApprovalConnections(),
      },
      {
        id: 'simple_approval',
        name: 'Simple Approval',
        description: 'Basic approval workflow',
        category: 'general',
        nodes: [
          this.withPosition(nodeTemplates.start, 'start_1', { x: 100, y: 200 }),
          this.withPosition(nodeTemplates.credit_check, 'check_1', { x: 400, y: 200 }),
          this.withPosition(nodeTemplates.approve_loan, 'approve_1', { x: 700, y: 150 }),
          this.withPosition(nodeTemplates.decline_loan, 'decline_1', { x: 700, y: 250 }),
        ],
        connections: this.getSimpleApprovalConnections(),
      },
      {
        id: 'comprehensive_review',
        name: 'Comprehensive Review Process',
        description: 'Full review with all business rules and data sources',
        category: 'financial',
        nodes: [
          this.withPosition(nodeTemplates.start, 'start_1', { x: 100, y: 200 }),
          this.withPosition(nodeTemplates.data_source, 'data_1', { x: 300, y: 100 }),
          this.withPosition(nodeTemplates.credit_check, 'credit_1', { x: 500, y: 150 }),
          this.withPosition(nodeTemplates.income_verification, 'income_1', { x: 500, y: 200 }),
          this.withPosition(nodeTemplates.debt_to_income_check, 'dti_1', { x: 500, y: 250 }),
          this.withPosition(nodeTemplates.risk_assessment, 'risk_1', { x: 800, y: 200 }),
          this.withPosition(nodeTemplates.rule_set, 'rules_1', { x: 1000, y: 150 }),
          this.withPosition(nodeTemplates.manual_review, 'review_1', { x: 1200, y: 100 }),
          this.withPosition(nodeTemplates.approve_loan, 'approve_1', { x: 1400, y: 150 }),
          this.withPosition(nodeTemplates.decline_loan, 'decline_1', { x: 1400, y: 250 }),
        ],
        connections: this.getComprehensiveReviewConnections(),
      },
    ];
  }

  /**
   * Get credit score evaluation rules based on business configuration
   */
  private static getCreditScoreRules(): WorkflowRule[] {
    return [
      {
        condition: `creditScore >= ${CREDIT_SCORE_THRESHOLDS.EXCELLENT}`,
        action: 'approve',
        priority: 1,
        threshold: CREDIT_SCORE_THRESHOLDS.EXCELLENT,
        operator: '>=',
      },
      {
        condition: `creditScore >= ${CREDIT_SCORE_THRESHOLDS.GOOD}`,
        action: 'review',
        priority: 2,
        threshold: CREDIT_SCORE_THRESHOLDS.GOOD,
        operator: '>=',
      },
      {
        condition: `creditScore >= ${CREDIT_SCORE_THRESHOLDS.FAIR}`,
        action: 'manual_review',
        priority: 3,
        threshold: CREDIT_SCORE_THRESHOLDS.FAIR,
        operator: '>=',
      },
      {
        condition: `creditScore < ${CREDIT_SCORE_THRESHOLDS.FAIR}`,
        action: 'decline',
        priority: 4,
        threshold: CREDIT_SCORE_THRESHOLDS.FAIR,
        operator: '<',
      },
    ];
  }

  /**
   * Get income verification rules
   */
  private static getIncomeVerificationRules(): WorkflowRule[] {
    return [
      {
        condition: `income >= ${INCOME_THRESHOLDS.HIGH_INCOME}`,
        action: 'approve',
        priority: 1,
        threshold: INCOME_THRESHOLDS.HIGH_INCOME,
        operator: '>=',
      },
      {
        condition: `income >= ${INCOME_THRESHOLDS.MEDIUM_INCOME}`,
        action: 'review',
        priority: 2,
        threshold: INCOME_THRESHOLDS.MEDIUM_INCOME,
        operator: '>=',
      },
      {
        condition: `income >= ${INCOME_THRESHOLDS.LOW_INCOME}`,
        action: 'manual_review',
        priority: 3,
        threshold: INCOME_THRESHOLDS.LOW_INCOME,
        operator: '>=',
      },
      {
        condition: `income < ${INCOME_THRESHOLDS.MINIMUM_ANNUAL}`,
        action: 'decline',
        priority: 4,
        threshold: INCOME_THRESHOLDS.MINIMUM_ANNUAL,
        operator: '<',
      },
    ];
  }

  /**
   * Get debt-to-income ratio rules
   */
  private static getDebtToIncomeRules(): WorkflowRule[] {
    return [
      {
        condition: `debtToIncomeRatio <= ${DEBT_TO_INCOME_THRESHOLDS.EXCELLENT}`,
        action: 'approve',
        priority: 1,
        threshold: DEBT_TO_INCOME_THRESHOLDS.EXCELLENT,
        operator: '<=',
      },
      {
        condition: `debtToIncomeRatio <= ${DEBT_TO_INCOME_THRESHOLDS.GOOD}`,
        action: 'review',
        priority: 2,
        threshold: DEBT_TO_INCOME_THRESHOLDS.GOOD,
        operator: '<=',
      },
      {
        condition: `debtToIncomeRatio <= ${DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE}`,
        action: 'manual_review',
        priority: 3,
        threshold: DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE,
        operator: '<=',
      },
      {
        condition: `debtToIncomeRatio > ${DEBT_TO_INCOME_THRESHOLDS.HIGH_RISK}`,
        action: 'decline',
        priority: 4,
        threshold: DEBT_TO_INCOME_THRESHOLDS.HIGH_RISK,
        operator: '>',
      },
    ];
  }

  /**
   * Get risk assessment rules
   */
  private static getRiskAssessmentRules(): WorkflowRule[] {
    return [
      {
        condition: `riskScore <= ${RISK_SCORE_THRESHOLDS.LOW}`,
        action: 'low_risk',
        priority: 1,
        threshold: RISK_SCORE_THRESHOLDS.LOW,
        operator: '<=',
      },
      {
        condition: `riskScore <= ${RISK_SCORE_THRESHOLDS.MEDIUM}`,
        action: 'medium_risk',
        priority: 2,
        threshold: RISK_SCORE_THRESHOLDS.MEDIUM,
        operator: '<=',
      },
      {
        condition: `riskScore <= ${RISK_SCORE_THRESHOLDS.HIGH}`,
        action: 'high_risk',
        priority: 3,
        threshold: RISK_SCORE_THRESHOLDS.HIGH,
        operator: '<=',
      },
      {
        condition: `riskScore > ${RISK_SCORE_THRESHOLDS.HIGH}`,
        action: 'critical_risk',
        priority: 4,
        threshold: RISK_SCORE_THRESHOLDS.HIGH,
        operator: '>',
      },
    ];
  }

  /**
   * Get loan approval workflow connections
   */
  private static getLoanApprovalConnections() {
    return [
      { id: 'conn_1', source: 'start_1', target: 'credit_1', label: 'begin' },
      { id: 'conn_2', source: 'start_1', target: 'income_1', label: 'parallel' },
      { id: 'conn_3', source: 'credit_1', target: 'dti_1', label: 'passed', condition: `creditScore >= ${CREDIT_SCORE_THRESHOLDS.FAIR}` },
      { id: 'conn_4', source: 'income_1', target: 'risk_1', label: 'verified' },
      { id: 'conn_5', source: 'dti_1', target: 'risk_1', label: 'acceptable', condition: `debtToIncomeRatio <= ${DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE}` },
      { id: 'conn_6', source: 'risk_1', target: 'review_1', label: 'medium_risk', condition: `riskScore > ${RISK_SCORE_THRESHOLDS.LOW} && riskScore <= ${RISK_SCORE_THRESHOLDS.MEDIUM}` },
      { id: 'conn_7', source: 'risk_1', target: 'approve_1', label: 'low_risk', condition: `riskScore <= ${RISK_SCORE_THRESHOLDS.LOW}` },
      { id: 'conn_8', source: 'risk_1', target: 'decline_1', label: 'high_risk', condition: `riskScore > ${RISK_SCORE_THRESHOLDS.MEDIUM}` },
      { id: 'conn_9', source: 'review_1', target: 'approve_1', label: 'approved' },
      { id: 'conn_10', source: 'review_1', target: 'decline_1', label: 'declined' },
      { id: 'conn_11', source: 'credit_1', target: 'decline_1', label: 'failed', condition: `creditScore < ${CREDIT_SCORE_THRESHOLDS.FAIR}` },
      { id: 'conn_12', source: 'dti_1', target: 'decline_1', label: 'high_dti', condition: `debtToIncomeRatio > ${DEBT_TO_INCOME_THRESHOLDS.HIGH_RISK}` },
    ];
  }

  /**
   * Get simple approval workflow connections
   */
  private static getSimpleApprovalConnections() {
    return [
      { id: 'conn_1', source: 'start_1', target: 'check_1', label: 'begin' },
      { id: 'conn_2', source: 'check_1', target: 'approve_1', label: 'approved', condition: `creditScore >= ${CREDIT_SCORE_THRESHOLDS.FAIR}` },
      { id: 'conn_3', source: 'check_1', target: 'decline_1', label: 'declined', condition: `creditScore < ${CREDIT_SCORE_THRESHOLDS.FAIR}` },
    ];
  }

  /**
   * Get comprehensive review workflow connections
   */
  private static getComprehensiveReviewConnections() {
    return [
      { id: 'conn_1', source: 'start_1', target: 'data_1', label: 'fetch_data' },
      { id: 'conn_2', source: 'data_1', target: 'credit_1', label: 'credit_data' },
      { id: 'conn_3', source: 'data_1', target: 'income_1', label: 'income_data' },
      { id: 'conn_4', source: 'data_1', target: 'dti_1', label: 'debt_data' },
      { id: 'conn_5', source: 'credit_1', target: 'risk_1', label: 'credit_passed', condition: `creditScore >= ${CREDIT_SCORE_THRESHOLDS.FAIR}` },
      { id: 'conn_6', source: 'income_1', target: 'risk_1', label: 'income_verified', condition: `income >= ${INCOME_THRESHOLDS.MINIMUM_ANNUAL}` },
      { id: 'conn_7', source: 'dti_1', target: 'risk_1', label: 'dti_acceptable', condition: `debtToIncomeRatio <= ${DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE}` },
      { id: 'conn_8', source: 'risk_1', target: 'rules_1', label: 'risk_calculated' },
      { id: 'conn_9', source: 'rules_1', target: 'review_1', label: 'needs_review', condition: `riskScore > ${RISK_SCORE_THRESHOLDS.LOW}` },
      { id: 'conn_10', source: 'rules_1', target: 'approve_1', label: 'auto_approve', condition: `riskScore <= ${RISK_SCORE_THRESHOLDS.LOW}` },
      { id: 'conn_11', source: 'review_1', target: 'approve_1', label: 'manual_approve' },
      { id: 'conn_12', source: 'review_1', target: 'decline_1', label: 'manual_decline' },
      { id: 'conn_13', source: 'credit_1', target: 'decline_1', label: 'credit_failed', condition: `creditScore < ${CREDIT_SCORE_THRESHOLDS.FAIR}` },
      { id: 'conn_14', source: 'income_1', target: 'decline_1', label: 'income_insufficient', condition: `income < ${INCOME_THRESHOLDS.MINIMUM_ANNUAL}` },
      { id: 'conn_15', source: 'dti_1', target: 'decline_1', label: 'dti_too_high', condition: `debtToIncomeRatio > ${DEBT_TO_INCOME_THRESHOLDS.HIGH_RISK}` },
    ];
  }

  /**
   * Execute business logic for a given template
   */
  static async executeBusinessLogic(
    templateId: string, 
    data: ApplicantData
  ): Promise<DecisionResult> {
    const template = this.getBusinessLogicTemplates().find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Business logic template not found: ${templateId}`);
    }

    // Validate required fields
    for (const field of template.requiredFields) {
      if (!(field in data) || data[field as keyof ApplicantData] === undefined) {
        throw new Error(`Required field missing: ${field}`);
      }
    }

    // Execute the appropriate business logic
    switch (templateId) {
      case 'credit_evaluation':
        return {
          decision: 'manual_review',
          confidence: 0.8,
          reasons: [`Credit score: ${data.creditScore}`],
          riskLevel: data.creditScore >= CREDIT_SCORE_THRESHOLDS.GOOD ? 'low' : 'medium'
        };
      
      case 'income_verification':
        return {
          decision: 'manual_review',
          confidence: 0.7,
          reasons: [`Income: $${data.income}`],
          riskLevel: data.income >= INCOME_THRESHOLDS.MEDIUM_INCOME ? 'low' : 'medium'
        };
      
      case 'debt_to_income':
        return {
          decision: 'manual_review',
          confidence: 0.75,
          reasons: [`Debt-to-income ratio: ${(data.debtToIncomeRatio * 100).toFixed(1)}%`],
          riskLevel: data.debtToIncomeRatio <= DEBT_TO_INCOME_THRESHOLDS.GOOD ? 'low' : 'medium'
        };
      
      case 'full_evaluation':
        return DecisionEngine.evaluateApplicant(data);
      
      case 'risk_calculation':
        return DecisionEngine.evaluateApplicant(data);
      
      default:
        throw new Error(`Unknown business logic template: ${templateId}`);
    }
  }

  /**
   * Get rule configuration for a specific node type
   */
  static getRuleConfiguration(nodeType: string): WorkflowRule[] {
    switch (nodeType) {
      case 'credit_check':
        return this.getCreditScoreRules();
      case 'income_verification':
        return this.getIncomeVerificationRules();
      case 'debt_to_income_check':
        return this.getDebtToIncomeRules();
      case 'risk_assessment':
        return this.getRiskAssessmentRules();
      default:
        return [];
    }
  }

  /**
   * Validate workflow configuration
   */
  static validateWorkflow(nodes: any[], connections: any[]): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!Array.isArray(nodes)) {
      errors.push('Nodes must be an array');
      return { isValid: false, errors, warnings };
    }

    if (!Array.isArray(connections)) {
      errors.push('Connections must be an array');
      return { isValid: false, errors, warnings };
    }

    if (nodes.length === 0) {
      errors.push('Workflow must contain at least one node');
      return { isValid: false, errors, warnings };
    }

    // Check for start node
    const startNodes = nodes.filter(node => node?.type === 'start');
    if (startNodes.length === 0) {
      errors.push('Workflow must have exactly one start node');
    } else if (startNodes.length > 1) {
      errors.push('Workflow can only have one start node');
    }

    // Check for end nodes
    const endNodes = nodes.filter(node => node?.type === 'end');
    if (endNodes.length === 0) {
      warnings.push('Workflow should have at least one end node');
    }

    // Validate node structure
    nodes.forEach((node, index) => {
      if (!node?.id) {
        errors.push(`Node at index ${index} is missing an ID`);
      }
      if (!node?.type) {
        errors.push(`Node ${node?.id || `at index ${index}`} is missing a type`);
      }
      if (!node?.data?.label) {
        warnings.push(`Node ${node?.id || `at index ${index}`} is missing a label`);
      }
    });

    // Check for duplicate node IDs
    const nodeIds = nodes.map(node => node?.id).filter(Boolean);
    const duplicateIds = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate node IDs found: ${duplicateIds.join(', ')}`);
    }

    // Validate connections
    const nodeIdSet = new Set(nodeIds);
    connections.forEach((conn, index) => {
      if (!conn?.source) {
        errors.push(`Connection at index ${index} is missing source`);
      } else if (!nodeIdSet.has(conn.source)) {
        errors.push(`Connection source node '${conn.source}' does not exist`);
      }
      
      if (!conn?.target) {
        errors.push(`Connection at index ${index} is missing target`);
      } else if (!nodeIdSet.has(conn.target)) {
        errors.push(`Connection target node '${conn.target}' does not exist`);
      }
    });

    // Check for orphaned nodes (excluding start nodes)
    const connectedNodeIds = new Set([
      ...connections.map(conn => conn?.source).filter(Boolean),
      ...connections.map(conn => conn?.target).filter(Boolean)
    ]);
    
    const orphanedNodes = nodes.filter(node => 
      node?.type !== 'start' && node?.id && !connectedNodeIds.has(node.id)
    );
    
    if (orphanedNodes.length > 0) {
      warnings.push(`Orphaned nodes found: ${orphanedNodes.map(n => n.data?.label || n.id).join(', ')}`);
    }

    // Check for unreachable nodes (nodes that can't be reached from start)
    if (startNodes.length === 1) {
      const reachableNodes = this.findReachableNodes(startNodes[0].id, connections);
      const unreachableNodes = nodes.filter(node => 
        node?.id && node.id !== startNodes[0].id && !reachableNodes.has(node.id)
      );
      
      if (unreachableNodes.length > 0) {
        warnings.push(`Unreachable nodes found: ${unreachableNodes.map(n => n.data?.label || n.id).join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static findReachableNodes(startNodeId: string, connections: any[]): Set<string> {
    const reachable = new Set<string>();
    const queue = [startNodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (reachable.has(currentId)) continue;
      
      reachable.add(currentId);
      
      // Find all nodes connected from current node
      const outgoingConnections = connections.filter(conn => conn?.source === currentId);
      outgoingConnections.forEach(conn => {
        if (conn?.target && !reachable.has(conn.target)) {
          queue.push(conn.target);
        }
      });
    }
    
    return reachable;
  }
}