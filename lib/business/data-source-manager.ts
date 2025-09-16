/**
 * Data Source Manager - Abstraction layer for external data sources
 * Handles all external API calls and data validation
 */

import { DATA_SOURCE_CONFIG } from '@/lib/config/business-rules';

export interface DataSourceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  source: string;
}

export interface CreditBureauData {
  creditScore: number;
  paymentHistory: string;
  creditUtilization: number;
  lengthOfHistory: number;
  newCredit: number;
  creditMix: number;
}

export interface IncomeVerificationData {
  annualIncome: number;
  employmentStatus: string;
  employmentDuration: number;
  employer: string;
  verified: boolean;
}

export interface FraudDetectionData {
  riskScore: number;
  fraudIndicators: string[];
  deviceFingerprint: string;
  ipRiskLevel: string;
}

export class DataSourceManager {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  
  /**
   * Fetches credit bureau data with caching and error handling
   */
  static async getCreditBureauData(ssn: string): Promise<DataSourceResult<CreditBureauData>> {
    const cacheKey = `credit_${ssn}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: Date.now(),
        source: 'cache'
      };
    }
    
    try {
      const response = await this.fetchWithRetry(
        DATA_SOURCE_CONFIG.ENDPOINTS.CREDIT_BUREAU,
        { ssn },
        DATA_SOURCE_CONFIG.RETRY_ATTEMPTS
      );
      
      const data = await response.json();
      this.setCachedData(cacheKey, data);
      
      return {
        success: true,
        data,
        timestamp: Date.now(),
        source: 'credit_bureau'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Credit bureau fetch failed',
        timestamp: Date.now(),
        source: 'credit_bureau'
      };
    }
  }
  
  /**
   * Fetches income verification data
   */
  static async getIncomeVerificationData(employerId: string, employeeId: string): Promise<DataSourceResult<IncomeVerificationData>> {
    const cacheKey = `income_${employerId}_${employeeId}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return {
        success: true,
        data: cached,
        timestamp: Date.now(),
        source: 'cache'
      };
    }
    
    try {
      const response = await this.fetchWithRetry(
        DATA_SOURCE_CONFIG.ENDPOINTS.INCOME_VERIFICATION,
        { employerId, employeeId },
        DATA_SOURCE_CONFIG.RETRY_ATTEMPTS
      );
      
      const data = await response.json();
      this.setCachedData(cacheKey, data);
      
      return {
        success: true,
        data,
        timestamp: Date.now(),
        source: 'income_verification'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Income verification failed',
        timestamp: Date.now(),
        source: 'income_verification'
      };
    }
  }
  
  /**
   * Fetches fraud detection data
   */
  static async getFraudDetectionData(applicationData: any): Promise<DataSourceResult<FraudDetectionData>> {
    try {
      const response = await this.fetchWithRetry(
        DATA_SOURCE_CONFIG.ENDPOINTS.FRAUD_SERVICE,
        applicationData,
        DATA_SOURCE_CONFIG.RETRY_ATTEMPTS
      );
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now(),
        source: 'fraud_detection'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fraud detection failed',
        timestamp: Date.now(),
        source: 'fraud_detection'
      };
    }
  }
  
  /**
   * Tests connection to a data source
   */
  static async testConnection(dataSourceType: string): Promise<DataSourceResult<{ status: string }>> {
    const endpoints = DATA_SOURCE_CONFIG.ENDPOINTS;
    let endpoint: string;
    
    switch (dataSourceType) {
      case 'credit_bureau':
        endpoint = endpoints.CREDIT_BUREAU;
        break;
      case 'income_verification':
        endpoint = endpoints.INCOME_VERIFICATION;
        break;
      case 'fraud_detection':
        endpoint = endpoints.FRAUD_SERVICE;
        break;
      case 'bank_verification':
        endpoint = endpoints.BANK_VERIFICATION;
        break;
      default:
        return {
          success: false,
          error: 'Unknown data source type',
          timestamp: Date.now(),
          source: dataSourceType
        };
    }
    
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(DATA_SOURCE_CONFIG.TIMEOUT_MS)
      });
      
      if (response.ok) {
        return {
          success: true,
          data: { status: 'connected' },
          timestamp: Date.now(),
          source: dataSourceType
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: Date.now(),
          source: dataSourceType
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: Date.now(),
        source: dataSourceType
      };
    }
  }
  
  /**
   * Fetches data with retry logic
   */
  private static async fetchWithRetry(
    endpoint: string,
    data: any,
    maxRetries: number
  ): Promise<Response> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(DATA_SOURCE_CONFIG.TIMEOUT_MS)
        });
        
        if (response.ok) {
          return response;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Gets cached data if still valid
   */
  private static getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < DATA_SOURCE_CONFIG.CACHE_DURATION_MS) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Sets data in cache
   */
  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clears all cached data
   */
  static clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Gets cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}