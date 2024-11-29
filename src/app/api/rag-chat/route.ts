import { NextResponse } from 'next/server'
import { RAGAgent } from '@/lib/rag_agent'
import { Coordinates4D } from '@/types/shared';

interface RAGConfig {
  search_endpoint?: string
  search_key?: string
  neo4j_uri?: string
  neo4j_user?: string
  neo4j_password?: string
  azure_openai_endpoint?: string
  azure_openai_deployment_name?: string
  azure_openai_api_version?: string
  azure_openai_secret_name?: string
}

const config: RAGConfig = {
  search_endpoint: process.env.AZURE_SEARCH_ENDPOINT,
  search_key: process.env.AZURE_SEARCH_KEY,
  neo4j_uri: process.env.NEO4J_URI,
  neo4j_user: process.env.NEO4J_USER,
  neo4j_password: process.env.NEO4J_PASSWORD,
  azure_openai_endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azure_openai_deployment_name: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  azure_openai_api_version: process.env.AZURE_OPENAI_API_VERSION,
  azure_openai_secret_name: process.env.AZURE_OPENAI_SECRET_NAME
}

const ragAgent = new RAGAgent({
  azure_endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  azure_deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  search_endpoint: process.env.AZURE_SEARCH_ENDPOINT!,
  search_key: process.env.AZURE_SEARCH_KEY!
})

interface ChatRequest {
  message: string
  history: Array<{ role: string; content: string }>
}

interface QueryResult {
  query: string;
  response: string;
  semantic_results: Array<{
    id: string;
    content: string;
    coordinates: Coordinates4D;
    relevance_score: number;
  }>;
}

// Fallback response when search is unavailable
function getFallbackResponse(query: string) {
  return {
    response: "I apologize, but I'm currently operating in fallback mode with limited access to the knowledge base. " +
              "I can still try to help with general questions, but I may not have access to specific regulatory information.",
    context: "System is operating in fallback mode",
    retrieved_docs: []
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { message, history }: ChatRequest = await request.json()

    // Check if search service is configured
    if (!process.env.AZURE_SEARCH_ENDPOINT || !process.env.AZURE_SEARCH_KEY) {
      console.warn('Search service not configured, using fallback mode')
      return NextResponse.json(getFallbackResponse(message))
    }

    try {
      const result: QueryResult = await ragAgent.process_query(message, {
        expertise_level: 5,
      });

      return NextResponse.json({
        response: result.response,
        context: result.semantic_results.map((r: { content: string }) => r.content).join('\n'),
        retrieved_docs: result.semantic_results.map((r: { 
          id: string; 
          content: string; 
          relevance_score: number 
        }) => ({
          id: r.id,
          content: r.content,
          score: r.relevance_score
        }))
      })
    } catch (searchError) {
      console.error('Search service error:', searchError)
      return NextResponse.json(getFallbackResponse(message))
    }
  } catch (error) {
    console.error('RAG Chat Error:', error)
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    )
  }
} 