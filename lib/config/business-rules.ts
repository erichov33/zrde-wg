/**
 * Business Rules Configuration
 * Centralized configuration for all business logic constants and rules
 */

export const CREDIT_SCORE_THRESHOLDS = {
  EXCELLENT: 800,
  GOOD: 700,
  FAIR: 650,
  POOR: 600,
  MINIMUM: 300,
  MAXIMUM: 850
} as const;

export const DEBT_TO_INCOME_THRESHOLDS = {
  EXCELLENT: 0.2,
  GOOD: 0.3,
  ACCEPTABLE: 0.4,
  HIGH_RISK: 0.5,
  MAXIMUM: 1.0
} as const;

export const RISK_SCORE_THRESHOLDS = {
  LOW: 300,
  MEDIUM: 500,
  HIGH: 650,
  CRITICAL: 800,
  MAXIMUM: 1000
} as const;

export const INCOME_THRESHOLDS = {
  MINIMUM_ANNUAL: 25000,
  LOW_INCOME: 40000,
  MEDIUM_INCOME: 75000,
  HIGH_INCOME: 150000,
  ULTRA_HIGH: 500000
} as const;

export const DECISION_RULES = {
  AUTO_APPROVE: {
    creditScore: CREDIT_SCORE_THRESHOLDS.GOOD,
    debtToIncomeRatio: DEBT_TO_INCOME_THRESHOLDS.GOOD,
    minimumIncome: INCOME_THRESHOLDS.MEDIUM_INCOME
  },
  MANUAL_REVIEW: {
    creditScore: CREDIT_SCORE_THRESHOLDS.FAIR,
    debtToIncomeRatio: DEBT_TO_INCOME_THRESHOLDS.ACCEPTABLE,
    minimumIncome: INCOME_THRESHOLDS.LOW_INCOME
  },
  AUTO_DECLINE: {
    creditScore: CREDIT_SCORE_THRESHOLDS.POOR,
    debtToIncomeRatio: DEBT_TO_INCOME_THRESHOLDS.HIGH_RISK,
    minimumIncome: INCOME_THRESHOLDS.MINIMUM_ANNUAL
  }
} as const;

export const DATA_SOURCE_CONFIG = {
  ENDPOINTS: {
    CREDIT_BUREAU: '/api/credit-bureau',
    INCOME_VERIFICATION: '/api/income-verification',
    FRAUD_SERVICE: '/api/fraud-detection',
    BANK_VERIFICATION: '/api/bank-verification'
  },
  TIMEOUT_MS: 5000,
  RETRY_ATTEMPTS: 3,
  CACHE_DURATION_MS: 300000 // 5 minutes
} as const;

export const SIMULATION_CONFIG = {
  DEFAULT_TEST_CASES: {
    APPROVED: {
      creditScore: 780,
      income: 85000,
      debtToIncomeRatio: 0.25,
      expectedDecision: 'approved'
    },
    MANUAL_REVIEW: {
      creditScore: 680,
      income: 55000,
      debtToIncomeRatio: 0.35,
      expectedDecision: 'manual_review'
    },
    DECLINED: {
      creditScore: 580,
      income: 35000,
      debtToIncomeRatio: 0.55,
      expectedDecision: 'declined'
    }
  },
  RANDOM_GENERATION: {
    SUCCESS_PROBABILITY: 0.7,
    ERROR_PROBABILITY: 0.1
  }
} as const;

export const UI_CONFIG = {
  ANIMATION_DURATION_MS: 300,
  DEBOUNCE_DELAY_MS: 500,
  MAX_RETRY_ATTEMPTS: 3,
  TOAST_DURATION_MS: 4000
} as const;

// Type exports for better type safety
export type CreditScoreThreshold = keyof typeof CREDIT_SCORE_THRESHOLDS;
export type DebtToIncomeThreshold = keyof typeof DEBT_TO_INCOME_THRESHOLDS;
export type RiskScoreThreshold = keyof typeof RISK_SCORE_THRESHOLDS;
export type IncomeThreshold = keyof typeof INCOME_THRESHOLDS;
export type DecisionRule = keyof typeof DECISION_RULES;