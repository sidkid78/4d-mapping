'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RegulationManager from '@/components/regulation-manager'
import FederalRegisterSearch from '@/components/federal-register-search'
import WorkflowManager from '@/components/workflow-manager'
import { RAGQueryInterface } from '@/components/rag-query-interface'
import DatabaseManagement from '@/components/database-management'
import ClauseManager from '@/components/clause-manager'
import { RegulatorySpaceVisualizer } from '@/components/regulatory-space-visualizer'
import { AoTQueryInterface } from "@/components/aot-query-interface"
import { LlamaIndexChat } from "@/components/llamaindex-chat"

export default function AdvancedOrchestratorUI() {
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold text-[#1E90FF] mb-8 text-center">Advanced Orchestrator Dashboard</h1>
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="regulations">Regulation Manager</TabsTrigger>
          <TabsTrigger value="federal-register">Federal Register</TabsTrigger>
          <TabsTrigger value="rag">RAG Query</TabsTrigger>
          <TabsTrigger value="database">Database Management</TabsTrigger>
          <TabsTrigger value="clauses">Clause Manager</TabsTrigger>
          <TabsTrigger value="visualizer">4D Visualizer</TabsTrigger>
          <TabsTrigger value="aot">AoT Query</TabsTrigger>
          <TabsTrigger value="llamaindex">LlamaIndex Chat</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Workflow Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="regulations">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Regulation Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <RegulationManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="federal-register">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Federal Register Search</CardTitle>
            </CardHeader>
            <CardContent>
              <FederalRegisterSearch />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rag">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">RAG Query</CardTitle>
            </CardHeader>
            <CardContent>
              <RAGQueryInterface />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="database">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Database Management</CardTitle>
            </CardHeader>
            <CardContent>
              <DatabaseManagement />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clauses">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Clause Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <ClauseManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="visualizer">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">4D Regulatory Space Visualizer</CardTitle>
            </CardHeader>
            <CardContent>
              <RegulatorySpaceVisualizer />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="aot">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Algorithm of Thought Query</CardTitle>
            </CardHeader>
            <CardContent>
              <AoTQueryInterface />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="llamaindex">
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">LlamaIndex Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <LlamaIndexChat />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}