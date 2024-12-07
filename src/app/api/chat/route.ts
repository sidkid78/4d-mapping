import { NextResponse } from 'next/server'
import { 
  Document, 
  VectorStoreIndex,
  OpenAI,
  OpenAIEmbedding,
  Metadata,
  NodeWithScore
} from 'llamaindex'

interface ChatRequest {
  messages: Array<{ content: string }>;
  documents: Array<{ content: string; id: string }>;
}

const llm = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY || '',
  model: 'gpt-4o',
  temperature: 0.7,
});

const embedModel = new OpenAIEmbedding({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'text-embedding-3-small',
});

export async function POST(req: Request) {
  try {
    const { messages, documents }: ChatRequest = await req.json();
    
    const docs = documents.map((doc) => 
      new Document({
        text: doc.content,
        metadata: { source: doc.id }
      })
    );

    const index = await VectorStoreIndex.fromDocuments(docs);
    const queryEngine = index.asQueryEngine();
    const userMessage = messages[messages.length - 1].content;
    const response = await queryEngine.query({ query: userMessage });

    return NextResponse.json({ 
      content: response.response,
      sources: response.sourceNodes?.map((node: NodeWithScore<Metadata>) => node.node.metadata) || []
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}