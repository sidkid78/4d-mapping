import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import neo4j from "neo4j-driver";
import { Driver } from "neo4j-driver";
import AzureOpenAI from "@azure/openai";

interface RAGConfig {
  search_endpoint?: string;
  search_key?: string;
  neo4j_uri?: string;
  neo4j_user?: string;
  neo4j_password?: string;
  azure_openai_endpoint?: string;
  azure_openai_deployment_name?: string;
  azure_openai_api_version?: string;
  key_vault_url?: string;
  azure_openai_secret_name?: string;
}

interface UserContext {
  expertise_level: number;
}

interface RAGResult {
  prompt: string;
  context: string;
  retrieved_docs: {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    score: number;
  }[];
}

interface SearchDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export class RAGAgent {
  private searchClient: SearchClient<SearchDocument>;
  private graphDb: Driver;
  private openAIClient: AzureOpenAI;
  private deploymentName: string;

  constructor(config: RAGConfig) {
    if (!config.search_endpoint || !config.search_key) {
      throw new Error("Missing required Azure Search configuration");
    }

    if (!config.neo4j_uri || !config.neo4j_user || !config.neo4j_password) {
      throw new Error("Missing required Neo4j configuration");
    }

    if (!config.azure_openai_endpoint || !config.azure_openai_deployment_name) {
      throw new Error("Missing required Azure OpenAI configuration");
    }

    this.searchClient = new SearchClient(
      config.search_endpoint,
      "documents",
      new AzureKeyCredential(config.search_key)
    );

    this.graphDb = neo4j.driver(
      config.neo4j_uri,
      neo4j.auth.basic(config.neo4j_user, config.neo4j_password)
    );

    this.openAIClient = new AzureOpenAI(
      config.azure_openai_endpoint,
      new AzureKeyCredential(config.azure_openai_secret_name || "")
    );

    this.deploymentName = config.azure_openai_deployment_name;
  }

  async process_query(query: string, userContext: UserContext): Promise<{
    query: string;
    response: string;
    context: string;
    retrieved_docs: {
      id: string;
      content: string;
      metadata: Record<string, unknown>;
      score: number; 
    }[];
  }> {
    try {
      const subQueries = await this.decompose_query(query);
      const documents = await this.retrieve_documents(subQueries);
      const rankedDocs = this.rank_documents(documents, userContext);
      const context = await this.synthesize_context(rankedDocs);
      const prompt = this.construct_prompt(query, context, userContext);

      const ragResult: RAGResult = {
        prompt,
        context,
        retrieved_docs: rankedDocs
      };

      const response = await this.process_rag_result(ragResult);

      return {
        query,
        response,
        context,
        retrieved_docs: rankedDocs
      };

    } catch (error) {
      console.error("RAG processing failed:", error);
      throw error;
    }
  }

  private async decompose_query(query: string): Promise<string[]> {
    const decompositionPrompt = `
      Break down this complex query into simpler sub-queries. Return only the sub-queries, one per line:
      Query: ${query}
    `;

    const response = await this.openAIClient.getChatCompletions(
      this.deploymentName,
      [{
        role: "user",
        content: decompositionPrompt
      }]
    );

    const subQueries = response.choices[0]?.message?.content?.split('\n').filter(q => q.trim()) || [query];
    return subQueries.length > 0 ? subQueries : [query];
  }

  private async retrieve_documents(subQueries: string[]): Promise<SearchDocument[]> {
    const documents: SearchDocument[] = [];
    
    for (const query of subQueries) {
      const searchResults = await this.searchClient.search(query);
      for await (const result of searchResults.results) {
        documents.push(result.document);
      }
    }

    return documents;
  }

  private rank_documents(documents: SearchDocument[], userContext: UserContext): SearchDocument[] {
    // Use userContext for ranking if needed
    return documents.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  private async synthesize_context(rankedDocs: SearchDocument[]): Promise<string> {
    return rankedDocs.map(doc => doc.content).join("\n");
  }

  private construct_prompt(query: string, context: string, userContext: UserContext): string {
    return `
Given the following context and user expertise level (${userContext.expertise_level}), 
please provide a comprehensive answer to this question: ${query}

Context:
${context}
`;
  }

  private async process_rag_result(ragResult: RAGResult): Promise<string> {
    const response = await this.openAIClient.getChatCompletions(
      this.deploymentName,
      [{
        role: "system",
        content: "You are a helpful assistant that provides accurate answers based on the given context."
      },
      {
        role: "user",
        content: ragResult.prompt
      }]
    );

    return response.choices[0]?.message?.content || "Unable to generate response";
  }
}
