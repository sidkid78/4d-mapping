from typing import Dict, List
from space_mapper import Coordinates4D
from openai import AzureOpenAI, AzureOpenAIEmbeddings   

class QueryEngine:
    """
    Engine for performing semantic, coordinate-based, and RAG queries on regulatory data.

    Uses Azure OpenAI for embeddings and completions, and a vector store for similarity search.
    Supports both semantic similarity search and 4D coordinate-based spatial queries.

    Attributes:
        config (Dict): Configuration parameters including API keys and model settings
        client (AzureOpenAI): Azure OpenAI client for embeddings and completions
    """

    def __init__(self, config: Dict):
        """
        Initialize the query engine with configuration.

        Args:
            config (Dict): Configuration containing:
                - azure_key: Azure OpenAI API key
                - azure_endpoint: Azure OpenAI endpoint URL
                - gpt_model: GPT model name for completions
                - vector_store: Vector store client for searches
                - coordinate_search_radius: Default radius for coordinate searches
                - max_coordinate_results: Maximum results for coordinate queries
        """
        self.config = config
        self.client = AzureOpenAI(
            api_key=config['azure_key'],
            api_version="2024-08-01-preview",
            azure_endpoint=config['azure_endpoint']
        )

    async def semantic_query(self, query: str, context: Dict) -> List[Dict]:
        """
        Perform semantic similarity search using query embeddings.

        Args:
            query (str): Search query text
            context (Dict): Search parameters including:
                - max_results: Maximum number of results (default: 5)
                - min_similarity: Minimum similarity threshold (default: 0.7)
                - source_filter: Optional filter for specific sources

        Returns:
            List[Dict]: List of matching documents with similarity scores
        """
        # Generate embeddings for the query
        query_embedding = await self.client.embeddings.create(
            input=query,
            model="text-embedding-3-small"
        )
        
        # Extract search parameters from context
        max_results = context.get('max_results', 5)
        min_similarity = context.get('min_similarity', 0.7)
        source_filter = context.get('source_filter', None)
        
        # Query vector database using embeddings
        query_params = {
            'vector': query_embedding.data[0].embedding,
            'min_similarity': min_similarity,
            'limit': max_results
        }
        
        if source_filter:
            query_params['filter'] = {'source': source_filter}
            
        # Execute search against vector store
        results = await self.config['vector_store'].search(**query_params)
        
        # Format and return results
        formatted_results = []
        for result in results:
            formatted_results.append({
                'id': result.id,
                'content': result.content,
                'metadata': result.metadata,
                'similarity': result.similarity
            })
            
        return formatted_results

    async def coordinate_query(self, coordinates: Coordinates4D) -> List[Dict]:
        """
        Search for documents based on 4D regulatory space coordinates.

        Args:
            coordinates (Coordinates4D): Target coordinates in regulatory space

        Returns:
            List[Dict]: List of documents with their distances from target coordinates
        """
        # Define search radius and parameters
        search_radius = self.config.get('coordinate_search_radius', 1.0)
        max_results = self.config.get('max_coordinate_results', 10)
        
        # Build coordinate search query
        query_params = {
            'coordinates': {
                'x': coordinates.x,
                'y': coordinates.y,
                'z': coordinates.z,
                't': coordinates.t
            },
            'radius': search_radius,
            'limit': max_results
        }
        
        # Execute coordinate-based search
        results = await self.config['vector_store'].coordinate_search(**query_params)
        
        # Format and return results
        formatted_results = []
        for result in results:
            formatted_results.append({
                'id': result.id,
                'coordinates': result.coordinates,
                'content': result.content,
                'metadata': result.metadata,
                'distance': result.distance
            })
            
        return formatted_results

    async def rag_query(self, query: str, documents: List[Dict]) -> str:
        """
        Perform RAG (Retrieval-Augmented Generation) query using provided documents.

        Args:
            query (str): User question to answer
            documents (List[Dict]): Retrieved documents to use as context

        Returns:
            str: Generated answer incorporating information from documents
        """
        # Prepare context from documents
        context = "\n\n".join([
            f"Document {i+1}:\n{doc['content']}" 
            for i, doc in enumerate(documents)
        ])
        
        # Construct the prompt
        prompt = f"""Use the following documents to answer the question. 
Include relevant information from the documents and cite document numbers.
If you cannot answer from the documents, say so.

Documents:
{context}

Question: {query}

Answer:"""

        # Generate response using Azure OpenAI
        response = await self.client.chat.completions.create(
            model=self.config['gpt_model'],
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers questions based on provided documents."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        return response.choices[0].message.content