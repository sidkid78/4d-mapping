import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import styles from './regulatory-space-visualizer.module.css'

interface Regulation {
  id: string
  coordinates: [number, number, number, number]
  metadata: {
    title: string
    domain: string
    impact_level: number
    complexity: number
    effective_date: string
  }
}

interface RegulatorySpaceVisualizerProps {
  regulations: Regulation[]
  onRegulationSelect: (regulation: Regulation) => void
}

const RegulationNode: React.FC<{ regulation: Regulation; onClick: () => void }> = ({ regulation, onClick }) => {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <group position={[regulation.coordinates[0], regulation.coordinates[1], regulation.coordinates[2]]}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
      </mesh>
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.05}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {regulation.metadata.title}
      </Text>
    </group>
  )
}

export function RegulatorySpaceVisualizer({ regulations, onRegulationSelect }: RegulatorySpaceVisualizerProps) {
  return (
    <div className={styles.container}>
      <Canvas camera={{ position: [5, 5, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {regulations.map((regulation) => (
          <RegulationNode
            key={regulation.id}
            regulation={regulation}
            onClick={() => onRegulationSelect(regulation)}
          />
        ))}
      </Canvas>
    </div>
  )
}

export default RegulatorySpaceVisualizer