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
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const statsRef = useRef<Stats>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0xf0f0f0);
    
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current.position.z = 5;

    rendererRef.current = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(rendererRef.current.domElement);

    // Setup controls
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    dimensionControlsRef.current = new DimensionControls(cameraRef.current, rendererRef.current.domElement);

    // Setup stats
    statsRef.current = new Stats();
    containerRef.current.appendChild(statsRef.current.dom);

    // Create nodes
    nodeObjectsRef.current = nodes.map(node => {
      const geometry = new THREE.SphereGeometry(node.relevance * 0.1 + 0.1);
      const material = new THREE.MeshPhongMaterial({ 
        color: getCategoryColor(node.category),
        opacity: 0.8,
        transparent: true
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.coordinates.x, node.coordinates.y, node.coordinates.z);
      mesh.userData = { nodeId: node.id };
      sceneRef.current?.add(mesh);
      return mesh;
    });

    // Create edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const points = [
        new THREE.Vector3(sourceNode.coordinates.x, sourceNode.coordinates.y, sourceNode.coordinates.z),
        new THREE.Vector3(targetNode.coordinates.x, targetNode.coordinates.y, targetNode.coordinates.z)
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0x999999,
        opacity: edge.weight,
        transparent: true
      });
      const line = new THREE.Line(geometry, material);
      sceneRef.current?.add(line);
    });

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    sceneRef.current?.add(ambientLight, pointLight);

    function onMouseMove(event: MouseEvent) {
      if (!cameraRef.current || !nodeObjectsRef.current || !rendererRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(nodeObjectsRef.current);
      
      if (intersects.length > 0) {
        const hoveredNodeId = intersects[0].object.userData.nodeId;
        setHoveredNode(hoveredNodeId);
        containerRef.current!.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        containerRef.current!.style.cursor = 'default';
      }
    }

    function onClick(event: MouseEvent) {
      if (!cameraRef.current || !nodeObjectsRef.current || !rendererRef.current || !onNodeClick) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(nodeObjectsRef.current);
      
      if (intersects.length > 0) {
        const clickedNodeId = intersects[0].object.userData.nodeId;
        const clickedNode = nodes.find(n => n.id === clickedNodeId);
        if (clickedNode) {
          onNodeClick(clickedNode);
          setSelectedNode(clickedNodeId);
        }
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      
      if (statsRef.current) statsRef.current.update();
      if (controlsRef.current) controlsRef.current.update();
      // Remove the update() call since it doesn't exist on DimensionControls
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }

    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onClick);
    animate();

    function handleResize() {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeEventListener('mousemove', onMouseMove);
      containerRef.current?.removeEventListener('click', onClick);
      containerRef.current?.removeChild(rendererRef.current!.domElement);
      containerRef.current?.removeChild(statsRef.current!.dom);
    };
  }, [nodes, edges, onNodeClick, onEdgeClick]);

  return (
    <div className="relative w-full h-[600px]">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-4 right-4 bg-white/80 p-2 rounded shadow">
        <h3 className="text-sm font-semibold mb-2">Controls</h3>
        <p className="text-xs">Left click + drag: Rotate</p>
        <p className="text-xs">Right click + drag: Pan</p>
        <p className="text-xs">Scroll: Zoom</p>
      </div>
      <div className="absolute bottom-4 left-4 space-y-2">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={() => dimensionControlsRef.current?.resetView()}
        >
          Reset View
        </button>
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          onClick={() => dimensionControlsRef.current?.toggleDimension()}
        >
          Toggle 4D
        </button>
      </div>
      {hoveredNode && (
        <div className="absolute top-4 left-4 bg-white/80 p-2 rounded shadow">
          <p className="text-sm">Node: {hoveredNode}</p>
        </div>
      )}
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