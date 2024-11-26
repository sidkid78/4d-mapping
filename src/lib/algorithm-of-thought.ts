import { RAGAgent } from './rag_agent';

export interface AoTConfig {
  model_name: string;
  temperature: number;
  max_tokens: number;
  rag_enabled: boolean;
  thought_steps: number;
  rag_config?: {
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
  };
}

export class QueryContext {
  constructor(
    public user_role: string,
    public expertise_level: string,
    public industry: string,
    public region: string,
    public timestamp: Date,
    public request_priority: string
  ) {}
}

export class AlgorithmOfThought {
  private config: AoTConfig;
  private ragAgent?: RAGAgent;

  constructor(config: AoTConfig) {
    this.config = config;
    if (config.rag_enabled && config.rag_config) {
      this.ragAgent = new RAGAgent(config.rag_config);
    }
  }

  async process_query(query: string, context: QueryContext) {
    try {
      // Initialize response structure
      const response = {
        thoughts: [],
        final_answer: '',
        confidence_score: 0,
        metadata: {
          processing_time: 0,
          model_used: this.config.model_name,
          rag_used: this.config.rag_enabled,
          context: {
            user_role: context.user_role,
            expertise_level: context.expertise_level,
            industry: context.industry,
            region: context.region,
            timestamp: context.timestamp,
            priority: context.request_priority
          }
        }
      };

      const startTime = Date.now();

      // If RAG is enabled and agent is initialized, enhance the query with relevant context
      if (this.config.rag_enabled && this.ragAgent) {
        const ragResult = await this.ragAgent.process_query(query, {
          expertise_level: parseInt(context.expertise_level) || 5
        });
        query = `${query}\nContext: ${ragResult.context}`;
        response.final_answer = ragResult.response;
      } else {
        // TODO: Implement non-RAG query processing logic
        response.final_answer = "Query processed successfully";
      }

      response.confidence_score = 0.95;
      response.metadata.processing_time = Date.now() - startTime;
      
      return response;
    } catch (error) {
      console.error('Error in AoT processing:', error);
      throw error;
    }
  }
} 