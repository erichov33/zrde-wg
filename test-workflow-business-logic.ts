import { WorkflowBusinessLogicService } from './lib/services/workflow-business-logic-service';

// Test that the service can generate workflow templates without TypeScript errors
try {
  const templates = WorkflowBusinessLogicService.getWorkflowTemplates();
  console.log(`Successfully generated ${templates.length} workflow templates`);
  
  // Test that each template has the expected structure
  templates.forEach(template => {
    console.log(`Template: ${template.name} has ${template.nodes.length} nodes`);
    
    // Verify that all nodes have the required properties
    template.nodes.forEach(node => {
      if (!node.id || !node.type || !node.data || !node.position) {
        throw new Error(`Invalid node structure in template ${template.name}`);
      }
    });
  });
  
  console.log('All workflow templates are valid!');
} catch (error) {
  console.error('Error testing workflow templates:', error);
  process.exit(1);
}