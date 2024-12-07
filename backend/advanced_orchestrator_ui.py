from typing import Dict  
from openai import AzureOpenAI 
import os

class AdvancedOrchestrator:
    """Advanced orchestrator for handling RAG-enhanced LLM responses.
    
    This class manages the integration with Azure OpenAI to generate responses
    based on retrieved context from RAG results.
    
    Attributes:
        ai_client: AzureOpenAI client instance for making API calls
    """

    def __init__(self):
        """Initialize the orchestrator with Azure OpenAI client."""
        self.ai_client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version="2024-08-01-preview",
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )

    async def generate_response(self, rag_result: Dict) -> Dict:
        """Generate an enhanced response using RAG results through Azure OpenAI.
        
        Takes RAG results containing query, prompt and retrieved documents to generate
        a contextually informed response using Azure OpenAI's chat completions API.
        
        Args:
            rag_result: Dictionary containing:
                - query: Original user query
                - prompt: Enhanced prompt with context
                - context: Retrieved context information
                - retrieved_docs: List of retrieved documents
                
        Returns:
            Dictionary containing:
                - query: Original query
                - response: Generated response text
                - context: Context used for generation
                - sources: List of source document titles
                
        Raises:
            Exception: If LLM response generation fails
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