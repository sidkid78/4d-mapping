"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Camera, Settings, AlertCircle, Search, X } from 'lucide-react'
import { LineChart, XAxis, YAxis, Tooltip, Line, ResponsiveContainer } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'


interface NodeDetailsProps {
  node: any;
  onClose: () => void;
}

interface Edge {
  source: number;
  target: number;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface KnowledgeGraphViewerProps {
  data: GraphData;
  expertiseLevel: number;
  onNodeSelect: (node: GraphData['nodes'][0]) => void;
}

interface UserData {
  name: string;
  role: string;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NodeDetails: React.FC<NodeDetailsProps> = ({ node, onClose }) => {
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

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, onClick }) => {
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

const recentUpdates = [
  {
    id: 1,
    title: "FAR Update 2024-01",
    description: "New cybersecurity requirements for federal contractors"
  },
  {
    id: 2,
    title: "DFARS Change Notice",
    description: "Updated compliance requirements for defense contracts"
  }
]

const graphData = {
  nodes: [
    { id: 1, title: "Cybersecurity", domain: "IT", expertiseLevel: 3, description: "Cybersecurity measures for federal contractors" },
    { id: 2, title: "Contract Compliance", domain: "Legal", expertiseLevel: 4, description: "Compliance requirements for defense contracts" },
  ],
  edges: [
    { source: 1, target: 2 }
  ]
}

const complianceData = [
  { date: '2023-01', complianceRate: 85 },
  { date: '2023-02', complianceRate: 88 },
  { date: '2023-03', complianceRate: 92 },
  { date: '2023-04', complianceRate: 90 },
  { date: '2023-05', complianceRate: 95 },
]

interface Node {
  id: number;
  title: string;
  domain: string;
  expertiseLevel: number;
  description: string;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [expertiseLevel, setExpertiseLevel] = useState(1)
  const [activeNavItem, setActiveNavItem] = useState('explorer')
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      // Simulating API call
      const data = { name: "John Doe", role: "Compliance Officer" }
      setUserData(data)
    }
    fetchUserData()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw nodes
    graphData.nodes.forEach((node, index) => {
      const x = (index + 1) * (width / (graphData.nodes.length + 1))
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

    // Draw edges
    ctx.strokeStyle = 'hsl(var(--muted-foreground))'
    graphData.edges.forEach(edge => {
      const sourceNode = graphData.nodes.find(node => node.id === edge.source)
      const targetNode = graphData.nodes.find(node => node.id === edge.target)
      if (!sourceNode || !targetNode) return;

      const sourceIndex = graphData.nodes.indexOf(sourceNode)
      const targetIndex = graphData.nodes.indexOf(targetNode)

      const sourceX = (sourceIndex + 1) * (width / (graphData.nodes.length + 1))
      const sourceY = height / 2
      const targetX = (targetIndex + 1) * (width / (graphData.nodes.length + 1))
      const targetY = height / 2


      ctx.beginPath()
      ctx.moveTo(sourceX, sourceY)
      ctx.lineTo(targetX, targetY)
      ctx.stroke()
    })
  }, [expertiseLevel])

  const handleClick = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    graphData.nodes.forEach((node, index) => {
      const nodeX = (index + 1) * (canvas.width / (graphData.nodes.length + 1));
      const nodeY = canvas.height / 2;

      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (distance <= 20) {
        setSelectedNode(node);
      }
    });
  }, [graphData.nodes]);

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
              {recentUpdates.map((update) => (
                <Alert key={update.id}>
                  <AlertTitle>{update.title}</AlertTitle>
                  <AlertDescription>{update.description}</AlertDescription>
                </Alert>
              ))}
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

const KnowledgeGraphViewer: React.FC<KnowledgeGraphViewerProps> = ({ data, expertiseLevel, onNodeSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleNodeClick = useCallback((node: GraphData['nodes'][0]) => {
    onNodeSelect(node);
  }, [onNodeSelect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw nodes
    data.nodes.forEach((node, index) => {
      const x = (index + 1) * (width / (data.nodes.length + 1));
      const y = height / 2;

      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = node.expertiseLevel <= expertiseLevel ? 'hsl(var(--primary))' : 'hsl(var(--muted))';
      ctx.fill();

      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.title, x, y);
    });

    // Draw edges
    ctx.strokeStyle = 'hsl(var(--muted-foreground))';
    data.edges.forEach(edge => {
      const sourceNode = data.nodes.find(node => node.id === edge.source);
      const targetNode = data.nodes.find(node => node.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const sourceIndex = data.nodes.indexOf(sourceNode);
      const targetIndex = data.nodes.indexOf(targetNode);

      const sourceX = (sourceIndex + 1) * (width / (data.nodes.length + 1));
      const sourceY = height / 2;
      const targetX = (targetIndex + 1) * (width / (data.nodes.length + 1));
      const targetY = height / 2;

      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
    });
  }, [data, expertiseLevel]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};