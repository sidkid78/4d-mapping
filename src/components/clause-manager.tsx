'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle, FileText, Search } from 'lucide-react'

interface ClauseData {
  nuremberg_number: string;
  original_reference: string;
  original_name: string;
  content: string;
  effective_date: string;
  domain: string;
  level: number;
  coordinates: number[];
  related_regulations: { regulation_id: string; relationship: string }[];
  ai_personas: string[];
}

interface AnalysisResult {
  analysis: any;
  validation: any;
  recommendations: any;
  timestamp: string;
}

export default function ClauseManager() {
  const [clauseData, setClauseData] = useState<ClauseData>({
    nuremberg_number: '',
    original_reference: '',
    original_name: '',
    content: '',
    effective_date: '',
    domain: '',
    level: 1,
    coordinates: [0, 0, 0, 0],
    related_regulations: [],
    ai_personas: []
  })
  const [createdClauseId, setCreatedClauseId] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClauseData({ ...clauseData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setClauseData({ ...clauseData, [name]: value })
  }

  const handleCreateClause = async () => {
    setLoading('create')
    setError(null)
    try {
      const response = await fetch('/api/clauses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clauseData),
      })
      if (!response.ok) throw new Error('Failed to create clause')
      const result = await response.json()
      setCreatedClauseId(result.clause_id)
    } catch (_error) {
      setError('Failed to create clause')
    } finally {
      setLoading(null)
    }
  }

  const handleAnalyzeClause = async () => {
    if (!createdClauseId) {
      setError('Please create a clause first')
      return
    }
    setLoading('analyze')
    setError(null)
    try {
      const response = await fetch(`/api/clauses/${createdClauseId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'legal_analyst' }),
      })
      if (!response.ok) throw new Error('Failed to analyze clause')
      const result = await response.json()
      setAnalysisResult(result)
    } catch (_err) {
      setError('Failed to analyze clause')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Clause Manager</CardTitle>
        <CardDescription>Create and analyze acquisition clauses</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Clause</TabsTrigger>
            <TabsTrigger value="analyze">Analyze Clause</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nuremberg_number">Nuremberg Number</Label>
                <Input
                  id="nuremberg_number"
                  name="nuremberg_number"
                  value={clauseData.nuremberg_number}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="original_reference">Original Reference</Label>
                <Input
                  id="original_reference"
                  name="original_reference"
                  value={clauseData.original_reference}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="original_name">Original Name</Label>
              <Input
                id="original_name"
                name="original_name"
                value={clauseData.original_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={clauseData.content}
                onChange={handleInputChange}
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  name="effective_date"
                  type="date"
                  value={clauseData.effective_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select onValueChange={(value) => handleSelectChange('domain', value)}>
                  <SelectTrigger id="domain">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acquisition">Acquisition</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateClause} disabled={loading === 'create'}>
              {loading === 'create' ? 'Creating...' : 'Create Clause'}
            </Button>
          </TabsContent>
          <TabsContent value="analyze" className="space-y-4">
            {createdClauseId ? (
              <>
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Clause Created</AlertTitle>
                  <AlertDescription>
                    Clause ID: {createdClauseId}
                  </AlertDescription>
                </Alert>
                <Button onClick={handleAnalyzeClause} disabled={loading === 'analyze'}>
                  {loading === 'analyze' ? 'Analyzing...' : 'Analyze Clause'}
                </Button>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Clause Created</AlertTitle>
                <AlertDescription>
                  Please create a clause first before analyzing.
                </AlertDescription>
              </Alert>
            )}
            {analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Result</CardTitle>
                  <CardDescription>Timestamp: {analysisResult.timestamp}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">Analysis:</h4>
                        <pre className="text-sm">{JSON.stringify(analysisResult.analysis, null, 2)}</pre>
                      </div>
                      <div>
                        <h4 className="font-semibold">Validation:</h4>
                        <pre className="text-sm">{JSON.stringify(analysisResult.validation, null, 2)}</pre>
                      </div>
                      <div>
                        <h4 className="font-semibold">Recommendations:</h4>
                        <pre className="text-sm">{JSON.stringify(analysisResult.recommendations, null, 2)}</pre>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}