'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, ArrowUpCircle, BarChart2, CheckCircle, FileText, Shield, PenToolIcon as Tool } from 'lucide-react'

type WorkflowResult = {
  status: string;
  details: string;
  timestamp: string;
} | null;

export default function AdvancedOrchestratorUI() {
  const [activeWorkflow, setActiveWorkflow] = useState<string>('')
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult>(null)

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
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-[#1E90FF] mb-4">Advanced Orchestrator Dashboard</h1>
        <p className="text-lg text-muted-foreground">Manage and monitor your system operations with ease</p>
      </div>
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
      <Card className="mt-6 border-[#1E90FF]/10">
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
            {/* Content for each tab remains the same as before */}
            {/* Previous TabsContent components here */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}