export interface ExplanationNode {
  step: string;
  reasoning: string;
  confidence: number;
  evidence: Array<{
    content: string;
    source: string;
    relevance: number;
  }>;
  subSteps: ExplanationNode[];
} 