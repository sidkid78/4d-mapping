import { AoTConfig } from '@/lib/algorithm-of-thought';

export const AoT_CONFIG: AoTConfig = {
  model_name: 'gpt-4',
  temperature: 0.7,
  max_tokens: 2000,
  rag_enabled: true,
  thought_steps: 3,
  rag_config: {
    search_endpoint: process.env.AZURE_SEARCH_ENDPOINT,
    search_key: process.env.AZURE_SEARCH_KEY,
    neo4j_uri: process.env.NEO4J_URI,
    neo4j_user: process.env.NEO4J_USER,
    neo4j_password: process.env.NEO4J_PASSWORD,
    azure_openai_endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azure_openai_deployment_name: 'gpt-40',
    azure_openai_api_version: '2024-08-01-preview',
    // key_vault_url: process.env.KEY_VAULT_URL,
    azure_openai_secret_name: process.env.AZURE_OPENAI_API_KEY
  }
}; 