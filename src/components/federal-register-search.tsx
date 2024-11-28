'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function FederalRegisterSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/federal-register?query=${encodeURIComponent(searchTerm)}`)
      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error('Error searching Federal Register:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Federal Register Search</CardTitle>
        <CardDescription>Search the Federal Register for relevant regulations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Label htmlFor="search">Search Term</Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search terms..."
            />
          </div>
          <Button 
            onClick={handleSearch}
            className="mt-8"
          >
            Search
          </Button>
        </div>
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result: any) => (
              <Card key={result.id}>
                <CardContent className="pt-4">
                  <h3 className="font-semibold">{result.title}</h3>
                  <p className="text-sm text-muted-foreground">{result.abstract}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FederalRegisterSearch;
