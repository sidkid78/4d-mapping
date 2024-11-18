'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, ArrowUpCircle, BarChart2, CheckCircle, FileText, Shield, PenToolIcon as Tool, BookOpen } from 'lucide-react'
import RegulationManager from './regulation-manager'

type WorkflowResult = {
  status: string;
  details: string;
  timestamp: string;
} | null;

export default function AdvancedOrchestratorUI() {
  const [activeTab, setActiveTab] = useState('workflows')
  const [activeWorkflow, setActiveWorkflow] = useState<string>('')
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult>(null)
  const [showDocumentation, setShowDocumentation] = useState(false)

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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#1E90FF]">Advanced Orchestrator Dashboard</h1>
        <Button
          variant="ghost"
          onClick={() => setShowDocumentation(!showDocumentation)}
          className="flex items-center gap-2 text-[#1E90FF]"
        >
          <BookOpen className="h-5 w-5" />
          Documentation
        </Button>
      </div>

      {showDocumentation && (
        <Card className="mb-8 border-[#1E90FF]/10">
          <CardHeader>
            <CardTitle className="text-[#1E90FF]">Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md">
              <div className="space-y-4">
                <section>
                  <h3 className="font-semibold mb-2">Getting Started</h3>
                  <p>Welcome to the Advanced Orchestrator Dashboard. This tool helps you manage workflows and regulations efficiently.</p>
                </section>
                <section>
                  <h3 className="font-semibold mb-2">Workflows</h3>
                  <p>Select from various workflow types including regulatory updates, system upgrades, and more. Monitor their progress in real-time.</p>
                </section>
                <section>
                  <h3 className="font-semibold mb-2">Regulation Management</h3>
                  <p>Use the Regulation Manager tab to handle compliance requirements and maintain regulatory documentation.</p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="regulations">Regulation Manager</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#1E90FF]/10">
              <CardHeader>
                <CardTitle className="text-[#1E90FF]">Workflow Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { id: 'regulatoryUpdate', icon: FileText, label: 'Regulatory Update' },
                  { id: 'systemUpgrade', icon: ArrowUpCircle, label: 'System Upgrade' },
                  { id: 'incidentResponse', icon: AlertCircle, label: 'Incident Response' },
                  { id: 'dataMigration', icon: Shield, label: 'Data Migration' },
                  { id: 'maintenanceAndReporting', icon: Tool, label: 'Maintenance & Reporting' },
                  { id: 'aiAnalysisAndVisualization', icon: BarChart2, label: 'AI Analysis & Visualization' },
                  { id: 'complianceAndBackup', icon: CheckCircle, label: 'Compliance & Backup' },
                ].map((workflow) => (
                  <Button
                    key={workflow.id}
                    onClick={() => triggerWorkflow(workflow.id)}
                    className="w-full bg-white hover:bg-[#1E90FF] hover:text-white transition-colors"
                    style={{ borderColor: '#1E90FF', color: activeWorkflow === workflow.id ? '#FFA500' : '#1E90FF' }}
                    disabled={activeWorkflow === workflow.id}
                    variant="outline"
                  >
                    <workflow.icon className="mr-2 h-4 w-4" />
                    {workflow.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card className="border-[#1E90FF]/10">
              <CardHeader>
                <CardTitle className="text-[#1E90FF]">Workflow Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px] flex items-center justify-center">
                  {activeWorkflow ? (
                    workflowResult ? (
                      <div className="space-y-2">
                        <p><strong className="text-[#1E90FF]">Status:</strong> {workflowResult.status}</p>
                        <p><strong className="text-[#1E90FF]">Details:</strong> {workflowResult.details}</p>
                        <p><strong className="text-[#1E90FF]">Timestamp:</strong> {workflowResult.timestamp}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Processing {activeWorkflow}...</p>
                    )
                  ) : (
                    <p className="text-muted-foreground">No active workflow</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="border-[#1E90FF]/10">
            <CardHeader>
              <CardTitle className="text-[#1E90FF]">Workflow Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="regulatoryUpdate">
                <TabsList className="w-full justify-start overflow-x-auto">
                  {[
                    'Regulatory Update',
                    'System Upgrade',
                    'Incident Response',
                    'Data Migration',
                    'Maintenance & Reporting',
                    'AI Analysis & Visualization',
                    'Compliance & Backup'
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.toLowerCase().replace(/ /g, '')}
                      value={tab.toLowerCase().replace(/ /g, '')}
                      className="data-[state=active]:text-[#FFA500]"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="regulatoryupdate">
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    <h3 className="font-semibold">Regulatory Update Workflow</h3>
                    <ul className="list-disc pl-5">
                      <li>AI Analysis of Update</li>
                      <li>Update Knowledge Base</li>
                      <li>Generate Impact Report</li>
                      <li>Create Visualizations</li>
                      <li>Trigger Compliance Checks</li>
                      <li>Schedule Necessary Maintenance</li>
                    </ul>
                  </ScrollArea>
                </TabsContent>
                {/* Add similar TabsContent for other workflows */}
              </Tabs>
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
      </Tabs>
    </div>
  )
}