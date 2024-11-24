'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RAGQueryInterface() {
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Submit Query'}
        </Button>
      </form>
      {queryResult && (
        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-2">Response:</h3>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <p>{queryResult}</p>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}