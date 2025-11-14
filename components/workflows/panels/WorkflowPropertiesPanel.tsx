'use client'

import React, { useState, useCallback } from 'react'
import { WorkflowNode, WorkflowConnection } from '@/lib/types/unified-workflow'
import { cn } from '@/lib/utils'
import { 
  Settings, 
  Tag, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  X,
  Plus,
  Trash2
} from 'lucide-react'

// Define the condition interface
interface ConnectionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: string
  type: 'string' | 'number' | 'boolean'
}

export interface WorkflowPropertiesPanelProps {
  selectedNode?: WorkflowNode
  selectedConnection?: WorkflowConnection
  onUpdateNode?: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onUpdateConnection?: (connectionId: string, updates: Partial<WorkflowConnection>) => void
  onDeleteNode?: (nodeId: string) => void
  onDeleteConnection?: (connectionId: string) => void
  className?: string
  mode?: 'simple' | 'enhanced' | 'advanced'
}

export function WorkflowPropertiesPanel({
  selectedNode,
  selectedConnection,
  onUpdateNode,
  onUpdateConnection,
  onDeleteNode,
  onDeleteConnection,
  className,
  mode = 'enhanced'
}: WorkflowPropertiesPanelProps) {
  const [localNodeData, setLocalNodeData] = useState<Partial<WorkflowNode>>({})
  const [localConnectionData, setLocalConnectionData] = useState<Partial<WorkflowConnection>>({})

  // Helper function to get conditions as array
  const getConditionsArray = (conditions?: Record<string, string> | string): ConnectionCondition[] => {
    if (!conditions) return []
    
    // If it's a string, treat it as a single condition
    if (typeof conditions === 'string') {
      return [{
        field: 'default',
        operator: 'equals',
        value: conditions,
        type: 'string'
      }]
    }
    
    // If it's a Record, convert to ConnectionCondition array
    return Object.entries(conditions).map(([field, value]) => ({
      field,
      operator: 'equals' as const,
      value: value,
      type: 'string' as const
    }))
  }

  const handleNodeUpdate = useCallback((field: string, value: any) => {
    if (!selectedNode || !onUpdateNode) return
    
    // Handle nested data properties
    if (field === 'label' || field === 'description') {
      const updates = { 
        data: { 
          ...selectedNode.data, 
          [field]: value 
        } 
      }
      setLocalNodeData(prev => ({ ...prev, ...updates }))
      onUpdateNode(selectedNode.id, updates)
    } else if (field === 'timeout' || field === 'retryCount' || field === 'parallel') {
      // Handle config properties
      const updates = { 
        data: { 
          ...selectedNode.data, 
          config: {
            ...selectedNode.data.config,
            [field]: value
          }
        } 
      }
      setLocalNodeData(prev => ({ ...prev, ...updates }))
      onUpdateNode(selectedNode.id, updates)
    } else {
      const updates = { [field]: value }
      setLocalNodeData(prev => ({ ...prev, ...updates }))
      onUpdateNode(selectedNode.id, updates)
    }
  }, [selectedNode, onUpdateNode])

  const handleConnectionUpdate = useCallback((field: string, value: any) => {
    if (!selectedConnection || !onUpdateConnection) return
    
    const updates = { [field]: value }
    setLocalConnectionData(prev => ({ ...prev, ...updates }))
    onUpdateConnection(selectedConnection.id, updates)
  }, [selectedConnection, onUpdateConnection])

  const addCondition = useCallback(() => {
    if (!selectedConnection || !onUpdateConnection) return
    
    const currentConditions = selectedConnection.conditions
    const conditionsArray = getConditionsArray(currentConditions)

    const newCondition: ConnectionCondition = {
      field: '',
      operator: 'equals',
      value: '',
      type: 'string'
    }

    const newConditionsArray = [...conditionsArray, newCondition]
    const record = Object.fromEntries(
      newConditionsArray
        .filter(c => c.field)
        .map(c => [c.field, c.value])
    )

    handleConnectionUpdate('conditions', record)
  }, [selectedConnection, onUpdateConnection, handleConnectionUpdate])

  const removeCondition = useCallback((index: number) => {
    if (!selectedConnection || !onUpdateConnection) return
    
    const currentConditions = selectedConnection.conditions
    const conditionsArray = getConditionsArray(currentConditions)
    
    const newConditionsArray = conditionsArray.filter((_, i) => i !== index)
    const record = Object.fromEntries(
      newConditionsArray
        .filter(c => c.field)
        .map(c => [c.field, c.value])
    )

    handleConnectionUpdate('conditions', record)
  }, [selectedConnection, onUpdateConnection, handleConnectionUpdate])

  const updateCondition = useCallback(<K extends keyof ConnectionCondition>(
    index: number,
    key: K,
    value: ConnectionCondition[K]
  ) => {
    if (!selectedConnection || !onUpdateConnection) return

    const currentConditions = selectedConnection.conditions
    const conditionsArray = getConditionsArray(currentConditions)

    const next = [...conditionsArray]
    const current = next[index]

    const updated: ConnectionCondition = {
      ...current,
      [key]: value,
    } as ConnectionCondition

    next[index] = updated

    const record = Object.fromEntries(
      next
        .filter(c => c.field)
        .map(c => [c.field, c.value])
    )

    handleConnectionUpdate('conditions', record)
  }, [selectedConnection, onUpdateConnection, handleConnectionUpdate])

  if (!selectedNode && !selectedConnection) {
    return (
      <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
        <div className="p-4 text-center text-gray-500">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a node or connection to view properties</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {selectedNode ? 'Node Properties' : 'Connection Properties'}
          </h3>
          {(selectedNode || selectedConnection) && (
            <button
              onClick={() => {
                if (selectedNode && onDeleteNode) {
                  onDeleteNode(selectedNode.id)
                } else if (selectedConnection && onDeleteConnection) {
                  onDeleteConnection(selectedConnection.id)
                }
              }}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Node Properties */}
        {selectedNode && (
          <>
            {/* Basic Properties */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={localNodeData.data?.label ?? selectedNode.data.label}
                  onChange={(e) => handleNodeUpdate('label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Node label"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={(localNodeData.data?.description ?? selectedNode.data.description) || ''}
                  onChange={(e) => handleNodeUpdate('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Node description"
                  rows={3}
                />
              </div>

              {mode !== 'simple' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 capitalize">
                      {selectedNode.type}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Properties */}
            {mode === 'advanced' && (
              <>
                <hr className="border-gray-200" />
                
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Advanced Settings
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={(localNodeData.data?.config?.timeout ?? selectedNode.data.config?.timeout) || ''}
                      onChange={(e) => handleNodeUpdate('timeout', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="No timeout"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Retry Count
                    </label>
                    <input
                      type="number"
                      value={(localNodeData.data?.config?.retryCount ?? selectedNode.data.config?.retryCount) || ''}
                      onChange={(e) => handleNodeUpdate('retryCount', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="No retries"
                      min="0"
                      max="10"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="parallel"
                      checked={(localNodeData.data?.config?.parallel ?? selectedNode.data.config?.parallel) || false}
                      onChange={(e) => handleNodeUpdate('parallel', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="parallel" className="text-xs text-gray-700">
                      Allow parallel execution
                    </label>
                  </div>
                </div>
              </>
            )}


          </>
        )}

        {/* Connection Properties */}
        {selectedConnection && (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={(localConnectionData.label ?? selectedConnection.label) || ''}
                  onChange={(e) => handleConnectionUpdate('label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Connection label"
                />
              </div>

              {mode !== 'simple' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={(localConnectionData.type ?? selectedConnection.type) || 'default'}
                    onChange={(e) => handleConnectionUpdate('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="default">Default</option>
                    <option value="conditional">Conditional</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              )}
            </div>

            {/* Conditions */}
            {mode === 'advanced' && (
              <>
                <hr className="border-gray-200" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Conditions
                    </h4>
                    <button
                      onClick={addCondition}
                      className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                      title="Add condition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {getConditionsArray(selectedConnection.conditions).map((condition: ConnectionCondition, index: number) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">
                          Condition {index + 1}
                        </span>
                        <button
                          onClick={() => removeCondition(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={condition.field}
                          onChange={(e) => updateCondition(index, 'field', e.target.value)}
                          placeholder="Field"
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, 'operator', e.target.value as ConnectionCondition['operator'])}
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                          <option value="contains">Contains</option>
                        </select>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, 'value', e.target.value)}
                          placeholder="Value"
                          className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  ))}

                  {(!selectedConnection.conditions || selectedConnection.conditions.length === 0) && (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No conditions defined
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}