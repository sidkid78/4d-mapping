'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, ArrowUpCircle, BarChart2, CheckCircle, FileText, Shield, PenToolIcon as Tool } from 'lucide-react'

type WorkflowResult = {
  status: string;
  details: string;
  timestamp: string;
} | null;

export default function WorkflowManager() {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-[#1E90FF]/10">
        <CardContent className="space-y-3 pt-6">
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
        <CardContent className="pt-6">
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
      <Card className="border-[#1E90FF]/10 md:col-span-2">
        <CardContent className="pt-6">
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <h3 className="font-semibold">Workflow Details</h3>
            <ul className="list-disc pl-5 mt-2">
              <li>AI Analysis of Update</li>
              <li>Update Knowledge Base</li>
              <li>Generate Impact Report</li>
              <li>Create Visualizations</li>
              <li>Trigger Compliance Checks</li>
              <li>Schedule Necessary Maintenance</li>
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}