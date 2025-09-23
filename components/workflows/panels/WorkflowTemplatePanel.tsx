'use client'

import React, { useState } from 'react'
import { WorkflowTemplate } from '@/lib/types/workflow'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  Download, 
  Star, 
  Clock, 
  Users, 
  Search,
  Filter,
  Plus,
  Eye
} from 'lucide-react'

export interface WorkflowTemplatePanelProps {
  templates: WorkflowTemplate[]
  onLoadTemplate: (template: WorkflowTemplate) => void
  onSaveAsTemplate?: (name: string, description: string) => void
  className?: string
  mode?: 'simple' | 'enhanced' | 'advanced'
}

const sampleTemplates: WorkflowTemplate[] = [
  {
    id: 'approval-workflow',
    name: 'Approval Workflow',
    description: 'Standard approval process with multiple reviewers',
    category: 'business',
    tags: ['approval', 'review', 'business'],
    nodes: [],
    connections: [],
    metadata: {
      author: 'System',
      version: '1.0',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      usageCount: 45
    }
  },
  {
    id: 'data-processing',
    name: 'Data Processing Pipeline',
    description: 'ETL workflow for data transformation and validation',
    category: 'data',
    tags: ['etl', 'data', 'processing'],
    nodes: [],
    connections: [],
    metadata: {
      author: 'Data Team',
      version: '2.1',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
      usageCount: 23
    }
  },
  {
    id: 'notification-system',
    name: 'Notification System',
    description: 'Multi-channel notification workflow with fallbacks',
    category: 'communication',
    tags: ['notification', 'email', 'sms'],
    nodes: [],
    connections: [],
    metadata: {
      author: 'DevOps',
      version: '1.5',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-18'),
      usageCount: 67
    }
  },
  {
    id: 'error-handling',
    name: 'Error Handling Pattern',
    description: 'Comprehensive error handling with retry logic',
    category: 'system',
    tags: ['error', 'retry', 'resilience'],
    nodes: [],
    connections: [],
    metadata: {
      author: 'Platform Team',
      version: '1.0',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-12'),
      usageCount: 12
    }
  }
]

const categoryColors = {
  business: 'bg-blue-50 border-blue-200 text-blue-700',
  data: 'bg-green-50 border-green-200 text-green-700',
  communication: 'bg-purple-50 border-purple-200 text-purple-700',
  system: 'bg-orange-50 border-orange-200 text-orange-700',
  custom: 'bg-gray-50 border-gray-200 text-gray-700'
}

export function WorkflowTemplatePanel({
  templates,
  onLoadTemplate,
  onSaveAsTemplate,
  className,
  mode = 'enhanced'
}: WorkflowTemplatePanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')

  // Combine provided templates with sample templates
  const allTemplates = [...templates, ...sampleTemplates]

  // Filter templates
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(allTemplates.map(t => t.category)))]

  const handleSaveTemplate = () => {
    if (newTemplateName.trim() && onSaveAsTemplate) {
      onSaveAsTemplate(newTemplateName.trim(), newTemplateDescription.trim())
      setNewTemplateName('')
      setNewTemplateDescription('')
      setShowSaveDialog(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Workflow Templates</h3>
          {onSaveAsTemplate && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
              title="Save current workflow as template"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        {mode !== 'simple' && (
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Templates List */}
      <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No templates found</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={cn(
                'p-3 border rounded-lg cursor-pointer transition-all duration-200',
                'hover:shadow-md hover:border-blue-300',
                categoryColors[template.category as keyof typeof categoryColors] || categoryColors.custom
              )}
              onClick={() => onLoadTemplate(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {template.name}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onLoadTemplate(template)
                    }}
                    className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                    title="Load template"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  {mode === 'advanced' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Preview functionality could be added here
                      }}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                      title="Preview template"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              {template.tags.length > 0 && mode !== 'simple' && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white bg-opacity-60 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="px-2 py-0.5 bg-white bg-opacity-60 text-xs rounded-full">
                      +{template.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Metadata */}
              {mode === 'advanced' && template.metadata && (
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{template.metadata.usageCount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(template.metadata.updatedAt)}</span>
                    </span>
                  </div>
                  <span>v{template.metadata.version}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Save as Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {mode === 'advanced' && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>Templates:</span>
              <span className="font-medium">{filteredTemplates.length} of {allTemplates.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}