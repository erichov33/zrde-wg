"use strict";
/**
 * Decision Node Executor
 *
 * Executes decision nodes that evaluate conditions and route workflow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionNodeExecutor = void 0;
const base_node_executor_1 = require("./base-node-executor");
/**
 * Executor for decision nodes
 */
class DecisionNodeExecutor extends base_node_executor_1.BaseNodeExecutor {
    async execute(context) {
        try {
            this.log('info', `Executing decision node: ${this.node.id}`, {
                decisionType: this.getConfig('decisionType'),
                label: this.node.data.label
            });
            const decisionConfig = this.getConfig('decisionConfig', {});
            const decisionType = this.getConfig('decisionType', 'simple');
            // Evaluate the decision based on type
            const result = await this.evaluateDecision(decisionType, decisionConfig, context);
            // Determine next connector based on result
            const nextConnector = this.determineNextConnector(result, decisionConfig);
            // Update context with decision results
            this.updateContext(context, {
                [`decision_${this.node.id}_result`]: result,
                [`decision_${this.node.id}_outcome`]: result.outcome,
                [`decision_${this.node.id}_confidence`]: result.confidence,
                [`decision_${this.node.id}_timestamp`]: new Date().toISOString()
            });
            return this.createSuccessResult(result, nextConnector);
        }
        catch (error) {
            this.log('error', `Decision execution failed: ${this.node.id}`, error);
            return this.createErrorResult(error instanceof Error ? error.message : 'Decision execution failed');
        }
    }
    /**
     * Evaluate decision based on type and configuration
     */
    async evaluateDecision(decisionType, config, context) {
        switch (decisionType) {
            case 'simple':
                return this.evaluateSimpleDecision(config, context);
            case 'complex':
                return this.evaluateComplexDecision(config, context);
            case 'multiple':
                return this.evaluateMultipleDecision(config, context);
            case 'score_based':
                return this.evaluateScoreBasedDecision(config, context);
            case 'threshold':
                return this.evaluateThresholdDecision(config, context);
            default:
                return this.evaluateDefaultDecision(config, context);
        }
    }
    /**
     * Evaluate simple decision (single condition)
     */
    async evaluateSimpleDecision(config, context) {
        const condition = config.condition;
        if (!condition) {
            throw new Error('Simple decision requires a condition');
        }
        const result = this.evaluateCondition(condition, context);
        return {
            type: 'simple',
            outcome: result ? 'true' : 'false',
            confidence: 1.0,
            condition,
            evaluatedValue: this.getVariableValue(condition.variable, context),
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Evaluate complex decision (multiple conditions with logic)
     */
    async evaluateComplexDecision(config, context) {
        const conditions = config.conditions || [];
        const logic = config.logic || 'AND'; // AND, OR, CUSTOM
        if (conditions.length === 0) {
            throw new Error('Complex decision requires conditions');
        }
        const conditionResults = conditions.map((condition) => ({
            condition,
            result: this.evaluateCondition(condition, context),
            value: this.getVariableValue(condition.variable, context)
        }));
        let outcome;
        switch (logic) {
            case 'AND':
                outcome = conditionResults.every((cr) => cr.result);
                break;
            case 'OR':
                outcome = conditionResults.some((cr) => cr.result);
                break;
            case 'CUSTOM':
                outcome = this.evaluateCustomLogic(config.customLogic, conditionResults);
                break;
            default:
                outcome = conditionResults.every((cr) => cr.result);
        }
        return {
            type: 'complex',
            outcome: outcome ? 'true' : 'false',
            confidence: this.calculateConfidence(conditionResults),
            logic,
            conditionResults,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Evaluate multiple decision (multiple outcomes)
     */
    async evaluateMultipleDecision(config, context) {
        const options = config.options || [];
        if (options.length === 0) {
            throw new Error('Multiple decision requires options');
        }
        for (const option of options) {
            if (this.evaluateCondition(option.condition, context)) {
                return {
                    type: 'multiple',
                    outcome: option.outcome,
                    confidence: 1.0,
                    selectedOption: option,
                    evaluatedValue: this.getVariableValue(option.condition.variable, context),
                    timestamp: new Date().toISOString()
                };
            }
        }
        // Default outcome if no conditions match
        const defaultOutcome = config.defaultOutcome || 'default';
        return {
            type: 'multiple',
            outcome: defaultOutcome,
            confidence: 0.5,
            selectedOption: null,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Evaluate score-based decision
     */
    async evaluateScoreBasedDecision(config, context) {
        const scoreVariable = config.scoreVariable || 'score';
        const thresholds = config.thresholds || {};
        const score = this.getVariableValue(scoreVariable, context) || 0;
        let outcome = 'default';
        if (score >= (thresholds.excellent || 800)) {
            outcome = 'excellent';
        }
        else if (score >= (thresholds.good || 700)) {
            outcome = 'good';
        }
        else if (score >= (thresholds.fair || 600)) {
            outcome = 'fair';
        }
        else {
            outcome = 'poor';
        }
        return {
            type: 'score_based',
            outcome,
            confidence: 1.0,
            score,
            thresholds,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Evaluate threshold decision
     */
    async evaluateThresholdDecision(config, context) {
        const variable = config.variable;
        const threshold = config.threshold;
        const operator = config.operator || '>=';
        if (!variable || threshold === undefined) {
            throw new Error('Threshold decision requires variable and threshold');
        }
        const value = this.getVariableValue(variable, context);
        const result = this.compareValues(value, operator, threshold);
        return {
            type: 'threshold',
            outcome: result ? 'above' : 'below',
            confidence: 1.0,
            variable,
            value,
            threshold,
            operator,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Evaluate default decision
     */
    async evaluateDefaultDecision(config, context) {
        return {
            type: 'default',
            outcome: config.defaultOutcome || 'continue',
            confidence: 1.0,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Evaluate a single condition
     */
    evaluateCondition(condition, context) {
        if (!condition || !condition.variable) {
            return false;
        }
        const value = this.getVariableValue(condition.variable, context);
        const operator = condition.operator || '==';
        const expectedValue = condition.value;
        return this.compareValues(value, operator, expectedValue);
    }
    /**
     * Get variable value from context
     */
    getVariableValue(variable, context) {
        // Support nested variable access (e.g., "user.profile.age")
        const parts = variable.split('.');
        let value = context.variables;
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
    /**
     * Compare values using operator
     */
    compareValues(value, operator, expectedValue) {
        switch (operator) {
            case '==':
            case '===':
                return value === expectedValue;
            case '!=':
            case '!==':
                return value !== expectedValue;
            case '>':
                return Number(value) > Number(expectedValue);
            case '>=':
                return Number(value) >= Number(expectedValue);
            case '<':
                return Number(value) < Number(expectedValue);
            case '<=':
                return Number(value) <= Number(expectedValue);
            case 'contains':
                return String(value).includes(String(expectedValue));
            case 'startsWith':
                return String(value).startsWith(String(expectedValue));
            case 'endsWith':
                return String(value).endsWith(String(expectedValue));
            case 'in':
                return Array.isArray(expectedValue) && expectedValue.includes(value);
            case 'notIn':
                return Array.isArray(expectedValue) && !expectedValue.includes(value);
            default:
                return false;
        }
    }
    /**
     * Evaluate custom logic expression
     */
    evaluateCustomLogic(logic, conditionResults) {
        // Simple custom logic evaluation
        // This could be enhanced with a proper expression parser
        try {
            let expression = logic;
            conditionResults.forEach((cr, index) => {
                expression = expression.replace(new RegExp(`C${index}`, 'g'), cr.result.toString());
            });
            // Basic safety check - only allow boolean operations
            if (!/^[true|false|\s|&|\||\!|\(|\)]+$/.test(expression)) {
                throw new Error('Invalid custom logic expression');
            }
            return eval(expression.replace(/&/g, '&&').replace(/\|/g, '||'));
        }
        catch (error) {
            this.log('warn', 'Custom logic evaluation failed, defaulting to false', error);
            return false;
        }
    }
    /**
     * Calculate confidence based on condition results
     */
    calculateConfidence(conditionResults) {
        if (conditionResults.length === 0)
            return 0;
        // Simple confidence calculation - could be enhanced
        const definiteResults = conditionResults.filter(cr => cr.value !== undefined && cr.value !== null);
        return definiteResults.length / conditionResults.length;
    }
    /**
     * Determine next connector based on decision result
     */
    determineNextConnector(result, config) {
        const outcome = result.outcome;
        // Check if there's a specific connector mapping
        const connectorMap = config.connectorMap || {};
        if (connectorMap[outcome]) {
            return connectorMap[outcome];
        }
        // Default connector mapping
        switch (outcome) {
            case 'true':
            case 'above':
            case 'excellent':
            case 'good':
                return 'true';
            case 'false':
            case 'below':
            case 'poor':
                return 'false';
            case 'fair':
            case 'review':
                return 'review';
            default:
                return outcome || 'default';
        }
    }
    /**
     * Validate decision node configuration
     */
    validateNodeSpecific() {
        const errors = [];
        const warnings = [];
        const decisionType = this.getConfig('decisionType', 'simple');
        const decisionConfig = this.getConfig('decisionConfig', {});
        const validDecisionTypes = ['simple', 'complex', 'multiple', 'score_based', 'threshold'];
        if (!validDecisionTypes.includes(decisionType)) {
            warnings.push(`Unknown decision type: ${decisionType}`);
        }
        // Validate based on decision type
        switch (decisionType) {
            case 'simple':
                if (!decisionConfig.condition) {
                    errors.push('Simple decision requires a condition');
                }
                break;
            case 'complex':
                if (!decisionConfig.conditions || !Array.isArray(decisionConfig.conditions)) {
                    errors.push('Complex decision requires conditions array');
                }
                break;
            case 'multiple':
                if (!decisionConfig.options || !Array.isArray(decisionConfig.options)) {
                    errors.push('Multiple decision requires options array');
                }
                break;
            case 'score_based':
                if (!decisionConfig.scoreVariable) {
                    warnings.push('Score-based decision should specify scoreVariable');
                }
                break;
            case 'threshold':
                if (!decisionConfig.variable || decisionConfig.threshold === undefined) {
                    errors.push('Threshold decision requires variable and threshold');
                }
                break;
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}
exports.DecisionNodeExecutor = DecisionNodeExecutor;
