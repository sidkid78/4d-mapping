'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface QueryResponse {
  response: string
}

interface QueryPayload {
  query: string
  userContext: {
    expertise_level: number
  }
}

export function RAGQueryInterface() {
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleQuerySubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const payload: QueryPayload = {
      query,
      userContext: { expertise_level: 3 }
    }

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json() as QueryResponse
      setQueryResult(data.response)
    } catch (error) {
      console.error('Error processing query:', error)
      setQueryResult('An error occurred while processing your query.')
    } finally {
      setIsLoading(false)
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
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Submit Query'}
        </Button>
      </form>

      {queryResult && (
        <section className="mt-4">
          <h3 className="font-semibold text-lg mb-2">Response:</h3>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <p className="whitespace-pre-wrap">{queryResult}</p>
          </ScrollArea>
        </section>
      )}
    </div>
  )
}