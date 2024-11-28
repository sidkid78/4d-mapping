import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdvancedAIEngineInterface() {
  const [query, setQuery] = useState('')
  const [expertiseLevel, setExpertiseLevel] = useState('intermediate')
  const [result, setResult] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'advanced-ai-engine',
          data: { query, expertiseLevel }
        }),
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error:', error)
      setResult('Error processing query')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced AI Engine Interface</CardTitle>
        <CardDescription>Submit queries to the Advanced AI Engine</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Query</Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query here"
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
          <Button type="submit">Submit Query</Button>
        </form>
        {result && (
          <div className="mt-4 space-y-2">
            <Label>Result</Label>
            <Textarea value={result} readOnly rows={10} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}