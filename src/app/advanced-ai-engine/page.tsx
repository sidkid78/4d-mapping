'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ExplanationNode } from '@/lib/advanced_ai_engine'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

interface Visualization {
  title: string;
  figure: {
    data: any[];
    layout: Record<string, any>;
  };
}

interface AIResponse {
  response: {
    content: string;
    confidence_score: number;
    persona_contributions: Record<string, number>;
    evidence: Array<Record<string, any>>;
    visualizations?: Visualization[];
  };
  explanationTree: ExplanationNode;
  confidenceScore: number;
}

export default function AdvancedAIEnginePage() {
  const [query, setQuery] = useState('')
  const [expertiseLevel, setExpertiseLevel] = useState('intermediate')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/advanced-ai-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, expertiseLevel }),
      })
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Advanced AI Engine</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <Label htmlFor="query">Query</Label>
          <Input
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your complex query here"
            className="w-full"
          />
        </div>
        <div>
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Submit Query'}
        </Button>
      </form>

      {response && response.response && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>Analysis results and visualizations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
                <TabsTrigger value="explanation">Explanation Tree</TabsTrigger>
              </TabsList>
              <TabsContent value="content">
                <div className="prose max-w-none">
                  <h3>Analysis</h3>
                  <p>{response?.response?.content || 'No content available'}</p>
                  <h3>Confidence Score</h3>
                  <p>{(response?.confidenceScore || 0).toFixed(2)}</p>
                  <h3>Persona Contributions</h3>
                  <ul>
                    {(Object.entries(response?.response?.persona_contributions || {}) as [string, number][]).map(([persona, weight]) => (
                      <li key={persona}>
                        {persona}: {(weight * 100).toFixed(1)}%
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="visualizations">
                {response?.response.visualizations?.map((viz: Visualization, index: number) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{viz.title}</h3>
                    <Plot
                      data={viz.figure.data}
                      layout={viz.figure.layout}
                      config={{ responsive: true }}
                      style={{ width: '100%', height: '400px' }}
                    />
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="explanation">
                <ExplanationTree node={response.explanationTree} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Update the ExplanationTree component
function ExplanationTree({ node }: { node: ExplanationNode }) {
  if (!node) return null;

  // Only use subSteps since that's the property in ExplanationNode type
  const steps = Array.isArray(node.subSteps) ? node.subSteps : [];

  return (
    <div className="ml-4">
      <div className="flex items-center">
        {node.confidence >= 0.7 ? (
          <CheckCircle2 className="text-green-500 mr-2" />
        ) : (
          <AlertCircle className="text-yellow-500 mr-2" />
        )}
        <strong>{node.step}</strong>
      </div>
      <p className="ml-6">{node.reasoning}</p>
      <p className="ml-6 text-sm text-gray-500">
        Confidence: {node.confidence.toFixed(2)}
      </p>
      {node.evidence?.length > 0 && (
        <div className="ml-6">
          <strong>Evidence:</strong>
          <ul className="list-disc list-inside">
            {node.evidence.map((ev: { content: string }, index: number) => (
              <li key={index}>{ev.content}</li>
            ))}
          </ul>
        </div>
      )}
      {steps.length > 0 && (
        <div className="ml-6">
          {steps.map((subStep, index) => (
            <ExplanationTree key={index} node={subStep} />
          ))}
        </div>
      )}
    </div>
  );
}