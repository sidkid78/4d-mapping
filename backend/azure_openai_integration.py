import os
from typing import Dict, List
import openai
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from tenacity import retry, wait_random_exponential, stop_after_attempt

class AzureOpenAIIntegration:
    def __init__(self, config: Dict):
        self.config = config
        self.azure_endpoint = config["azure_openai_endpoint"]
        self.deployment_name = config["azure_openai_deployment_name"]
        self.api_version = config["azure_openai_api_version"]
        
        # Fetch API key from Azure Key Vault
        key_vault_url = config["key_vault_url"]
        secret_name = config["azure_openai_secret_name"]
        credential = DefaultAzureCredential()
        secret_client = SecretClient(vault_url=key_vault_url, credential=credential)
        self.api_key = secret_client.get_secret(secret_name).value

        openai.api_type = "azure"
        openai.api_base = self.azure_endpoint
        openai.api_version = self.api_version
        openai.api_key = self.api_key

    @retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
    async def generate_response(self, prompt: str, max_tokens: int = 1000) -> str:
        try:
            response = openai.Completion.create(
                engine=self.deployment_name,
                prompt=prompt,
                max_tokens=max_tokens,
                n=1,
                stop=None,
                temperature=0.7,
            )
            return response.choices[0].text.strip()
        except Exception as e:
            print(f"Error in generate_response: {str(e)}")
            raise

    async def process_rag_result(self, rag_result: Dict) -> str:
        prompt = rag_result["prompt"]
        context = rag_result["context"]
        
        # Construct a more detailed prompt using the RAG context
        detailed_prompt = f"""
        Based on the following context and query, provide a comprehensive and accurate response:

        Query: {prompt}

        Context:
        Key Points:
        {' '.join([f'- {point}' for point in context['key_points']])}

        Relevant Clauses:
        {' '.join([f'- {clause}' for clause in context['relevant_clauses']])}

        Conflicts:
        {' '.join([f'- {conflict}' for conflict in context.get('conflicts', [])])}

        Please provide a detailed response that addresses the query, incorporates the key points and relevant clauses, and addresses any conflicts if present. Ensure the response is clear, accurate, and tailored to the user's expertise level.
        """

        response = await self.generate_response(detailed_prompt)
        return response