'use client'

import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
import { PlotData, Layout, PlotType } from 'plotly.js';

interface NetworkNode {
  id: string;
  label: string;
  group: string;
}

interface NetworkEdge {
  from: string;
  to: string;
  value: number;
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  title?: string;
}

function createNodeTrace(nodes: NetworkNode[]): Partial<PlotData> {
  return {
    type: 'scatter',
    mode: 'text+markers',
    x: nodes.map(n => n.id),
    y: nodes.map(n => n.group),
    text: nodes.map(n => n.label),
    marker: {
      size: 20,
      symbol: 'circle'
    },
    textposition: 'top center'
  };
}

function createEdgeTrace(edge: NetworkEdge, nodes: NetworkNode[]): Partial<PlotData> {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);

  return {
    type: 'scatter',
    mode: 'lines',
    x: [edge.from, edge.to],
    y: [fromNode?.group || '', toNode?.group || ''],
    line: { width: edge.value },
    showlegend: false
  };
}

export function NetworkGraph({ nodes, edges, title }: NetworkGraphProps) {
  const data: Partial<PlotData>[] = [
    createNodeTrace(nodes),
    ...edges.map(edge => createEdgeTrace(edge, nodes))
  ];

  const layout: Partial<Layout> = {
    title: title || 'Regulatory Network',
    showlegend: true,
    hovermode: 'closest',
    height: 600,
    width: 800
  };

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ responsive: true }}
    />
  );
}