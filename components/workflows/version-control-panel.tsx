"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  GitBranch, 
  Clock, 
  User, 
  Tag, 
  Plus, 
  Eye, 
  RotateCcw, 
  GitCompare,
  Download,
  Upload,
  Save,
  AlertTriangle
} from 'lucide-react'

interface WorkflowVersion {
  id: string
  version: string
  name: string
  description: string
  createdAt: Date
  createdBy: string
  status: 'draft' | 'published' | 'archived'
  changes: string[]
  isActive: boolean
  workflowData: any
}

interface VersionControlPanelProps {
  workflowId: string
  currentVersion?: WorkflowVersion
  onVersionChange?: (version: WorkflowVersion) => void
  onCreateVersion?: (versionData: Partial<WorkflowVersion>) => void
}

export function VersionControlPanel({ 
  workflowId, 
  currentVersion, 
  onVersionChange, 
  onCreateVersion 
}: VersionControlPanelProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([
    {
      id: 'v1',
      version: '1.0.0',
      name: 'Initial Release',
      description: 'First version of the workflow with basic approval logic',
      createdAt: new Date('2024-01-15'),
      createdBy: 'John Doe',
      status: 'published',
      changes: ['Initial workflow creation', 'Added approval nodes', 'Configured basic rules'],
      isActive: false,
      workflowData: {}
    },
    {
      id: 'v2',
      version: '1.1.0',
      name: 'Enhanced Rules',
      description: 'Added advanced risk assessment and fraud detection',
      createdAt: new Date('2024-01-20'),
      createdBy: 'Jane Smith',
      status: 'published',
      changes: ['Added fraud detection rules', 'Enhanced risk scoring', 'Updated decision thresholds'],
      isActive: false,
      workflowData: {}
    },
    {
      id: 'v3',
      version: '1.2.0',
      name: 'Current Version',
      description: 'Latest improvements with data source integrations',
      createdAt: new Date('2024-01-25'),
      createdBy: 'Mike Johnson',
      status: 'published',
      changes: ['Added external data sources', 'Improved performance', 'Bug fixes'],
      isActive: true,
      workflowData: {}
    }
  ])

  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [newVersionData, setNewVersionData] = useState({
    name: '',
    description: '',
    version: ''
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCompareDialog, setShowCompareDialog] = useState(false)

  const handleCreateVersion = () => {
    const newVersion: WorkflowVersion = {
      id: `v${versions.length + 1}`,
      version: newVersionData.version || `1.${versions.length}.0`,
      name: newVersionData.name,
      description: newVersionData.description,
      createdAt: new Date(),
      createdBy: 'Current User',
      status: 'draft',
      changes: ['Created from current workflow state'],
      isActive: false,
      workflowData: {}
    }

    setVersions([...versions, newVersion])
    onCreateVersion?.(newVersion)
    setNewVersionData({ name: '', description: '', version: '' })
    setShowCreateDialog(false)
  }

  const handleRestoreVersion = (version: WorkflowVersion) => {
    const updatedVersions = versions.map(v => ({
      ...v,
      isActive: v.id === version.id
    }))
    setVersions(updatedVersions)
    onVersionChange?.(version)
  }

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      setShowCompareDialog(true)
    }
  }

  const getStatusColor = (status: WorkflowVersion['status']) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Version Control</h3>
          <p className="text-sm text-muted-foreground">
            Manage workflow versions and track changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompareVersions}
            disabled={selectedVersions.length !== 2}
          >
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Version</DialogTitle>
                <DialogDescription>
                  Create a new version of this workflow with your current changes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="version">Version Number</Label>
                  <Input
                    id="version"
                    placeholder="e.g., 1.3.0"
                    value={newVersionData.version}
                    onChange={(e) => setNewVersionData(prev => ({ ...prev, version: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Version Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Enhanced Security Update"
                    value={newVersionData.name}
                    onChange={(e) => setNewVersionData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the changes in this version..."
                    value={newVersionData.description}
                    onChange={(e) => setNewVersionData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVersion}>
                  Create Version
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="versions" className="w-full">
        <TabsList>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {versions.map((version) => (
                <Card key={version.id} className={`${version.isActive ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedVersions.includes(version.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVersions(prev => [...prev, version.id].slice(-2))
                            } else {
                              setSelectedVersions(prev => prev.filter(id => id !== version.id))
                            }
                          }}
                          className="rounded"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{version.name}</CardTitle>
                            <Badge variant="outline">{version.version}</Badge>
                            <Badge className={getStatusColor(version.status)}>
                              {version.status}
                            </Badge>
                            {version.isActive && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            {version.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        {!version.isActive && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Restore Version</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to restore to version {version.version}? 
                                  This will replace your current workflow with this version.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRestoreVersion(version)}>
                                  Restore
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.createdBy}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(version.createdAt)}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Changes:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {version.changes.map((change, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Branches
              </CardTitle>
              <CardDescription>
                Manage workflow branches for parallel development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">main</div>
                    <div className="text-sm text-muted-foreground">Production branch</div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">feature/enhanced-rules</div>
                    <div className="text-sm text-muted-foreground">Development branch</div>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
              <CardDescription>
                Mark important versions with tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">v1.0.0-stable</div>
                    <div className="text-sm text-muted-foreground">First stable release</div>
                  </div>
                  <Badge variant="outline">Stable</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">v1.2.0-production</div>
                    <div className="text-sm text-muted-foreground">Current production version</div>
                  </div>
                  <Badge variant="default">Production</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Version Comparison Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              View differences between selected versions
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            {selectedVersions.slice(0, 2).map((versionId, index) => {
              const version = versions.find(v => v.id === versionId)
              if (!version) return null
              
              return (
                <div key={versionId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{version.version}</Badge>
                    <span className="font-medium">{version.name}</span>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Created:</span> {formatDate(version.createdAt)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">By:</span> {version.createdBy}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Status:</span> 
                          <Badge className={`ml-2 ${getStatusColor(version.status)}`}>
                            {version.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Changes:</span>
                          <ul className="mt-1 space-y-1">
                            {version.changes.map((change, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}