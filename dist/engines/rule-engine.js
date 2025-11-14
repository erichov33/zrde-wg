"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleTemplates = exports.RuleEngine = exports.RuleSetSchema = exports.RuleSchema = exports.ConditionSchema = exports.DataTypeSchema = exports.OperatorSchema = void 0;
const zod_1 = require("zod");
// Rule Types and Schemas
exports.OperatorSchema = zod_1.z.enum([
    "equals", "not_equals", "greater_than", "less_than",
    "greater_than_or_equal", "less_than_or_equal",
    "contains", "not_contains", "starts_with", "ends_with",
    "in", "not_in", "between", "is_null", "is_not_null"
]);
exports.DataTypeSchema = zod_1.z.enum([
    "string", "number", "boolean", "date", "array", "object"
]);
exports.ConditionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    field: zod_1.z.string(),
    operator: exports.OperatorSchema,
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.array(zod_1.z.unknown()), zod_1.z.null()]),
    dataType: exports.DataTypeSchema,
    description: zod_1.z.string().optional()
});
exports.RuleSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.number().default(0),
    enabled: zod_1.z.boolean().default(true),
    conditions: zod_1.z.array(exports.ConditionSchema),
    logicalOperator: zod_1.z.enum(["AND", "OR"]).default("AND"),
    actions: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(["approve", "decline", "review", "set_score", "add_flag", "require_document"]),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.object({}).passthrough()]).optional(),
        message: zod_1.z.string().optional()
    })),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        createdBy: zod_1.z.string(),
        version: zod_1.z.string()
    }).optional()
});
exports.RuleSetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    rules: zod_1.z.array(exports.RuleSchema),
    executionOrder: zod_1.z.enum(["priority", "sequential", "parallel"]).default("priority"),
    metadata: zod_1.z.object({
        createdAt: zod_1.z.string(),
        updatedAt: zod_1.z.string(),
        createdBy: zod_1.z.string(),
        version: zod_1.z.string()
    }).optional()
});
// Core Rule Engine
class RuleEngine {
    static evaluateCondition(condition, context) {
        const actualValue = this.getFieldValue(condition.field, context);
        const expectedValue = condition.value;
        let matched = false;
        switch (condition.operator) {
            case "equals":
                matched = actualValue === expectedValue;
                break;
            case "not_equals":
                matched = actualValue !== expectedValue;
                break;
            case "greater_than":
                matched = Number(actualValue) > Number(expectedValue);
                break;
            case "less_than":
                matched = Number(actualValue) < Number(expectedValue);
                break;
            case "greater_than_or_equal":
                matched = Number(actualValue) >= Number(expectedValue);
                break;
            case "less_than_or_equal":
                matched = Number(actualValue) <= Number(expectedValue);
                break;
            case "contains":
                matched = String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
                break;
            case "not_contains":
                matched = !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
                break;
            case "starts_with":
                matched = String(actualValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());
                break;
            case "ends_with":
                matched = String(actualValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());
                break;
            case "in":
                matched = Array.isArray(expectedValue) && expectedValue.includes(actualValue);
                break;
            case "not_in":
                matched = Array.isArray(expectedValue) && !expectedValue.includes(actualValue);
                break;
            case "between":
                if (Array.isArray(expectedValue) && expectedValue.length === 2) {
                    const [min, max] = expectedValue;
                    matched = Number(actualValue) >= Number(min) && Number(actualValue) <= Number(max);
                }
                break;
            case "is_null":
                matched = actualValue === null || actualValue === undefined;
                break;
            case "is_not_null":
                matched = actualValue !== null && actualValue !== undefined;
                break;
            default:
                matched = false;
        }
        return { matched, actualValue };
    }
    static getFieldValue(fieldPath, context) {
        const paths = fieldPath.split('.');
        let value = context.applicationData;
        for (const path of paths) {
            if (value && typeof value === 'object' && path in value) {
                value = value[path];
            }
            else {
                // Check external data if not found in application data
                if (context.externalData && path in context.externalData) {
                    value = context.externalData[path];
                }
                else {
                    return undefined;
                }
            }
        }
        return value;
    }
    static executeRule(rule, context) {
        const startTime = Date.now();
        const conditionResults = [];
        // Evaluate all conditions
        for (const condition of rule.conditions) {
            const { matched, actualValue } = this.evaluateCondition(condition, context);
            conditionResults.push({
                conditionId: condition.id,
                field: condition.field,
                operator: condition.operator,
                expectedValue: condition.value,
                actualValue,
                matched
            });
        }
        // Apply logical operator
        let ruleMatched;
        if (rule.logicalOperator === "AND") {
            ruleMatched = conditionResults.every(c => c.matched);
        }
        else { // OR
            ruleMatched = conditionResults.some(c => c.matched);
        }
        const executionTime = Date.now() - startTime;
        return {
            ruleId: rule.id,
            ruleName: rule.name,
            matched: ruleMatched,
            actions: ruleMatched ? rule.actions.map(action => ({
                type: action.type,
                value: typeof action.value === 'object' ? action.value :
                    action.value !== undefined ? { value: action.value } :
                        undefined,
                message: action.message
            })) : [],
            executionTime,
            conditions: conditionResults
        };
    }
    static executeRuleSet(ruleSet, context) {
        const startTime = Date.now();
        const results = [];
        // Sort rules by priority if needed
        const rulesToExecute = ruleSet.executionOrder === "priority"
            ? [...ruleSet.rules].sort((a, b) => (b.priority || 0) - (a.priority || 0))
            : [...ruleSet.rules];
        // Execute rules
        for (const rule of rulesToExecute) {
            if (rule.enabled) {
                const result = this.executeRule(rule, context);
                results.push(result);
            }
        }
        // Aggregate results into final decision
        const finalDecision = this.aggregateDecision(results);
        const totalExecutionTime = Date.now() - startTime;
        return {
            ruleSetId: ruleSet.id,
            ruleSetName: ruleSet.name,
            totalExecutionTime,
            rulesExecuted: results.length,
            rulesMatched: results.filter(r => r.matched).length,
            results,
            finalDecision
        };
    }
    static aggregateDecision(results) {
        const decision = {
            outcome: "review",
            score: 0,
            flags: [],
            requiredDocuments: [],
            messages: []
        };
        let approveCount = 0;
        let declineCount = 0;
        let reviewCount = 0;
        for (const result of results) {
            if (result.matched) {
                for (const action of result.actions) {
                    switch (action.type) {
                        case "approve":
                            approveCount++;
                            if (action.message)
                                decision.messages.push(action.message);
                            break;
                        case "decline":
                            declineCount++;
                            if (action.message)
                                decision.messages.push(action.message);
                            break;
                        case "review":
                            reviewCount++;
                            if (action.message)
                                decision.messages.push(action.message);
                            break;
                        case "set_score":
                            if (typeof action.value === 'number') {
                                decision.score = Math.max(decision.score || 0, action.value);
                            }
                            break;
                        case "add_flag":
                            if (action.value) {
                                let flagValue;
                                if (typeof action.value === 'object') {
                                    flagValue = action.value.flag || action.value.value;
                                }
                                else {
                                    flagValue = String(action.value);
                                }
                                if (flagValue && !decision.flags.includes(flagValue)) {
                                    decision.flags.push(flagValue);
                                }
                            }
                            break;
                        case "require_document":
                            if (action.value) {
                                let docValue;
                                if (typeof action.value === 'object') {
                                    docValue = action.value.document || action.value.value;
                                }
                                else {
                                    docValue = String(action.value);
                                }
                                if (docValue && !decision.requiredDocuments.includes(docValue)) {
                                    decision.requiredDocuments.push(docValue);
                                }
                            }
                            break;
                    }
                }
            }
        }
        // Determine final outcome
        if (declineCount > 0) {
            decision.outcome = "declined";
        }
        else if (approveCount > 0 && reviewCount === 0) {
            decision.outcome = "approved";
        }
        else {
            decision.outcome = "review";
        }
        return decision;
    }
    // Utility methods for rule validation
    static validateRule(rule) {
        try {
            exports.RuleSchema.parse(rule);
            return { valid: true, errors: [] };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    valid: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
                };
            }
            return { valid: false, errors: ['Unknown validation error'] };
        }
    }
    static validateRuleSet(ruleSet) {
        try {
            exports.RuleSetSchema.parse(ruleSet);
            return { valid: true, errors: [] };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    valid: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
                };
            }
            return { valid: false, errors: ['Unknown validation error'] };
        }
    }
}
exports.RuleEngine = RuleEngine;
// Predefined rule templates for common underwriting scenarios
exports.RuleTemplates = {
    creditScore: {
        highCredit: {
            id: "high-credit-score",
            name: "High Credit Score Auto-Approval",
            description: "Automatically approve applications with credit scores above 750",
            priority: 100,
            enabled: true,
            conditions: [
                {
                    id: "credit-score-check",
                    field: "externalData.creditScore",
                    operator: "greater_than_or_equal",
                    value: 750,
                    dataType: "number",
                    description: "Credit score must be 750 or higher"
                }
            ],
            logicalOperator: "AND",
            actions: [
                {
                    type: "approve",
                    message: "Auto-approved due to excellent credit score"
                },
                {
                    type: "set_score",
                    value: 95
                }
            ]
        },
        lowCredit: {
            id: "low-credit-score",
            name: "Low Credit Score Decline",
            description: "Decline applications with credit scores below 500",
            priority: 90,
            enabled: true,
            conditions: [
                {
                    id: "low-credit-check",
                    field: "externalData.creditScore",
                    operator: "less_than",
                    value: 500,
                    dataType: "number",
                    description: "Credit score below minimum threshold"
                }
            ],
            logicalOperator: "AND",
            actions: [
                {
                    type: "decline",
                    message: "Credit score below minimum requirements"
                },
                {
                    type: "add_flag",
                    value: "low_credit_score"
                }
            ]
        }
    },
    income: {
        debtToIncomeRatio: {
            id: "debt-to-income-ratio",
            name: "Debt-to-Income Ratio Check",
            description: "Review applications with high debt-to-income ratios",
            priority: 80,
            enabled: true,
            conditions: [
                {
                    id: "dti-ratio-check",
                    field: "calculatedFields.debtToIncomeRatio",
                    operator: "greater_than",
                    value: 0.4,
                    dataType: "number",
                    description: "Debt-to-income ratio above 40%"
                }
            ],
            logicalOperator: "AND",
            actions: [
                {
                    type: "review",
                    message: "High debt-to-income ratio requires manual review"
                },
                {
                    type: "require_document",
                    value: "income_verification"
                },
                {
                    type: "add_flag",
                    value: "high_dti"
                }
            ]
        }
    },
    fraud: {
        velocityCheck: {
            id: "application-velocity",
            name: "Application Velocity Check",
            description: "Flag multiple applications from same user in short timeframe",
            priority: 95,
            enabled: true,
            conditions: [
                {
                    id: "velocity-check",
                    field: "externalData.applicationCount24h",
                    operator: "greater_than",
                    value: 3,
                    dataType: "number",
                    description: "More than 3 applications in 24 hours"
                }
            ],
            logicalOperator: "AND",
            actions: [
                {
                    type: "review",
                    message: "Multiple applications detected - potential fraud"
                },
                {
                    type: "add_flag",
                    value: "velocity_fraud"
                },
                {
                    type: "require_document",
                    value: "identity_verification"
                }
            ]
        }
    }
};
