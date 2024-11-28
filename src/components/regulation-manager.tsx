'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RegulationManager() {
  const [regulation, setRegulation] = useState({ title: '', content: '', analysis: '' })

  const handleAnalyze = async () => {
    try {
      const response = await fetch('/api/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'regulation-manager',
          data: {
            action: 'analyze',
            regulation: {
              title: regulation.title,
              content: regulation.content
            }
          }
        }),
      })
      const data = await response.json()
      setRegulation(prev => ({ ...prev, analysis: data.analysis }))
    } catch (error) {
      console.error('Error analyzing regulation:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regulation Manager</CardTitle>
        <CardDescription>Add and analyze regulations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Regulation Title</Label>
          <Input
            id="title"
            value={regulation.title}
            onChange={(e) => setRegulation(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter regulation title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Regulation Content</Label>
          <Textarea
            id="content"
            value={regulation.content}
            onChange={(e) => setRegulation(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Enter regulation content"
            rows={5}
          />
        </div>
        <Button onClick={handleAnalyze}>Analyze Regulation</Button>
        {regulation.analysis && (
          <div className="space-y-2">
            <Label>Analysis Result</Label>
            <Textarea value={regulation.analysis} readOnly rows={5} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}