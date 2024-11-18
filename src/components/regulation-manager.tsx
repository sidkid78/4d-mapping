'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, FileText, LinkIcon } from 'lucide-react'

type Regulation = {
  regulation_id: string
  nuremberg_number: string
  name: string
  content: string
  crosswalks: Array<{
    related_id: string
    related_name: string
    relationship_type: string
  }>
}

export default function RegulationManager() {
  const [activeTab, setActiveTab] = useState('create')
  const [regulationData, setRegulationData] = useState<Regulation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateRegulation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const regulationData = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/regulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(regulationData),
      })

      if (!response.ok) {
        throw new Error('Failed to create regulation')
      }

      const result = await response.json()
      setRegulationData(result)
      setActiveTab('view')
    } catch (error) {
      setError('Failed to create regulation. Please try again.')
      console.error('Error creating regulation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCrosswalk = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const crosswalkData = Object.fromEntries(formData.entries())

    try {
      const response = await fetch('/api/crosswalks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(crosswalkData),
      })

      if (!response.ok) {
        throw new Error('Failed to create crosswalk')
      }

      // Refresh regulation data
      await fetchRegulation(crosswalkData.source_id as string)
    } catch (error) {
      setError('Failed to create crosswalk. Please try again.')
      console.error('Error creating crosswalk:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegulation = async (regulationId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/regulations/${regulationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch regulation')
      }

      const result = await response.json()
      setRegulationData(result)
      setActiveTab('view')
    } catch (error) {
      setError('Failed to fetch regulation. Please try again.')
      console.error('Error fetching regulation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold text-[#1E90FF] mb-8 text-center">Regulation Manager</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Create Regulation
          </TabsTrigger>
          <TabsTrigger value="crosswalk" className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Create Crosswalk
          </TabsTrigger>
          <TabsTrigger value="view">View Regulation</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Create New Regulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRegulation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nuremberg_number">Nuremberg Number</Label>
                    <Input id="nuremberg_number" name="nuremberg_number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_reference">Original Reference</Label>
                  <Input id="original_reference" name="original_reference" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sam_tag">SAM Tag</Label>
                  <Input id="sam_tag" name="sam_tag" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input id="level" name="level" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input id="domain" name="domain" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="effective_date">Effective Date</Label>
                    <Input id="effective_date" name="effective_date" type="date" required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Regulation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="crosswalk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Create Crosswalk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCrosswalk} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source_id">Source Regulation ID</Label>
                  <Input id="source_id" name="source_id" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_id">Target Regulation ID</Label>
                  <Input id="target_id" name="target_id" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crosswalk_type">Crosswalk Type</Label>
                  <Input id="crosswalk_type" name="crosswalk_type" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Crosswalk'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>View Regulation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regulation_id">Regulation ID</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="regulation_id"
                      placeholder="Enter Regulation ID"
                      value={regulationData?.regulation_id || ''}
                      onChange={(e) => setRegulationData({ ...regulationData, regulation_id: e.target.value } as Regulation)}
                    />
                    <Button onClick={() => fetchRegulation(regulationData?.regulation_id || '')} disabled={loading}>
                      Fetch
                    </Button>
                  </div>
                </div>
                {regulationData && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Nuremberg Number</h3>
                      <p>{regulationData.nuremberg_number}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Name</h3>
                      <p>{regulationData.name}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Content</h3>
                      <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        <p>{regulationData.content}</p>
                      </ScrollArea>
                    </div>
                    <div>
                      <h3 className="font-semibold">Crosswalks</h3>
                      {regulationData && regulationData.crosswalks && regulationData.crosswalks.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {regulationData.crosswalks.map((crosswalk, index) => (
                            <li key={index}>
                              {crosswalk.related_name} ({crosswalk.relationship_type})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No crosswalks found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}