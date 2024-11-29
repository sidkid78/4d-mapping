import { RAGAgent } from '../src/lib/rag_agent';

async function testRAG() {
  const agent = new RAGAgent({
    azure_endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    azure_deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
    search_endpoint: process.env.AZURE_SEARCH_ENDPOINT!,
    search_key: process.env.AZURE_SEARCH_KEY!
  });
  
  try {
    const result = await agent.process_query(
      "What are the key compliance requirements for financial institutions?",
      { expertise_level: 5 }
    );
    
    console.log("Query Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testRAG().catch(console.error); 