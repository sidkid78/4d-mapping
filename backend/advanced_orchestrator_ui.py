from typing import Dict  
from openai import AzureOpenAI 
import os

class AdvancedOrchestrator:
    def __init__(self):
        self.ai_client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version="2024-08-01-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )

    async def generate_response(self, rag_result: Dict) -> Dict:
        """
        Generate a response using the RAG results through Azure OpenAI.
        """
        try:
            response = await self.ai_client.chat.completions.create(
                model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
                messages=[
                    {"role": "system", "content": "You are a regulatory compliance expert."},
                    {"role": "user", "content": rag_result["prompt"]}, 
                ],
                temperature=0.7,
                max_tokens=1000,
                top_p=0.95,
                frequency_penalty=0,
                presence_penalty=0
            )

            return {
                "query": rag_result["query"],
                "response": response.choices[0].message.content,
                "context": rag_result["context"],
                "sources": [doc["title"] for doc in rag_result["retrieved_docs"]]
            }
        
        except Exception as e:
            raise Exception(f"Failed to generate LLM response: {str(e)}")
        
    