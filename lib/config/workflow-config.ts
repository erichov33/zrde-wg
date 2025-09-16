/**
 * Workflow Configuration System
 * Dynamic, configurable rule system for workflow management
 */

import { 
  CREDIT_SCORE_THRESHOLDS, 
  DEBT_TO_INCOME_THRESHOLDS, 
  RISK_SCORE_THRESHOLDS,
  INCOME_THRESHOLDS 
} from './business-rules';

export interface ConfigurableRule {
  id: string;
  name: string;
  description: string;
  field: string;
  operator: '>=' | '<=' | '>' | '<' | '==' | '!=';
  value: number;
  action: string;
  priority: number;
  enabled: boolean;
  category: 'credit' | 'income' | 'debt' | 'risk' | 'general';
}

export interface RuleSet {
  id: string;
  name: string;
  description: string;
  rules: ConfigurableRule[];
  mode: 'all_must_pass' | 'any_must_pass' | 'majority_must_pass';
  enabled: boolean;
}

export interface WorkflowConfiguration {
  id: string;
  name: string;
  version: string;
  description: string;
  ruleSets: RuleSet[];
  nodeConfigurations: Record<string, any>;
  connectionRules: Record<string, string>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tags: string[];
  };
}

export class WorkflowConfigurationManager {
  private static configurations: Map<string, WorkflowConfiguration> = new Map();

  /**
   * Get default rule sets based on business rules
   */
  static getDefaultRuleSets(): RuleSet[] {
    return [
      {
        id: 'credit_score_rules',
        name: 'Credit Score Evaluation',
        description: 'Rules for evaluating credit scores',
        mode: 'any_must_pass',
        enabled: true,
        rules: [
          {
            id: 'credit_excellent',
            name: 'Excellent Credit',
            description: 'Credit score indicates excellent creditworthiness',
            field: 'creditScore',
            operator: '>=',
            value: CREDIT_SCORE_THRESHOLDS.EXCELLENT,
            action: 'approve',
            priority: 1,
            enabled: true,
            category: 'credit',
          },
          {
            id: 'credit_good',
            name: 'Good Credit',
            description: 'Credit score indicates good creditworthiness',
            field: 'creditScore',
            operator: '>=',
            value: CREDIT_SCORE_THRESHOLDS.GOOD,
            action: 'review',
            priority: 2,
            enabled: true,
            category: 'credit',
          },
          {
            id: 'credit_fair',
            name: 'Fair Credit',
            description: 'Credit score requires manual review',
            field: 'creditScore',
            operator: '>=',
            value: CREDIT_SCORE_THRESHOLDS.FAIR,
            action: 'manual_review',
            priority: 3,
            enabled: true,
            category: 'credit',
          },
          {
            id: 'credit_poor',
            name: 'Poor Credit',
            description: 'Credit score indicates high risk',
            field: 'creditScore',
            operator: '<',
            value: CREDIT_SCORE_THRESHOLDS.FAIR,
            action: 'decline',
            priority: 4,
            enabled: true,
            category: 'credit',
          },
        ],
      },
      {
        id: 'income_rules',
        name: 'Income Verification',
        description: 'Rules for evaluating applicant income',
        mode: 'any_must_pass',
        enabled: true,
        rules: [
          {
            id: 'income_high',
            name: 'High Income',
            description: 'Income meets high threshold',
            field: 'income',
            operator: '>=',
            value: INCOME_THRESHOLDS.HIGH_INCOME,
            action: 'approve',
            priority: 1,
            enabled: true,
            category: 'income',
          },
          {
            id: 'income_medium',
            name: 'Medium Income',
            description: 'Income meets medium threshold',
            field: 'income',
            operator: '>=',
            value: INCOME_THRESHOLDS.MEDIUM_INCOME,
            action: 'review',
            priority: 2,
            enabled: true,
            category: 'income',
          },
          {
            id: 'income_low',
            name: 'Low Income',
            description: 'Income requires manual review',
            field: 'income',
            operator: '>=',
            value: INCOME_THRESHOLDS.LOW_INCOME,
            action: 'manual_review',
            priority: 3,
            enabled: true,
            category: 'income',
          },
          {
            id: 'income_insufficient',
            name: 'Insufficient Income',
            description: 'Income below minimum threshold',
            field: 'income',
            operator: '<',
            value: INCOME_THRESHOLDS.MINIMUM_ANNUAL,
            action: 'decline',
            priority: 4,
            enabled: true,
            category: 'income',
          },
        ],
      },
      {
        id: 'debt_to_income_rules',
        name: 'Debt-to-Income Analysis',
        description: 'Rules for evaluating debt-to-income ratio',
        mode: 'any_must_pass',
        enabled: true,
        rules: [
          {
            id: 'dti_excellent',
            name: 'Excellent DTI',
            description: 'Debt-to-income ratio is excellent',
            field: 'debtToIncomeRatio',
            operator: '<=',
            value: DEBT_TO_INCOME_THRESHOLDS.EXCELLENT,
            action: 'approve',
            priority: 1,
            enabled: true,
            category: 'debt',
          },
          {
            id: 'dti_good',
            name: 'Good DTI',
            description: 'Debt-to-income ratio is good',
            field: 'debtToIncomeRatio',
            operator: '<=',
            value: DEBT_TO_INCOME_THRESHOLDS.GOOD,
            action: 'review',
            priority: 2,
            enabled: true,
            category: 'debt',
          },
          {
            id: 'dti_acceptable',
            name: 'Acceptable DTI',
            description: 'Debt-to-income ratio requires review',
            field: 'debtToIncomeRatio',
            operator: '<=',
            value: DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE,
            action: 'manual_review',
            priority: 3,
            enabled: true,
            category: 'debt',
          },
          {
            id: 'dti_high_risk',
            name: 'High Risk DTI',
            description: 'Debt-to-income ratio is too high',
            field: 'debtToIncomeRatio',
            operator: '>',
            value: DEBT_TO_INCOME_THRESHOLDS.HIGH_RISK,
            action: 'decline',
            priority: 4,
            enabled: true,
            category: 'debt',
          },
        ],
      },
      {
        id: 'risk_assessment_rules',
        name: 'Risk Assessment',
        description: 'Rules for overall risk evaluation',
        mode: 'any_must_pass',
        enabled: true,
        rules: [
          {
            id: 'risk_low',
            name: 'Low Risk',
            description: 'Overall risk is low',
            field: 'riskScore',
            operator: '<=',
            value: RISK_SCORE_THRESHOLDS.LOW,
            action: 'approve',
            priority: 1,
            enabled: true,
            category: 'risk',
          },
          {
            id: 'risk_medium',
            name: 'Medium Risk',
            description: 'Overall risk is medium',
            field: 'riskScore',
            operator: '<=',
            value: RISK_SCORE_THRESHOLDS.MEDIUM,
            action: 'review',
            priority: 2,
            enabled: true,
            category: 'risk',
          },
          {
            id: 'risk_high',
            name: 'High Risk',
            description: 'Overall risk is high',
            field: 'riskScore',
            operator: '<=',
            value: RISK_SCORE_THRESHOLDS.HIGH,
            action: 'manual_review',
            priority: 3,
            enabled: true,
            category: 'risk',
          },
          {
            id: 'risk_critical',
            name: 'Critical Risk',
            description: 'Overall risk is critical',
            field: 'riskScore',
            operator: '>',
            value: RISK_SCORE_THRESHOLDS.HIGH,
            action: 'decline',
            priority: 4,
            enabled: true,
            category: 'risk',
          },
        ],
      },
    ];
  }

