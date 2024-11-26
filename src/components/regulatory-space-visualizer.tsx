'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RegulatoryNode {
  id: string
  position: [number, number, number, number]
  color: string
  size: number
  domain: string
  expertise: string 
  status: string
  hierarchyLevel: number
  importance: number
  complexity: number
}

interface RegulatorySpaceVisualizerProps {
  data?: RegulatoryNode[]
  onNodeClick?: (nodeId: string) => void
}

export const RegulatorySpaceVisualizer: React.FC<RegulatorySpaceVisualizerProps> = ({ 
  data: externalData,
  onNodeClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [colorScheme, setColorScheme] = useState<string>('domain')
  const [sizeScheme, setSizeScheme] = useState<string>('level')
  const [data, setData] = useState<RegulatoryNode[]>(externalData || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scene, setScene] = useState<THREE.Scene | null>(null)
  const [nodeObjects, setNodeObjects] = useState<THREE.Mesh[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visualizer/data')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const result = await response.json()
        setData(result)
      } catch {
        setError('Failed to load visualizer data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getColorForScheme = (node: RegulatoryNode, scheme: string): string => {
    const colorMaps = {
      domain: {
        'financial': '#FF0000',
        'healthcare': '#00FF00', 
        'technology': '#0000FF',
        'default': '#CCCCCC'
      },
      expertise: {
        'beginner': '#90EE90',
        'intermediate': '#FFD700',
        'expert': '#FF4500',
        'default': '#CCCCCC'
      },
      status: {
        'active': '#32CD32',
        'pending': '#FFD700',
        'archived': '#A9A9A9',
        'default': '#CCCCCC'
      }
    }

    const selectedMap = colorMaps[scheme as keyof typeof colorMaps]
    return selectedMap[node[scheme as keyof RegulatoryNode] as keyof typeof selectedMap] || selectedMap.default
  }

  const getSizeForScheme = (node: RegulatoryNode, scheme: string): number => {
    switch(scheme) {
      case 'level':
        return 0.1 + (node.hierarchyLevel * 0.05)
      case 'importance':
        return 0.1 + (node.importance * 0.05)
      case 'complexity':
        return 0.1 + (node.complexity * 0.05)
      default:
        return 0.2
    }
  }

  const updateVisualization = () => {
    if (!scene || !nodeObjects.length) return

    nodeObjects.forEach((object, index) => {
      const node = data[index]
      const material = object.material as THREE.MeshBasicMaterial
      material.color.set(getColorForScheme(node, colorScheme))
      
      const newSize = getSizeForScheme(node, sizeScheme)
      object.scale.set(newSize, newSize, newSize)
    })
  }

  useEffect(() => {
    if (!containerRef.current || loading || error) return

    const container = containerRef.current
    const newScene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer()

    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    camera.position.z = 5

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const newNodeObjects: THREE.Mesh[] = []

    data.forEach((node) => {
      const geometry = new THREE.SphereGeometry(getSizeForScheme(node, sizeScheme), 32, 32)
      const material = new THREE.MeshBasicMaterial({ color: getColorForScheme(node, colorScheme) })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(node.position[0], node.position[1], node.position[2])
      sphere.userData.id = node.id
      newScene.add(sphere)
      newNodeObjects.push(sphere)
    })

    setScene(newScene)
    setNodeObjects(newNodeObjects)

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(newScene, camera)
    }

    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    const handleClick = (event: MouseEvent) => {
      event.preventDefault()
      if (!containerRef.current) return

      mouse.x = (event.clientX / containerRef.current.clientWidth) * 2 - 1
      mouse.y = -(event.clientY / containerRef.current.clientHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(newNodeObjects)

      if (intersects.length > 0) {
        const clickedNode = intersects[0].object
        onNodeClick?.(clickedNode.userData.id)
      }
    }

    window.addEventListener('resize', handleResize)
    renderer.domElement.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('click', handleClick)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [data, loading, error, colorScheme, sizeScheme])

  const handleColorSchemeChange = (value: string) => {
    setColorScheme(value)
    updateVisualization()
  }

  const handleSizeSchemeChange = (value: string) => {
    setSizeScheme(value)
    updateVisualization()
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <Card className="w-full h-[600px]">
      <CardHeader>
        <CardTitle>Regulatory Space Visualizer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-4">
          <Select onValueChange={handleColorSchemeChange} value={colorScheme}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Color Scheme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="domain">Domain</SelectItem>
              <SelectItem value="expertise">Expertise</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={handleSizeSchemeChange} value={sizeScheme}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Size Scheme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="level">Hierarchy Level</SelectItem>
              <SelectItem value="importance">Importance</SelectItem>
              <SelectItem value="complexity">Complexity</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => console.log('Reset view')}>Reset View</Button>
        </div>
        <div ref={containerRef} className="w-full h-[500px]" />
      </CardContent>
    </Card>
  )
}