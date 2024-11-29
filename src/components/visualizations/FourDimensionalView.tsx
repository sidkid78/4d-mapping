'use client'

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DimensionControls } from '../../lib/dimension-controls';
import Stats from 'three/examples/jsm/libs/stats.module';

interface Node4D {
  id: string;
  coordinates: { x: number; y: number; z: number; e: number };
  category: string;
  relevance: number;
}

interface FourDimensionalViewProps {
  nodes: Node4D[];
  edges: Array<{
    source: string;
    target: string;
    weight: number;
  }>;
  onNodeClick?: (node: Node4D) => void;
  onEdgeClick?: (edge: { source: Node4D; target: Node4D; weight: number }) => void;
}

export function FourDimensionalView({ nodes, edges, onNodeClick, onEdgeClick }: FourDimensionalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const dimensionControlsRef = useRef<DimensionControls>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const nodeObjectsRef = useRef<THREE.Object3D[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });

    // Setup controls
    controlsRef.current = new OrbitControls(cameraRef.current, renderer.domElement);
    dimensionControlsRef.current = new DimensionControls(cameraRef.current, renderer.domElement);

    // Rest of the setup...

    function onMouseMove(event: MouseEvent) {
      if (!cameraRef.current || !nodeObjectsRef.current) return;
      // ... mouse move logic
    }

    // ... rest of the component
  }, [nodes, edges, onNodeClick, onEdgeClick]);

  return (
    <div className="relative w-full h-[600px]">
      <div ref={containerRef} className="w-full h-full" />
      {/* ... UI elements */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <button className="btn btn-sm" onClick={() => dimensionControlsRef.current?.resetView()}>
          Reset View
        </button>
        <button className="btn btn-sm" onClick={() => dimensionControlsRef.current?.toggleDimension()}>
          Toggle 4D
        </button>
      </div>
    </div>
  );
}

function getCategoryColor(category: string): number {
  const colors: Record<string, number> = {
    legal: 0xff0000,
    financial: 0x00ff00,
    compliance: 0x0000ff
  };
  return colors[category] || 0xcccccc;
} 