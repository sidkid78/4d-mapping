'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from 'lucide-react'

interface FederalRegisterDocument {
  title: string
  document_number: string
  publication_date: string
}

export default function FederalRegisterSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FederalRegisterDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/federal-register?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }
      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error('Search error:', error)
      setError('An error occurred while fetching results. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Federal Register Search</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Enter search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : <Search className="w-4 h-4 mr-2" />}
            Search
          </Button>
        </form>

        {error && (
          <div className="text-red-500 mb-4" role="alert">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Document Number</TableHead>
                <TableHead>Publication Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((doc) => (
                <TableRow key={doc.document_number}>
                  <TableCell>{doc.title}</TableCell>
                  <TableCell>{doc.document_number}</TableCell>
                  <TableCell>{new Date(doc.publication_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {results.length === 0 && !loading && !error && (
          <p className="text-center text-gray-500">No results found. Try a different search query.</p>
        )}
      </CardContent>
    </Card>
  )
}