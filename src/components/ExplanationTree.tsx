'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { NetworkGraph } from './visualizations/NetworkGraph';

interface ExplanationNode {
  step: string;
  reasoning: string;
  confidence: number;
  evidence: Array<{
    source: string;
    content: string;
    relevance: number;
  }>;
  subSteps: ExplanationNode[];
  visualizations?: Array<{
    type: string;
    data: any;
    layout: any;
  }>;
}

interface ExplanationTreeProps {
  node: ExplanationNode;
  depth?: number;
}

export function ExplanationTree({ node, depth = 0 }: ExplanationTreeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  return (
    <div className="ml-4 border-l-2 border-gray-200 pl-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {node.subSteps.length > 0 && (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
          <h3 className="font-semibold">{node.step}</h3>
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            node.confidence > 0.8 ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {(node.confidence * 100).toFixed(0)}%
          </span>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-600 mt-2">{node.reasoning}</p>
              
              {node.evidence.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium">Evidence:</h4>
                  <ul className="list-disc list-inside">
                    {node.evidence.map((ev, idx) => (
                      <li key={idx} className="text-sm">
                        {ev.content}
                        <span className="text-gray-500"> - {ev.source}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {node.visualizations?.map((viz, idx) => (
                <div key={idx} className="mt-4">
                  {viz.type === 'network' && (
                    <NetworkGraph 
                      nodes={viz.data.nodes}
                      edges={viz.data.edges}
                      title={viz.layout.title}
                    />
                  )}
                  {/* Add other visualization types */}
                </div>
              ))}

              {node.subSteps.map((subStep, idx) => (
                <ExplanationTree 
                  key={idx} 
                  node={subStep} 
                  depth={depth + 1} 
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 