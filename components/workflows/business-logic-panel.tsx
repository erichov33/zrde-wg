/**
 * Business Logic Panel Component
 * Focused component for managing business logic templates
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowBusinessLogicService } from "@/lib/services/workflow-business-logic-service"
import { WorkflowConfigurationManager } from "@/lib/config/workflow-config"
import type { BusinessLogicTemplate } from "@/lib/services/workflow-business-logic-service"
import type { ApplicantData } from "@/lib/business/decision-engine"

interface BusinessLogicPanelProps {
  onTemplateSelect?: (template: BusinessLogicTemplate) => void
  className?: string
}

export function BusinessLogicPanel({ onTemplateSelect, className = "" }: BusinessLogicPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessLogicTemplate | null>(null)
  const [testData, setTestData] = useState<Partial<ApplicantData>>({
    creditScore: 720,
    income: 75000,
    debtToIncomeRatio: 0.35
  })
  const [testResult, setTestResult] = useState<any>(null)

  const businessLogicTemplates = WorkflowBusinessLogicService.getBusinessLogicTemplates()
  const configurations = WorkflowConfigurationManager.getAllConfigurations()

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'credit':
        return 'bg-blue-100 text-blue-800'
      case 'income':
        return 'bg-green-100 text-green-800'
      case 'risk':
        return 'bg-red-100 text-red-800'
      case 'general':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTemplateSelect = (template: BusinessLogicTemplate) => {
    setSelectedTemplate(template)
    onTemplateSelect?.(template)
  }

  const handleTestLogic = async () => {
    if (!selectedTemplate) return

    try {
      const result = await WorkflowBusinessLogicService.executeBusinessLogic(
        selectedTemplate.id,
        testData as ApplicantData
      )
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Test Logic</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3 text-sm">Business Logic Templates</h3>
            <div className="space-y-2">
              {businessLogicTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium line-clamp-1">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getCategoryColor(template.category)}`}
                      >
                        {template.category}
                      </Badge>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Required Fields:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.requiredFields.map(field => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4">
          {selectedTemplate ? (
            <div>
              <h3 className="font-semibold mb-3 text-sm">Test Business Logic</h3>
              
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">{selectedTemplate.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Test with sample data
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-3 space-y-3">
                  <div className="grid gap-2">
                    <div>
                      <label className="text-xs font-medium">Credit Score</label>
                      <input
                        type="number"
                        value={testData.creditScore || ''}
                        onChange={(e) => setTestData(prev => ({ 
                          ...prev, 
                          creditScore: parseInt(e.target.value) || 0 
                        }))}
                        className="w-full px-2 py-1 text-xs border rounded"
                        min="300"
                        max="850"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium">Income</label>
                      <input
                        type="number"
                        value={testData.income || ''}
                        onChange={(e) => setTestData(prev => ({ 
                          ...prev, 
                          income: parseInt(e.target.value) || 0 
                        }))}
                        className="w-full px-2 py-1 text-xs border rounded"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium">Debt-to-Income Ratio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testData.debtToIncomeRatio || ''}
                        onChange={(e) => setTestData(prev => ({ 
                          ...prev, 
                          debtToIncomeRatio: parseFloat(e.target.value) || 0 
                        }))}
                        className="w-full px-2 py-1 text-xs border rounded"
                        min="0"
                        max="1"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={handleTestLogic}
                  >
                    Test Logic
                  </Button>
                  
                  {testResult && (
                    <div className="mt-3">
                      <label className="text-xs font-medium">Result:</label>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">Select a business logic template to test</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}