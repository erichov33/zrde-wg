"use strict";
/**
 * Rule Set Node Executor
 *
 * Executes rule set nodes that evaluate business rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleSetNodeExecutor = void 0;
const base_node_executor_1 = require("./base-node-executor");
const rule_engine_1 = require("../rule-engine");
/**
 * Executor for rule set nodes
 */
class RuleSetNodeExecutor extends base_node_executor_1.BaseNodeExecutor {
    async execute(context) {
        try {
            this.log('info', `Executing rule set node: ${this.node.id}`, {
                ruleSetId: this.getConfig('ruleSetId'),
                label: this.node.data.label
            });
            const ruleSetId = this.getConfig('ruleSetId');
            const ruleSet = this.getConfig('ruleSet');
            const rules = this.getConfig('rules', []);
            // Validate that we have either a rule set or individual rules
            if (!ruleSetId && !ruleSet && rules.length === 0) {
                throw new Error('No rules or rule set configured');
            }
            // Extract application and external data from context
            const applicationData = this.extractApplicationData(context);
            const externalData = this.extractExternalData(context);
            // Create rule execution context
            const ruleContext = {
                applicationData,
                externalData,
                userContext: context.userContext,
                metadata: context.metadata
            };
            let result;
            if (ruleSet) {
                // Execute a complete rule set
                result = rule_engine_1.RuleEngine.executeRuleSet(ruleSet, ruleContext);
            }
            else if (rules.length > 0) {
                // Execute individual rules
                const ruleResults = [];
                for (const rule of rules) {
                    const ruleResult = rule_engine_1.RuleEngine.executeRule(rule, ruleContext);
                    ruleResults.push(ruleResult);
                }
                // Aggregate results
                result = this.aggregateRuleResults(ruleResults);
            }
            else {
                throw new Error('No valid rule configuration found');
            }
            // Determine next connector based on result
            const nextConnector = this.determineNextConnector(result);
            // Update context with rule execution results
            this.updateContext(context, {
                [`ruleset_${this.node.id}_result`]: result,
                [`ruleset_${this.node.id}_decision`]: result.decision,
                [`ruleset_${this.node.id}_score`]: result.score,
                [`ruleset_${this.node.id}_timestamp`]: new Date().toISOString()
            });
            return this.createSuccessResult(result, nextConnector);
        }
        catch (error) {
            this.log('error', `Rule set execution failed: ${this.node.id}`, error);
            return this.createErrorResult(error instanceof Error ? error.message : 'Rule set execution failed');
        }
    }
    /**
     * Extract application data from workflow context
     */
    extractApplicationData(context) {
        return {
            applicantId: context.variables.applicantId,
            firstName: context.variables.firstName,
            lastName: context.variables.lastName,
            email: context.variables.email,
            phone: context.variables.phone,
            dateOfBirth: context.variables.dateOfBirth,
            ssn: context.variables.ssn,
            address: context.variables.address,
            employerName: context.variables.employerName,
            statedIncome: context.variables.statedIncome,
            requestedAmount: context.variables.requestedAmount,
            loanPurpose: context.variables.loanPurpose,
            ...context.variables // Include all other variables
        };
    }
    /**
     * Extract external data from workflow context
     */
    extractExternalData(context) {
        const externalData = {};
        // Extract credit data
        if (context.variables.creditScore) {
            externalData.creditScore = context.variables.creditScore;
            externalData.creditHistory = context.variables.creditHistory;
        }
        // Extract income verification data
        if (context.variables.verifiedIncome) {
            externalData.verifiedIncome = context.variables.verifiedIncome;
            externalData.employmentStatus = context.variables.employmentStatus;
        }
        // Extract fraud detection data
        if (context.variables.riskScore) {
            externalData.fraudRiskScore = context.variables.riskScore;
            externalData.fraudFlags = context.variables.fraudFlags;
        }
        // Extract KYC data
        if (context.variables.identityVerification) {
            externalData.identityVerified = context.variables.identityVerification?.status === 'verified';
            externalData.addressVerified = context.variables.addressVerification?.status === 'verified';
        }
        // Extract debt information
        if (context.variables.totalDebt) {
            externalData.totalDebt = context.variables.totalDebt;
            externalData.debtToIncomeRatio = context.variables.debtToIncomeRatio;
        }
        return externalData;
    }
    /**
     * Aggregate results from multiple rule executions
     */
    aggregateRuleResults(ruleResults) {
        let approvedCount = 0;
        let declinedCount = 0;
        let reviewCount = 0;
        let totalScore = 0;
        const executedRules = ruleResults.map(result => {
            totalScore += result.score || 0;
            switch (result.decision) {
                case 'approved':
                    approvedCount++;
                    break;
                case 'declined':
                    declinedCount++;
                    break;
                case 'review':
                    reviewCount++;
                    break;
            }
            return {
                ruleId: result.ruleId,
                decision: result.decision,
                score: result.score,
                reason: result.reason,
                conditions: result.conditions
            };
        });
        // Determine overall decision
        let overallDecision = 'approved';
        if (declinedCount > 0) {
            overallDecision = 'declined';
        }
        else if (reviewCount > 0) {
            overallDecision = 'review';
        }
        const averageScore = ruleResults.length > 0 ? totalScore / ruleResults.length : 0;
        return {
            decision: overallDecision,
            score: averageScore,
            executedRules,
            summary: {
                totalRules: ruleResults.length,
                approved: approvedCount,
                declined: declinedCount,
                review: reviewCount
            },
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Determine next connector based on rule execution result
     */
    determineNextConnector(result) {
        const decision = result.decision || 'approved';
        switch (decision) {
            case 'approved':
                return 'approved';
            case 'declined':
                return 'declined';
            case 'review':
                return 'review';
            default:
                return 'default';
        }
    }
    /**
     * Validate rule set node configuration
     */
    validateNodeSpecific() {
        const errors = [];
        const warnings = [];
        const ruleSetId = this.getConfig('ruleSetId');
        const ruleSet = this.getConfig('ruleSet');
        const rules = this.getConfig('rules', []);
        if (!ruleSetId && !ruleSet && rules.length === 0) {
            errors.push('Rule set ID, rule set configuration, or individual rules are required');
        }
        if (ruleSet) {
            const ruleSetAny = ruleSet;
            if (!ruleSetAny.id) {
                errors.push('Rule set must have an ID');
            }
            if (!ruleSetAny.rules || !Array.isArray(ruleSetAny.rules)) {
                errors.push('Rule set must contain an array of rules');
            }
        }
        if (rules.length > 0) {
            rules.forEach((rule, index) => {
                if (!rule.id) {
                    errors.push(`Rule at index ${index} must have an ID`);
                }
                if (!rule.conditions || !Array.isArray(rule.conditions)) {
                    errors.push(`Rule at index ${index} must have conditions`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.RuleSetNodeExecutor = RuleSetNodeExecutor;
