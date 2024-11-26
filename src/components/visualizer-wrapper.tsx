'use client'

import { RegulatorySpaceVisualizer } from './regulatory-space-visualizer'

export function VisualizerWrapper() {
  const handleNodeClick = (nodeId: string) => {
    console.log(`Clicked node: ${nodeId}`)
  }

  return (
    <RegulatorySpaceVisualizer 
      data={[]} // TODO: Fetch actual data
      onNodeClick={handleNodeClick}
    />
  )
} 