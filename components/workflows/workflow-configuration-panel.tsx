/**
 * Workflow Configuration Panel Component
 * Focused component for managing workflow configurations
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowConfigurationManager } from "@/lib/config/workflow-config"
import type { WorkflowConfiguration, RuleSet, ConfigurableRule } from "@/lib/config/workflow-config"

interface WorkflowConfigurationPanelProps {
  selectedConfiguration: string
  onConfigurationChange: (configId: string) => void
  className?: string
}

export function WorkflowConfigurationPanel({ 
  selectedConfiguration, 
  onConfigurationChange, 
  className = "" 
}: WorkflowConfigurationPanelProps) {
  const [editingRule, setEditingRule] = useState<ConfigurableRule | null>(null)
  
  const configurations = WorkflowConfigurationManager.getAllConfigurations()
  const currentConfig = WorkflowConfigurationManager.loadConfiguration(selectedConfiguration)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'credit':
        return 'bg-blue-100 text-blue-800'
      case 'income':
        return 'bg-green-100 text-green-800'
      case 'debt':
        return 'bg-orange-100 text-orange-800'
      case 'risk':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOperatorSymbol = (operator: string) => {
    switch (operator) {
      case '>=': return '≥'
      case '<=': return '≤'
      case '>': return '>'
      case '<': return '<'
      case '==': return '='
      case '!=': return '≠'
      default: return operator
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="font-semibold mb-3 text-sm">Configuration</h3>
        
        <select 
          value={selectedConfiguration}
          onChange={(e) => onConfigurationChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
        >
          {configurations.map(config => (
            <option key={config.id} value={config.id}>
              {config.name} (v{config.version})
            </option>
          ))}
        </select>
      </div>

      {currentConfig && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">{currentConfig.name}</CardTitle>
                <CardDescription className="text-xs">
                  {currentConfig.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Version:</span>
                    <div className="text-muted-foreground">{currentConfig.version}</div>
                  </div>
                  <div>
                    <span className="font-medium">Rule Sets:</span>
                    <div className="text-muted-foreground">{currentConfig.ruleSets.length}</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-xs">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentConfig.metadata.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs">
                  <span className="font-medium">Last Updated:</span>
                  <div className="text-muted-foreground">
                    {new Date(currentConfig.metadata.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rules" className="space-y-4">
            <div className="space-y-3">
              {currentConfig.ruleSets.map(ruleSet => (
                <Card key={ruleSet.id}>
                  <CardHeader className="p-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{ruleSet.name}</CardTitle>
                      <Badge 
                        variant={ruleSet.enabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {ruleSet.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {ruleSet.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-3 space-y-2">
                    <div className="text-xs">
                      <span className="font-medium">Mode:</span>
                      <span className="ml-2 text-muted-foreground">
                        {ruleSet.mode.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="font-medium text-xs">Rules:</span>
                      {ruleSet.rules.map(rule => (
                        <div 
                          key={rule.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-muted-foreground">
                              {rule.field} {getOperatorSymbol(rule.operator)} {rule.value} → {rule.action}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getCategoryColor(rule.category)}`}
                            >
                              {rule.category}
                            </Badge>
                            <Badge 
                              variant={rule.enabled ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {rule.enabled ? "On" : "Off"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}