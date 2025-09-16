/**
 * Decision Engine - Core business logic for loan decisions
 * Separated from UI components for better testability and maintainability
 */

import {
  CREDIT_SCORE_THRESHOLDS,
  DEBT_TO_INCOME_THRESHOLDS,
  INCOME_THRESHOLDS,
  DECISION_RULES,
  RISK_SCORE_THRESHOLDS
} from '@/lib/config/business-rules';

export interface ApplicantData {
  creditScore: number;
  income: number;
  debtToIncomeRatio: number;
  riskScore?: number;
  employmentHistory?: number; // months
  bankingHistory?: number; // months
}

export interface DecisionResult {
  decision: 'approved' | 'declined' | 'manual_review';
  confidence: number;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions?: string[];
}

export class DecisionEngine {
  /**
   * Main decision method that evaluates an applicant
   */
  static evaluateApplicant(data: ApplicantData): DecisionResult {
    const reasons: string[] = [];
    const recommendedActions: string[] = [];
    
    // Validate input data
    this.validateApplicantData(data);
    
    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(data);
    
    // Evaluate credit score
    const creditScoreEvaluation = this.evaluateCreditScore(data.creditScore);
    reasons.push(...creditScoreEvaluation.reasons);
    
    // Evaluate debt-to-income ratio
    const dtiEvaluation = this.evaluateDebtToIncome(data.debtToIncomeRatio);
    reasons.push(...dtiEvaluation.reasons);
    
    // Evaluate income
    const incomeEvaluation = this.evaluateIncome(data.income);
    reasons.push(...incomeEvaluation.reasons);
    
    // Make final decision
    const decision = this.makeDecision(data, riskLevel);
    const confidence = this.calculateConfidence(data, decision);
    
    // Add recommended actions based on decision
    if (decision === 'manual_review') {
      recommendedActions.push(...this.getManualReviewActions(data));
    } else if (decision === 'declined') {
      recommendedActions.push(...this.getDeclineActions(data));
    }
    
    return {
      decision,
      confidence,
      reasons,
      riskLevel,
      recommendedActions: recommendedActions.length > 0 ? recommendedActions : undefined
    };
  }
  
  /**
   * Validates applicant data for completeness and ranges
   */
  private static validateApplicantData(data: ApplicantData): void {
    if (data.creditScore < CREDIT_SCORE_THRESHOLDS.MINIMUM || 
        data.creditScore > CREDIT_SCORE_THRESHOLDS.MAXIMUM) {
      throw new Error(`Credit score must be between ${CREDIT_SCORE_THRESHOLDS.MINIMUM} and ${CREDIT_SCORE_THRESHOLDS.MAXIMUM}`);
    }
    
    if (data.income < 0) {
      throw new Error('Income cannot be negative');
    }
    
    if (data.debtToIncomeRatio < 0 || data.debtToIncomeRatio > DEBT_TO_INCOME_THRESHOLDS.MAXIMUM) {
      throw new Error(`Debt-to-income ratio must be between 0 and ${DEBT_TO_INCOME_THRESHOLDS.MAXIMUM}`);
    }
  }
  
  /**
   * Calculates overall risk level based on multiple factors
   */
  private static calculateRiskLevel(data: ApplicantData): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;
    
    // Credit score impact (40% weight)
    if (data.creditScore >= CREDIT_SCORE_THRESHOLDS.EXCELLENT) riskScore += 0;
    else if (data.creditScore >= CREDIT_SCORE_THRESHOLDS.GOOD) riskScore += 100;
    else if (data.creditScore >= CREDIT_SCORE_THRESHOLDS.FAIR) riskScore += 300;
    else riskScore += 500;
    
    // DTI impact (35% weight)
    if (data.debtToIncomeRatio <= DEBT_TO_INCOME_THRESHOLDS.EXCELLENT) riskScore += 0;
    else if (data.debtToIncomeRatio <= DEBT_TO_INCOME_THRESHOLDS.GOOD) riskScore += 100;
    else if (data.debtToIncomeRatio <= DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE) riskScore += 200;
    else riskScore += 400;
    
    // Income impact (25% weight)
    if (data.income >= INCOME_THRESHOLDS.HIGH_INCOME) riskScore += 0;
    else if (data.income >= INCOME_THRESHOLDS.MEDIUM_INCOME) riskScore += 50;
    else if (data.income >= INCOME_THRESHOLDS.LOW_INCOME) riskScore += 150;
    else riskScore += 300;
    
