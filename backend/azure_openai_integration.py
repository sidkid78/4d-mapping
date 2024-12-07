import os
from openai import AzureOpenAI
from typing import Dict

class AzureOpenAIIntegration:
    """Integration class for Azure OpenAI services.
    
    Handles communication with Azure OpenAI API for generating responses and processing RAG results.
    
    Attributes:
        client: AzureOpenAI client instance for making API calls
    """

    def __init__(self, config: Dict):
        """Initialize Azure OpenAI integration.
        
        Args:
            config: Dictionary containing configuration parameters
        """
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version="2024-08-01-preview", 
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )

    async def generate_response(self, prompt: str, max_tokens: int = 1000) -> str:
        """Generate a response from Azure OpenAI.
        
        Args:
            prompt: Input prompt text
            max_tokens: Maximum number of tokens in response (default: 1000)
            
        Returns:
            Generated response text
            
        Raises:
            Exception: If API call fails
        """
        try:
            response = self.client.completions.create(
                model=self.deployment_name,
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
        """Process RAG results to generate a comprehensive response.
        
        Takes RAG context and query, constructs a detailed prompt, and generates response.
        
        Args:
            rag_result: Dictionary containing prompt and context from RAG
            
        Returns:
            Generated response incorporating RAG context
        """
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

        Please provide a detailed response that addresses the query,
          incorporates the key points and relevant clauses, 
          and addresses any conflicts if present. 
          Ensure the response is clear, accurate, 
          and tailored to the user's expertise level.
        """

        response = await self.generate_response(detailed_prompt)
        return response