  /**
   * Get default workflow configurations
   */
  static getDefaultConfigurations(): WorkflowConfiguration[] {
    const defaultRuleSets = this.getDefaultRuleSets();
    
    return [
      {
        id: 'loan_approval_config',
        name: 'Loan Approval Configuration',
        version: '1.0.0',
        description: 'Standard configuration for loan approval workflows',
        ruleSets: defaultRuleSets,
        nodeConfigurations: {
          credit_check: {
            timeout: 30000,
            retryAttempts: 3,
            dataSources: ['credit_bureau'],
          },
          income_verification: {
            timeout: 45000,
            retryAttempts: 2,
            dataSources: ['payroll_system', 'bank_statements'],
          },
          risk_assessment: {
            timeout: 60000,
            algorithm: 'comprehensive',
            factors: ['credit', 'income', 'debt', 'employment', 'banking'],
          },
        },
        connectionRules: {
          'credit_to_risk': `creditScore >= ${CREDIT_SCORE_THRESHOLDS.FAIR}`,
          'income_to_risk': `income >= ${INCOME_THRESHOLDS.MINIMUM_ANNUAL}`,
          'dti_to_risk': `debtToIncomeRatio <= ${DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE}`,
          'risk_to_approve': `riskScore <= ${RISK_SCORE_THRESHOLDS.LOW}`,
          'risk_to_review': `riskScore > ${RISK_SCORE_THRESHOLDS.LOW} && riskScore <= ${RISK_SCORE_THRESHOLDS.MEDIUM}`,
          'risk_to_decline': `riskScore > ${RISK_SCORE_THRESHOLDS.MEDIUM}`,
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          tags: ['loan', 'approval', 'financial', 'default'],
        },
      },
      {
        id: 'simple_approval_config',
        name: 'Simple Approval Configuration',
        version: '1.0.0',
        description: 'Simplified configuration for basic approval workflows',
        ruleSets: [defaultRuleSets[0]], // Only credit score rules
        nodeConfigurations: {
          credit_check: {
            timeout: 15000,
            retryAttempts: 2,
            dataSources: ['credit_bureau'],
          },
        },
        connectionRules: {
          'credit_to_approve': `creditScore >= ${CREDIT_SCORE_THRESHOLDS.FAIR}`,
          'credit_to_decline': `creditScore < ${CREDIT_SCORE_THRESHOLDS.FAIR}`,
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          tags: ['simple', 'approval', 'basic', 'default'],
        },
      },
    ];
  }

