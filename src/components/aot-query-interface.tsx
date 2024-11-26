'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AoTQueryInterface() {
  const [query, setQuery] = React.useState('')
  const [response, setResponse] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/aot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'An error occurred')
      setResponse(data.response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process query')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Enter your query..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="min-h-[100px]"
      />
      <Button 
        onClick={handleSubmit}
        disabled={loading || !query.trim()}
        className="w-full"
      >
        {loading ? 'Processing...' : 'Submit Query'}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {response && (
        <div className="mt-4 p-4 bg-muted rounded-md">
          <pre className="whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  )
}