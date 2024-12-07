import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function WorkflowManager() {
  const [workflow, setWorkflow] = useState({ name: '', steps: '', analysis: '' })
  const [expertiseLevel, setExpertiseLevel] = useState('intermediate')

  const handleAnalyzeWorkflow = async () => {
    try {
      const response = await fetch('/api/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'workflow-manager',
          data: {
            action: 'analyze',
            workflow: {
              name: workflow.name,
              steps: workflow.steps
            },
            expertiseLevel
          }
        }),
      })
      const data = await response.json()
      setWorkflow(prev => ({ ...prev, analysis: data.analysis }))
    } catch (error) {
      console.error('Error analyzing workflow:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Manager</CardTitle>
        <CardDescription>Create and analyze workflows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Workflow Name</Label>
          <Input
            id="name"
            value={workflow.name}
            onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter workflow name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="steps">Workflow Steps</Label>
          <Textarea
            id="steps"
            value={workflow.steps}
            onChange={(e) => setWorkflow(prev => ({ ...prev, steps: e.target.value }))}
            placeholder="Enter workflow steps"
            rows={5}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expertiseLevel">Expertise Level</Label>
          <Select value={expertiseLevel} onValueChange={setExpertiseLevel}>
            <SelectTrigger id="expertiseLevel">
              <SelectValue placeholder="Select expertise level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAnalyzeWorkflow}>Analyze Workflow</Button>
        {workflow.analysis && (
          <div className="space-y-2">
            <Label>Analysis Result</Label>
            <Textarea value={workflow.analysis} readOnly rows={5} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}