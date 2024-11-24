'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, ArrowUpCircle, BarChart2, CheckCircle, FileText, Shield, PenToolIcon as Tool, BookOpen } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RegulationManager from './regulation-manager'
import FederalRegisterSearch from './federal-register-search'

type WorkflowResult = {
  status: string;
  details: string;
  timestamp: string;
} | null;

export function AdvancedOrchestratorUI() {
  const [activeTab, setActiveTab] = useState('workflows')
  const [activeWorkflow, setActiveWorkflow] = useState<string>('')
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult>(null)
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<string | null>(null)

  const triggerWorkflow = async (workflow: string) => {
    setActiveWorkflow(workflow)
    setTimeout(() => {
      setWorkflowResult({
        status: 'completed',
        details: `${workflow} completed successfully`,
        timestamp: new Date().toISOString()
      })
    }, 2000)
  }

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, userContext: { expertise_level: 3 } }),
      })
      const data = await response.json()
      setQueryResult(data.response)
    } catch (error) {
      console.error('Error processing query:', error)
      setQueryResult('An error occurred while processing your query.')
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold text-[#1E90FF] mb-8 text-center">Advanced Orchestrator Dashboard</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">
            <Tool className="w-4 h-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="regulations">
            <Shield className="w-4 h-4 mr-2" />
            Regulation Manager
          </TabsTrigger>
          <TabsTrigger value="federal-register">
            <FileText className="w-4 h-4 mr-2" />
            Federal Register
          </TabsTrigger>
          <TabsTrigger value="rag">
            <BookOpen className="w-4 h-4 mr-2" />
            RAG Query
          </TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-[#1E90FF]/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="w-5 h-5 mr-2 text-[#1E90FF]" />
                  Analytics Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => triggerWorkflow('analytics')} className="w-full">
                  {activeWorkflow === 'analytics' ? (
                    <ArrowUpCircle className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Run Analytics
                </Button>
              </CardContent>
            </Card>
            <Card className="border-[#1E90FF]/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-[#1E90FF]" />
                  Validation Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => triggerWorkflow('validation')} className="w-full">
                  {activeWorkflow === 'validation' ? (
                    <ArrowUpCircle className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Run Validation
                </Button>
              </CardContent>
            </Card>
          </div>
          {workflowResult && (
            <Card className="mt-4 border-[#1E90FF]/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Workflow Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p><span className="font-semibold">Status:</span> {workflowResult.status}</p>
                <p><span className="font-semibold">Details:</span> {workflowResult.details}</p>
                <p><span className="font-semibold">Time:</span> {new Date(workflowResult.timestamp).toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
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
              <form onSubmit={handleQuerySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query">Enter your query:</Label>
                  <Input
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type your question here..."
                  />
                </div>
                <Button type="submit">Submit Query</Button>
              </form>
              {queryResult && (
                <div className="mt-4">
                  <h3 className="font-semibold text-lg mb-2">Response:</h3>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <p>{queryResult}</p>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}