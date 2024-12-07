'use client'

import RegulatorySpaceVisualizer from './regulatory-space-visualizer'

export function VisualizerWrapper() { 
  return (
    <RegulatorySpaceVisualizer 
      regulations={[]}
      onRegulationSelect={(regulation) => {
        console.log('Selected regulation:', regulation)
      }}
    />
  )
} 