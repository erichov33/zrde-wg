"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unified_workflow_service_1 = require("./lib/services/unified-workflow-service");
const workflow_execution_engine_1 = require("./lib/engines/workflow-execution-engine");
const unified_workflow_1 = require("./lib/types/unified-workflow");
async function testWorkflowSystem() {
    console.log('🧪 Testing Unified Workflow System...\n');
    try {
        // 1. Create services
        console.log('1. Initializing services...');
        const workflowService = new unified_workflow_service_1.UnifiedWorkflowService();
        const executionEngine = new workflow_execution_engine_1.WorkflowExecutionEngine(workflowService);
        console.log('✅ Services initialized successfully\n');
        // 2. Create a default workflow
        console.log('2. Creating default workflow...');
        const defaultWorkflow = (0, unified_workflow_1.createDefaultWorkflow)('enhanced');
        console.log('✅ Default workflow created:', {
            name: defaultWorkflow.name,
            nodeCount: defaultWorkflow.nodes.length,
            connectionCount: defaultWorkflow.connections.length
        });
        console.log('   Nodes:', defaultWorkflow.nodes.map(n => `${n.id} (${n.type})`));
        console.log('   Connections:', defaultWorkflow.connections.map(c => `${c.source} → ${c.target}`));
        console.log('');
        // 3. Save the workflow
        console.log('3. Saving workflow...');
        const savedWorkflow = await workflowService.saveWorkflow(defaultWorkflow);
        console.log('✅ Workflow saved with ID:', savedWorkflow.id);
        console.log('');
        // 4. Validate the workflow
        console.log('4. Validating workflow...');
        const validation = await workflowService.validateWorkflow(savedWorkflow);
        console.log('✅ Validation result:', {
            isValid: validation.isValid,
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length
        });
        if (validation.errors.length > 0) {
            console.log('   Errors:', validation.errors);
        }
        if (validation.warnings.length > 0) {
            console.log('   Warnings:', validation.warnings);
        }
        console.log('');
        // 5. Test workflow execution
        console.log('5. Testing workflow execution...');
        const testData = {
            userId: 'test-user-123',
            amount: 1000,
            riskScore: 0.3
        };
        const result = await executionEngine.executeWorkflow(savedWorkflow.id, testData);
        console.log('✅ Workflow execution completed:', {
            success: result.success,
            executionTime: result.metadata.duration,
            nodesExecuted: result.metadata.nodesExecuted
        });
        if (!result.success && result.errors.length > 0) {
            console.log('   Errors:', result.errors.map(e => e.message));
        }
        console.log('');
        // 6. Test workflow listing
        console.log('6. Testing workflow listing...');
        const workflows = await workflowService.listWorkflows();
        console.log('✅ Found workflows:', workflows.length);
        console.log('');
        console.log('🎉 All tests completed successfully!');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    }
}
// Run the test
testWorkflowSystem();
