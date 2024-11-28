'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function AoTQueryInterface() {
  const [query, setQuery] = useState('')
  const [context, setContext] = useState({
    user_role: '',
    expertise_level: 1,
    industry: '',
    region: '',
    request_priority: 'medium'
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/aot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
          },
        }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error processing AoT query:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="query">Query</Label>
          <Textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your regulatory query here..."
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="user_role">User Role</Label>
            <Input
              id="user_role"
              value={context.user_role}
              onChange={(e) => setContext({ ...context, user_role: e.target.value })}
              placeholder="e.g., Compliance Officer"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="expertise_level">Expertise Level</Label>
            <Select
              value={context.expertise_level.toString()}
              onValueChange={(value) => setContext({ ...context, expertise_level: parseInt(value) })}
            >
              <SelectTrigger id="expertise_level">
                <SelectValue placeholder="Select expertise level" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={context.industry}
              onChange={(e) => setContext({ ...context, industry: e.target.value })}
              placeholder="e.g., Finance"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={context.region}
              onChange={(e) => setContext({ ...context, region: e.target.value })}
              placeholder="e.g., North America"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="request_priority">Request Priority</Label>
            <Select
              value={context.request_priority}
              onValueChange={(value) => setContext({ ...context, request_priority: value })}
            >
              <SelectTrigger id="request_priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Submit Query'}
        </Button>
      </form>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>AoT Query Result</CardTitle>
            <CardDescription>Processed by Algorithm of Thought</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}