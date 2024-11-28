import React, { useState } from 'react'
import { RegulationManager } from './regulation-manager'
import { WorkflowManager } from './workflow-manager'
import { DatabaseManagement } from './database-management'
import { AdvancedAIEngineInterface } from './advanced-ai-engine-interface'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AdvancedOrchestrator() {
  const [activeTab, setActiveTab] = useState('ai-engine')

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Orchestrator</CardTitle>
          <CardDescription>Manage regulations, workflows, and AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ai-engine">AI Engine</TabsTrigger>
              <TabsTrigger value="regulations">Regulations</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
            </TabsList>
            <TabsContent value="ai-engine">
              <AdvancedAIEngineInterface />
            </TabsContent>
            <TabsContent value="regulations">
              <RegulationManager />
            </TabsContent>
            <TabsContent value="workflows">
              <WorkflowManager />
            </TabsContent>
            <TabsContent value="database">
              <DatabaseManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}