  /**
   * Save a workflow configuration
   */
  static saveConfiguration(config: WorkflowConfiguration): void {
    config.metadata.updatedAt = new Date().toISOString();
    this.configurations.set(config.id, config);
  }

  /**
   * Load a workflow configuration
   */
  static loadConfiguration(id: string): WorkflowConfiguration | null {
    return this.configurations.get(id) || null;
  }

  /**
   * Get all available configurations
   */
  static getAllConfigurations(): WorkflowConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Create a new rule
   */
  static createRule(
    field: string,
    operator: ConfigurableRule['operator'],
    value: number,
    action: string,
    options: Partial<ConfigurableRule> = {}
  ): ConfigurableRule {
    return {
      id: options.id || `rule_${Date.now()}`,
      name: options.name || `${field} ${operator} ${value}`,
      description: options.description || `Rule for ${field}`,
      field,
      operator,
      value,
      action,
      priority: options.priority || 1,
      enabled: options.enabled !== false,
      category: options.category || 'general',
    };
  }

  /**
   * Evaluate a rule against data
   */
  static evaluateRule(rule: ConfigurableRule, data: Record<string, any>): boolean {
    if (!rule.enabled) return false;
    
    const fieldValue = data[rule.field];
    if (fieldValue === undefined || fieldValue === null) return false;

    switch (rule.operator) {
      case '>=':
        return fieldValue >= rule.value;
      case '<=':
        return fieldValue <= rule.value;
      case '>':
        return fieldValue > rule.value;
      case '<':
        return fieldValue < rule.value;
      case '==':
        return fieldValue === rule.value;
      case '!=':
        return fieldValue !== rule.value;
      default:
        return false;
    }
  }

  /**
   * Evaluate a rule set against data
   */
  static evaluateRuleSet(ruleSet: RuleSet, data: Record<string, any>): {
    passed: boolean;
    matchedRules: ConfigurableRule[];
    actions: string[];
  } {
    if (!ruleSet.enabled) {
      return { passed: false, matchedRules: [], actions: [] };
    }

    const enabledRules = ruleSet.rules.filter(rule => rule.enabled);
    const matchedRules = enabledRules.filter(rule => this.evaluateRule(rule, data));
    
    let passed = false;
    switch (ruleSet.mode) {
      case 'all_must_pass':
        passed = matchedRules.length === enabledRules.length;
        break;
      case 'any_must_pass':
        passed = matchedRules.length > 0;
        break;
      case 'majority_must_pass':
        passed = matchedRules.length > enabledRules.length / 2;
        break;
    }

    const actions = matchedRules
      .sort((a, b) => a.priority - b.priority)
      .map(rule => rule.action);

    return { passed, matchedRules, actions };
  }

  /**
   * Generate condition string for a rule
   */
  static generateConditionString(rule: ConfigurableRule): string {
    return `${rule.field} ${rule.operator} ${rule.value}`;
  }

  /**
   * Parse condition string into rule components
   */
  static parseConditionString(condition: string): Partial<ConfigurableRule> | null {
    const regex = /(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/;
    const match = condition.match(regex);
    
    if (!match) return null;
    
    return {
      field: match[1],
      operator: match[2] as ConfigurableRule['operator'],
      value: parseFloat(match[3]),
    };
  }

  /**
   * Validate configuration
   */
  static validateConfiguration(config: WorkflowConfiguration): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate basic structure
    if (!config.id) errors.push('Configuration must have an ID');
    if (!config.name) errors.push('Configuration must have a name');
    if (!config.version) errors.push('Configuration must have a version');

    // Validate rule sets
    for (const ruleSet of config.ruleSets) {
      if (!ruleSet.id) errors.push(`Rule set missing ID: ${ruleSet.name}`);
      if (!ruleSet.rules || ruleSet.rules.length === 0) {
        warnings.push(`Rule set has no rules: ${ruleSet.name}`);
      }

      // Validate individual rules
      for (const rule of ruleSet.rules) {
        if (!rule.field) errors.push(`Rule missing field: ${rule.id}`);
        if (!rule.action) errors.push(`Rule missing action: ${rule.id}`);
        if (typeof rule.value !== 'number') errors.push(`Rule value must be a number: ${rule.id}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Initialize with default configurations
   */
  static initialize(): void {
    const defaultConfigs = this.getDefaultConfigurations();
    defaultConfigs.forEach(config => this.saveConfiguration(config));
  }
}

// Initialize with default configurations
WorkflowConfigurationManager.initialize();

// ❌ Remove this duplicate export line:
// export { WorkflowConfigurationManager };