"use strict";
/**
 * Centralized Type Exports - Single Source of Truth
 *
 * This file serves as the main entry point for all type definitions
 * to eliminate conflicts and provide consistent imports across the codebase.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIORITIES = exports.ASSIGNEES = exports.WORKFLOWS = exports.createDataRequirements = exports.convertExternalSourcesToIds = exports.isFullWorkflowDefinition = exports.isEnhancedWorkflowDefinition = exports.hasRules = exports.isEndNode = exports.isStartNode = exports.getAvailableNodeTypes = exports.createDefaultWorkflow = void 0;
// Utility functions
var unified_workflow_1 = require("./unified-workflow");
Object.defineProperty(exports, "createDefaultWorkflow", { enumerable: true, get: function () { return unified_workflow_1.createDefaultWorkflow; } });
Object.defineProperty(exports, "getAvailableNodeTypes", { enumerable: true, get: function () { return unified_workflow_1.getAvailableNodeTypes; } });
Object.defineProperty(exports, "isStartNode", { enumerable: true, get: function () { return unified_workflow_1.isStartNode; } });
Object.defineProperty(exports, "isEndNode", { enumerable: true, get: function () { return unified_workflow_1.isEndNode; } });
Object.defineProperty(exports, "hasRules", { enumerable: true, get: function () { return unified_workflow_1.hasRules; } });
var workflow_definitions_1 = require("./workflow-definitions");
Object.defineProperty(exports, "isEnhancedWorkflowDefinition", { enumerable: true, get: function () { return workflow_definitions_1.isEnhancedWorkflowDefinition; } });
Object.defineProperty(exports, "isFullWorkflowDefinition", { enumerable: true, get: function () { return workflow_definitions_1.isFullWorkflowDefinition; } });
Object.defineProperty(exports, "convertExternalSourcesToIds", { enumerable: true, get: function () { return workflow_definitions_1.convertExternalSourcesToIds; } });
Object.defineProperty(exports, "createDataRequirements", { enumerable: true, get: function () { return workflow_definitions_1.createDataRequirements; } });
// Constants
var application_1 = require("./application");
Object.defineProperty(exports, "WORKFLOWS", { enumerable: true, get: function () { return application_1.WORKFLOWS; } });
Object.defineProperty(exports, "ASSIGNEES", { enumerable: true, get: function () { return application_1.ASSIGNEES; } });
Object.defineProperty(exports, "PRIORITIES", { enumerable: true, get: function () { return application_1.PRIORITIES; } });
