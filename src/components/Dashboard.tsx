"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Camera, Settings, AlertCircle, Search, X, ExternalLink } from 'lucide-react'
import { LineChart, XAxis, YAxis, Tooltip, Line, ResponsiveContainer } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}

const NavItem = ({ icon, label, active = false, onClick }: NavItemProps) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`w-full justify-start ${
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  )
}

interface FederalRegisterEntry {
  id: string
  title: string
  abstract: string
  document_number: string
  html_url: string
  publication_date: string
  type: string
  agency_names: string[]
}

interface UserData {
  name: string
  role: string
}

interface GraphNode {
  id: number
  title: string
  domain: string
  expertiseLevel: number
  description: string
}

interface GraphEdge {
  source: number
  target: number
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface KnowledgeGraphViewerProps {
  data: GraphData
  expertiseLevel: number
  onNodeSelect: (node: GraphNode) => void
}

interface NodeDetailsProps {
  node: GraphNode
  onClose: () => void
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [expertiseLevel, setExpertiseLevel] = useState(1)
  const [activeNavItem, setActiveNavItem] = useState('explorer')
  const [recentUpdates, setRecentUpdates] = useState<FederalRegisterEntry[]>([])
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(true)
  const [updateError, setUpdateError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchUserData = async () => {
      // Simulating API call
      const data = { name: "John Doe", role: "Compliance Officer" }
      setUserData(data)
    }
    fetchUserData()
  }, [])

  useEffect(() => {
    const fetchRecentUpdates = async () => {
      setIsLoadingUpdates(true)
      setUpdateError(null)
      try {
        const response = await fetch('/api/federal-register/recent')
        if (!response.ok) {
          throw new Error('Failed to fetch updates')
        }
        const data = await response.json()
        setRecentUpdates(data.results || [])
      } catch (error) {
        console.error('Error fetching recent updates:', error)
        setUpdateError('Failed to load regulatory updates')
        setRecentUpdates([])
      } finally {
        setIsLoadingUpdates(false)
      }
    }

    fetchRecentUpdates()
  }, [])

  interface ComplianceDataPoint {
    date: string
    complianceRate: number
  }

  const complianceData: ComplianceDataPoint[] = [
    { date: '2023-01', complianceRate: 85 },
    { date: '2023-02', complianceRate: 88 },
    { date: '2023-03', complianceRate: 92 },
    { date: '2023-04', complianceRate: 90 },
    { date: '2023-05', complianceRate: 95 },
  ]

  const graphData: GraphData = {
    nodes: [
      { id: 1, title: "Cybersecurity", domain: "IT", expertiseLevel: 3, description: "Cybersecurity measures for federal contractors" },
      { id: 2, title: "Contract Compliance", domain: "Legal", expertiseLevel: 4, description: "Compliance requirements for defense contracts" },
    ],
    edges: [
      { source: 1, target: 2 }
    ]
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r">
        <div className="p-4">
          <h2 className="text-lg font-semibold">4D Knowledge Framework</h2>
          <div className="mt-4 space-y-2">
            <NavItem 
              icon={<Search className="w-4 h-4" />} 
              label="Knowledge Explorer" 
              active={activeNavItem === 'explorer'}
              onClick={() => setActiveNavItem('explorer')}
            />
            <NavItem 
              icon={<AlertCircle className="w-4 h-4" />} 
              label="Compliance" 
              active={activeNavItem === 'compliance'}
              onClick={() => setActiveNavItem('compliance')}
            />
            <NavItem 
              icon={<Settings className="w-4 h-4" />} 
              label="Settings" 
              active={activeNavItem === 'settings'}
              onClick={() => setActiveNavItem('settings')}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complianceData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="complianceRate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Regulatory Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingUpdates ? (
                // Loading skeleton
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              ) : updateError ? (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              ) : recentUpdates.length > 0 ? (
                recentUpdates.map((update) => (
                  <Alert key={update.id}>
                    <AlertTitle className="flex items-center justify-between">
                      <span>{update.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6"
                        asChild
                      >
                        <a 
                          href={update.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="text-sm text-muted-foreground">
                        {update.abstract}
                      </div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {update.agency_names.map((agency, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                          >
                            {agency}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Published on {new Date(update.publication_date).toLocaleDateString()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              ) : (
                <Alert>
                  <AlertTitle>No Updates Available</AlertTitle>
                  <AlertDescription>
                    There are no recent regulatory updates to display.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Graph</CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeGraphViewer
              data={graphData}
              expertiseLevel={expertiseLevel}
              onNodeSelect={setSelectedNode}
            />
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Expertise Level: {expertiseLevel}
              </label>
              <Slider
                min={1}
                max={6}
                step={1}
                value={[expertiseLevel]}
                onValueChange={(value) => setExpertiseLevel(value[0])}
              />
            </div>
          </CardContent>
        </Card>
      </main>

      {selectedNode && (
        <aside className="w-96 border-l p-4">
          <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
        </aside>
      )}
    </div>
  )
}

const KnowledgeGraphViewer = ({ data, expertiseLevel, onNodeSelect }: KnowledgeGraphViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    data.nodes.forEach((node, index) => {
      const x = (index + 1) * (width / (data.nodes.length + 1))
      const y = height / 2

      ctx.beginPath()
      ctx.arc(x, y, 20, 0, 2 * Math.PI)
      ctx.fillStyle = node.expertiseLevel <= expertiseLevel ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
      ctx.fill()

      ctx.fillStyle = 'hsl(var(--foreground))'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.title, x, y)
    })

    ctx.strokeStyle = 'hsl(var(--muted-foreground))'
    data.edges.forEach(edge => {
      const sourceNode = data.nodes.find(node => node.id === edge.source)
      const targetNode = data.nodes.find(node => node.id === edge.target)
      
      if (!sourceNode || !targetNode) return
      
      const sourceIndex = data.nodes.indexOf(sourceNode)
      const targetIndex = data.nodes.indexOf(targetNode)

      const sourceX = (sourceIndex + 1) * (width / (data.nodes.length + 1))
      const sourceY = height / 2
      const targetX = (targetIndex + 1) * (width / (data.nodes.length + 1))
      const targetY = height / 2

      ctx.beginPath()
      ctx.moveTo(sourceX, sourceY)
      ctx.lineTo(targetX, targetY)
      ctx.stroke()
    })
  }, [data, expertiseLevel])

  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    data.nodes.forEach((node, index) => {
      const nodeX = (index + 1) * (canvas.width / (data.nodes.length + 1))
      const nodeY = canvas.height / 2

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2)
      if (distance <= 20) {
        onNodeSelect(node)
      }
    })
  }, [data, onNodeSelect])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      onClick={handleClick}
      className="w-full h-64 border rounded"
    />
  )
}

const NodeDetails = ({ node, onClose }: NodeDetailsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{node.title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Domain: {node.domain}</p>
        <p className="text-sm text-muted-foreground">
          Expertise Level: {node.expertiseLevel}
        </p>
        <p className="mt-4">{node.description}</p>
      </div>
    </div>
  )
}