import { SearchClient, AzureKeyCredential, ExtractiveQueryAnswer, ExtractiveQueryCaption, QueryType, SearchOptions, SemanticSearchOptions } from "@azure/search-documents";
import { AzureOpenAI } from "openai";
import { ExplanationNode } from '../types/explanation';
import { Coordinates4D } from '../types/shared';

interface Persona {
  type: 'legal' | 'financial' | 'compliance';
  confidence: number;
  analysis: string;
}

interface RAGResponse {
  query: string;
  semantic_results: Array<{
    id: string;
    content: string;
    coordinates: Coordinates4D;
    relevance_score: number;
  }>;
  personas: Persona[];
  visualization_data: {
    space_mapping: {
      nodes: Array<{
        id: string;
        coordinates: Coordinates4D;
        category: string;
        relevance: number;
      }>;
      edges: Array<{
        source: string;
        target: string;
        weight: number;
      }>;
    };
    heatmap_data: {
      matrix: number[][];
      categories: string[];
      requirements: string[];
    };
  };
  explanation_tree: ExplanationNode;
  response: string;
}

interface SearchDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  coordinates: Coordinates4D;
  embedding?: number[];
  _score?: number;
}

export class RAGAgent {
  private searchClient: SearchClient<SearchDocument>;
  private openai: AzureOpenAI;

  constructor(config: {
    azure_endpoint: string;
    azure_deployment: string;
    search_endpoint: string;
    search_key: string;
  }) {
    this.searchClient = new SearchClient(
      config.search_endpoint,
      "documents",
      new AzureKeyCredential(config.search_key)
    );

    this.openai = new AzureOpenAI({
      apiKey: config.azure_deployment,
      endpoint: config.azure_endpoint,
      apiVersion: "2024-08-01-preview"
    });
  }

  async process_query(query: string, context: Record<string, any>): Promise<RAGResponse> {
    // Get embeddings
    const embedding = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    });

    // Search in 4D space
    const searchOptions: SearchOptions<SearchDocument> = {
      queryType: 'semantic',
      semanticSearchOptions: {
        queryFields: ['content'],
        prioritizedFields: {
          titleFields: [],
          keywordsFields: [],
          contentFields: ['content']
        }
      },
      select: ['id', 'content', 'metadata', 'coordinates', '_score'],
      top: 5,
      includeTotalCount: true,
      queryLanguage: 'en-us',
      semanticConfiguration: 'default',
      searchFields: ['content'],
      orderBy: ['_score desc']
    };

    const searchResults = await this.searchClient.search("*", searchOptions);

    // Process results
    const documents = [];
    for await (const result of searchResults.results) {
      documents.push(result.document);
    }

    // Generate response
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: this.constructPrompt(query, documents) }
      ]
    });

    // Generate 4D visualization
    const visualizationData = await this.generate4DVisualization(documents, embedding.data[0].embedding);

    return {
      query,
      semantic_results: documents.map(doc => ({
        id: doc.id,
        content: doc.content,
        coordinates: doc.coordinates,
        relevance_score: doc._score || 0
      })),
      personas: [],
      visualization_data: visualizationData,
      explanation_tree: {
        step: "Query Analysis",
        reasoning: `Analyzing query: ${query}`,
        confidence: 0.9,
        evidence: documents.slice(0, 3).map(doc => ({
          content: doc.content,
          source: doc.id,
          relevance: doc._score || 0
        })),
        subSteps: []
      } as ExplanationNode,
      response: completion.choices[0]?.message?.content || ""
    };
  }

  private constructPrompt(query: string, documents: any[]): string {
    return `
    Query: ${query}

    Context:
    ${documents.map(doc => doc.content).join('\n\n')}

    Please provide a detailed response based on the above context.
    `;
  }

  private async generate4DVisualization(documents: any[], query_embedding: number[]): Promise<RAGResponse['visualization_data']> {
    // Generate network visualization
    const nodes = documents.map(doc => ({
      id: doc.id,
      coordinates: doc.coordinates,
      category: doc.metadata.category,
      relevance: this.calculateRelevance(doc.embedding, query_embedding)
    }));

    const edges = this.generateEdges(nodes);
    
    // Generate heatmap
    const heatmap = this.generateComplianceHeatmap(documents);

    return {
      space_mapping: { nodes, edges },
      heatmap_data: heatmap
    };
  }

  private generateEdges(nodes: any[]) {
    return nodes.flatMap((node, i) => 
      nodes.slice(i + 1).map(other => ({
        source: node.id,
        target: other.id,
        weight: this.calculateSimilarity(node.coordinates, other.coordinates)
      }))
    );
  }

  private generateComplianceHeatmap(documents: any[]) {
    const categorySet = new Set(documents.map(d => d.metadata.category));
    const requirementSet = new Set(documents.map(d => d.metadata.requirement));
    
    const categories = Array.from(categorySet);
    const requirements = Array.from(requirementSet);
    
    const matrix = requirements.map(req =>
      categories.map(cat => {
        const relevantDocs = documents.filter(d => 
          d.metadata.category === cat && 
          d.metadata.requirement === req
        );
        return relevantDocs.length ? Math.max(...relevantDocs.map(d => d.score)) : 0;
      })
    );

    return { matrix, categories, requirements };
  }

  private calculateRelevance(v1: number[], v2: number[]): number {
    // Cosine similarity
    const dotProduct = v1.reduce((sum, a, i) => sum + a * v2[i], 0);
    const mag1 = Math.sqrt(v1.reduce((sum, a) => sum + a * a, 0));
    const mag2 = Math.sqrt(v2.reduce((sum, a) => sum + a * a, 0));
    return dotProduct / (mag1 * mag2);
  }

  private calculateSimilarity(c1: Coordinates4D, c2: Coordinates4D): number {
    const dims = ['x', 'y', 'z', 'e'] as const;
    const sqSum = dims.reduce((sum, dim) => sum + Math.pow(c1[dim] - c2[dim], 2), 0);
    return 1 / (1 + Math.sqrt(sqSum));
  }
}
