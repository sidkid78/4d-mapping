import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DatabaseManagement() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('')
  const [operation, setOperation] = useState('select')

  const handleExecuteQuery = async () => {
    try {
      const response = await fetch('/api/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'database-management',
          data: {
            action: 'execute',
            operation,
            query
          }
        }),
      })
      const data = await response.json()
      setResult(data.result)
    } catch (error) {
      console.error('Error executing database query:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Management</CardTitle>
        <CardDescription>Execute and analyze database operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="operation">Operation Type</Label>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger id="operation">
              <SelectValue placeholder="Select operation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select">SELECT</SelectItem>
              <SelectItem value="insert">INSERT</SelectItem>
              <SelectItem value="update">UPDATE</SelectItem>
              <SelectItem value="delete">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="query">Database Query</Label>
          <Textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your database query"
            rows={5}
          />
        </div>
        <Button onClick={handleExecuteQuery}>Execute and Analyze Query</Button>
        {result && (
          <div className="space-y-2">
            <Label>Result and Analysis</Label>
            <Textarea value={result} readOnly rows={5} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}