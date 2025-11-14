// Integration test for the unified workflow system
import { UnifiedWorkflowService } from './lib/services/unified-workflow-service';
import { WorkflowExecutionEngine } from './lib/engines/workflow-execution-engine';
import { WorkflowConfig } from './lib/types/unified-workflow';

async function runIntegrationTest() {
  console.log('🔧 Running Workflow System Integration Test...\n');

  try {
    // Initialize services
    console.log('1. Initializing services...');
    const workflowService = new UnifiedWorkflowService();
    const executionEngine = new WorkflowExecutionEngine(workflowService);
    console.log('✅ Services initialized successfully\n');

    // Create a test workflow
    console.log('2. Creating test workflow...');
    const testWorkflow = workflowService.createDefaultWorkflow();
    console.log('✅ Test workflow created:', {
      id: testWorkflow.id,
      name: testWorkflow.name,
      nodeCount: testWorkflow.nodes.length,
      connectionCount: testWorkflow.connections.length
    });
    console.log('   Nodes:', testWorkflow.nodes.map(n => `${n.id} (${n.type})`));
    console.log('   Connections:', testWorkflow.connections.map(c => `${c.source} → ${c.target}`));
    console.log('');

    // Save the workflow
    console.log('3. Saving workflow...');
    const savedWorkflow = await workflowService.saveWorkflow(testWorkflow);
    console.log('✅ Workflow saved with ID:', savedWorkflow.id);
    console.log('');

    // Validate the workflow
    console.log('4. Validating workflow...');
    const validationResult = await workflowService.validateWorkflow(savedWorkflow);
    console.log('✅ Validation result:', {
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length
    });
    
    if (validationResult.errors.length > 0) {
      console.log('   Errors:', validationResult.errors.map(e => e.message));
    }
    if (validationResult.warnings.length > 0) {
      console.log('   Warnings:', validationResult.warnings.map(w => w.message));
    }
    console.log('');

    // Test workflow execution (if valid)
    if (validationResult.isValid) {
      console.log('5. Testing workflow execution...');
      const executionResult = await executionEngine.executeWorkflow(
        savedWorkflow.id,
        { testData: 'sample input' }
      );
      
      console.log('✅ Execution completed:', {
        success: executionResult.success,
        executionId: executionResult.executionId,
        errorCount: executionResult.errors?.length || 0
      });
      
      if (!executionResult.success && executionResult.errors?.length > 0) {
        console.log('   Errors:', executionResult.errors.map(e => e.message));
      }
    } else {
      console.log('5. ⚠️ Skipping execution due to validation errors');
    }
    console.log('');

    // List workflows
    console.log('6. Listing workflows...');
    const workflows = await workflowService.listWorkflows();
    console.log('✅ Found workflows:', workflows.length);
    workflows.forEach(w => {
      console.log(`   - ${w.name} (${w.id}) - ${w.status}`);
    });
    console.log('');

    console.log('🎉 Integration test completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Services: Initialized`);
    console.log(`   - Workflow: Created and saved`);
    console.log(`   - Validation: ${validationResult.isValid ? 'Passed' : 'Failed'}`);
    console.log(`   - Execution: ${validationResult.isValid ? 'Tested' : 'Skipped'}`);
    console.log(`   - Total workflows: ${workflows.length}`);

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the integration test
runIntegrationTest().catch(console.error);