    if (riskScore <= RISK_SCORE_THRESHOLDS.LOW) return 'low';
    if (riskScore <= RISK_SCORE_THRESHOLDS.MEDIUM) return 'medium';
    if (riskScore <= RISK_SCORE_THRESHOLDS.HIGH) return 'high';
    return 'critical';
  }
  
  /**
   * Evaluates credit score and provides reasons
   */
  private static evaluateCreditScore(creditScore: number): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    if (creditScore >= CREDIT_SCORE_THRESHOLDS.EXCELLENT) {
      reasons.push('Excellent credit score demonstrates strong financial responsibility');
      return { score: 100, reasons };
    } else if (creditScore >= CREDIT_SCORE_THRESHOLDS.GOOD) {
      reasons.push('Good credit score indicates reliable payment history');
      return { score: 80, reasons };
    } else if (creditScore >= CREDIT_SCORE_THRESHOLDS.FAIR) {
      reasons.push('Fair credit score requires additional review');
      return { score: 60, reasons };
    } else {
      reasons.push('Poor credit score indicates high risk');
      return { score: 30, reasons };
    }
  }
  
  /**
   * Evaluates debt-to-income ratio
   */
  private static evaluateDebtToIncome(dti: number): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    if (dti <= DEBT_TO_INCOME_THRESHOLDS.EXCELLENT) {
      reasons.push('Excellent debt-to-income ratio shows strong financial management');
      return { score: 100, reasons };
    } else if (dti <= DEBT_TO_INCOME_THRESHOLDS.GOOD) {
      reasons.push('Good debt-to-income ratio within acceptable range');
      return { score: 80, reasons };
    } else if (dti <= DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE) {
      reasons.push('Debt-to-income ratio at upper acceptable limit');
      return { score: 60, reasons };
    } else {
      reasons.push('High debt-to-income ratio indicates financial stress');
      return { score: 30, reasons };
    }
  }
  
  /**
   * Evaluates income level
   */
  private static evaluateIncome(income: number): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    
    if (income >= INCOME_THRESHOLDS.HIGH_INCOME) {
      reasons.push('High income provides strong repayment capacity');
      return { score: 100, reasons };
    } else if (income >= INCOME_THRESHOLDS.MEDIUM_INCOME) {
      reasons.push('Adequate income for loan repayment');
      return { score: 80, reasons };
    } else if (income >= INCOME_THRESHOLDS.LOW_INCOME) {
      reasons.push('Income meets minimum requirements');
      return { score: 60, reasons };
    } else {
      reasons.push('Income below recommended threshold');
      return { score: 30, reasons };
    }
  }
  
  /**
   * Makes the final decision based on all factors
   */
  private static makeDecision(data: ApplicantData, riskLevel: string): 'approved' | 'declined' | 'manual_review' {
    const { creditScore, debtToIncomeRatio, income } = data;
    
    // Auto-approve criteria
    if (creditScore >= DECISION_RULES.AUTO_APPROVE.creditScore &&
        debtToIncomeRatio <= DECISION_RULES.AUTO_APPROVE.debtToIncomeRatio &&
        income >= DECISION_RULES.AUTO_APPROVE.minimumIncome &&
        riskLevel === 'low') {
      return 'approved';
    }
    
    // Auto-decline criteria
    if (creditScore < DECISION_RULES.AUTO_DECLINE.creditScore ||
        debtToIncomeRatio > DECISION_RULES.AUTO_DECLINE.debtToIncomeRatio ||
        income < DECISION_RULES.AUTO_DECLINE.minimumIncome ||
        riskLevel === 'critical') {
      return 'declined';
    }
    
    // Everything else goes to manual review
    return 'manual_review';
  }
  
  /**
   * Calculates confidence score for the decision
   */
  private static calculateConfidence(data: ApplicantData, decision: string): number {
    const { creditScore, debtToIncomeRatio, income } = data;
    
    let confidence = 0.5; // Base confidence
    
    // Adjust based on how far from thresholds
    const creditScoreDistance = Math.abs(creditScore - CREDIT_SCORE_THRESHOLDS.FAIR) / 100;
    const dtiDistance = Math.abs(debtToIncomeRatio - DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE) * 2;
    const incomeDistance = Math.abs(income - INCOME_THRESHOLDS.MEDIUM_INCOME) / 50000;
    
    confidence += Math.min(creditScoreDistance * 0.2, 0.3);
    confidence += Math.min(dtiDistance * 0.15, 0.2);
    confidence += Math.min(incomeDistance * 0.1, 0.15);
    
    return Math.min(Math.max(confidence, 0.1), 0.95);
  }
  
  /**
   * Provides recommended actions for manual review cases
   */
  private static getManualReviewActions(data: ApplicantData): string[] {
    const actions: string[] = [];
    
    if (data.creditScore < CREDIT_SCORE_THRESHOLDS.GOOD) {
      actions.push('Request detailed credit report and explanation for low score');
    }
    
    if (data.debtToIncomeRatio > DEBT_TO_INCOME_THRESHOLDS.GOOD) {
      actions.push('Verify all debt obligations and monthly payments');
    }
    
    if (data.income < INCOME_THRESHOLDS.MEDIUM_INCOME) {
      actions.push('Request additional income documentation and employment verification');
    }
    
    actions.push('Consider requiring co-signer or additional collateral');
    
    return actions;
  }
  
  /**
   * Provides recommended actions for declined applications
   */
  private static getDeclineActions(data: ApplicantData): string[] {
    const actions: string[] = [];
    
    if (data.creditScore < CREDIT_SCORE_THRESHOLDS.FAIR) {
      actions.push('Recommend credit counseling and score improvement strategies');
    }
    
    if (data.debtToIncomeRatio > DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE) {
      actions.push('Suggest debt consolidation or reduction before reapplying');
    }
    
    if (data.income < INCOME_THRESHOLDS.LOW_INCOME) {
      actions.push('Recommend increasing income or considering a co-applicant');
    }
    
    actions.push('Provide timeline for potential reapplication');
    
    return actions;
  }
}